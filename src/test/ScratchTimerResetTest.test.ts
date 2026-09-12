import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { IWorld } from '../compiler/java/runtime/graphics/IWorld';
import { ScratchCostumes } from '../compiler/java/runtime/graphics/scratch/ScratchCostumes';
import { ScratchStageClass } from '../compiler/java/runtime/graphics/scratch/ScratchStageClass';
import { ScratchTimerClass } from '../compiler/java/runtime/graphics/scratch/ScratchTimerClass';

/**
 * Timer.millis() counts from the start of the program, so a program that waits
 * for a moment has to wait for it again on the next run. The clock is reset from
 * the Stage constructor, but only for the *first* stage of a run — a program
 * building a second stage must not have the clock pulled from under it.
 *
 * The interpreter outlives a run, so the run boundary is the World: a new run
 * builds a new one. Where the clock is not reset with it, everything a program
 * times is already in the past on its second run: `Timer.millis() > 2500`
 * answers true in the first frame, and a stage transition that should come after
 * two and a half seconds happens before the program has drawn anything.
 */

/** Enough of a world to get through the Stage constructor. */
function fakeWorld(): IWorld {
    const children: any[] = [];
    return {
        width: 480, height: 360,
        mouseManager: { internalMouseListeners: [] },
        _setBackgroundColor: () => { },
        app: {
            stage: {
                addChild: (c: any) => { children.push(c); return c; },
                children,
                getChildIndex: (c: any) => children.indexOf(c),
                setChildIndex: () => { },
            },
            ticker: { add: () => { }, remove: () => { } },
        },
    } as any;
}

/** An interpreter is little more than an object store here. */
function fakeInterpreter(world: IWorld | undefined) {
    const store = new Map<string, any>();
    if (world) store.set("WorldClass", world);
    return {
        objectStore: store,
        retrieveObject: (key: string) => store.get(key),
        storeObject: (key: string, value: any) => store.set(key, value),
        deleteObject: (key: string) => store.delete(key),
        keyboardManager: undefined,
        printManager: undefined,
    } as any;
}

/** The thread the constructor gets handed; it only parks and unparks it. */
function fakeThread(interpreter: any) {
    return { scheduler: { interpreter }, state: 0, s: [], classes: {} } as any;
}

/**
 * Build a stage the way the compiler does: the JS constructor for the fields,
 * then the Java one. Returns once the constructor's asset loading has settled,
 * so the next stage starts from a finished one.
 */
async function buildStage(interpreter: any): Promise<ScratchStageClass> {
    const stage = new ScratchStageClass();
    await new Promise<void>(resolve => {
        stage._cj$_constructor_$Stage$int$int(fakeThread(interpreter), () => resolve(), 480, 360);
    });
    return stage;
}

describe('Scratch program clock', () => {

    let now = 0;

    beforeEach(() => {
        now = 1000;
        vi.spyOn(performance, 'now').mockImplementation(() => now);
        // there is nothing to fetch the spritesheets from here
        vi.spyOn(ScratchCostumes, 'load').mockResolvedValue();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('starts where the program starts, not where the loading did', async () => {
        // The thread is parked in the base constructor until the spritesheets are
        // there, so a clock started before the wait is already that old when the
        // program gets its first frame.
        vi.mocked(ScratchCostumes.load).mockImplementation(async () => { now += 18000; });

        await buildStage(fakeInterpreter(fakeWorld()));

        expect(ScratchTimerClass._millis()).toBe(0);
    });

    test('starts at zero for the first stage of a run', async () => {
        now = 5000;
        await buildStage(fakeInterpreter(fakeWorld()));

        expect(ScratchTimerClass._millis()).toBe(0);

        now = 5400;
        expect(ScratchTimerClass._millis()).toBe(400);
    });

    test('keeps running when the program builds a second stage', async () => {
        const interpreter = fakeInterpreter(fakeWorld());
        await buildStage(interpreter);

        // the program has been going for a while and now builds the stage it
        // means to transition to later
        now += 2000;
        await buildStage(interpreter);

        expect(ScratchTimerClass._millis()).toBe(2000);
    });

    test('starts at zero again on the next run of the program', async () => {
        const first = fakeInterpreter(fakeWorld());
        await buildStage(first);

        // the run ends somewhere past the two and a half seconds a program might
        // be waiting for, and the next one begins with a world of its own
        now += 9000;
        expect(ScratchTimerClass._millis()).toBe(9000);

        const second = fakeInterpreter(fakeWorld());
        await buildStage(second);

        expect(ScratchTimerClass._millis()).toBe(0);
    });

    test('a program that waits for 2500ms waits for them on every run', async () => {
        /** What a stage's run() would ask on each frame. */
        const timeToSwitch = () => ScratchTimerClass._millis() > 2500;

        const runOnce = async () => {
            await buildStage(fakeInterpreter(fakeWorld()));
            const atFirstFrame = timeToSwitch();

            now += 2000;
            const atTwoSeconds = timeToSwitch();

            now += 1000;
            const atThreeSeconds = timeToSwitch();

            // the program is stopped some time later
            now += 30000;
            return { atFirstFrame, atTwoSeconds, atThreeSeconds };
        };

        expect(await runOnce()).toEqual({ atFirstFrame: false, atTwoSeconds: false, atThreeSeconds: true });
        expect(await runOnce()).toEqual({ atFirstFrame: false, atTwoSeconds: false, atThreeSeconds: true });
        expect(await runOnce()).toEqual({ atFirstFrame: false, atTwoSeconds: false, atThreeSeconds: true });
    });
});
