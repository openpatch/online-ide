import * as PIXI from 'pixi.js';
import { describe, expect, test, vi } from 'vitest';
import { IWorld } from '../compiler/java/runtime/graphics/IWorld';
import {
    activeScratchStage, beginScratchStages, isScratchStageActive, registerScratchStage,
    scratchStagesRunning, scratchStageTransitioning, setActiveScratchStage, transitionToScratchStage,
} from '../compiler/java/runtime/graphics/scratch/ScratchStages';

/**
 * Which stage is on screen, without a browser. The stages are stand-ins that
 * only record when they were activated; what is under test is the bookkeeping
 * ScratchStageClass and Window rely on.
 */

class FakeStage {
    activations: number = 0;
    deactivations: number = 0;
    preRenders: number = 0;
    _activate() { this.activations++; }
    _deactivate() { this.deactivations++; }
    _preRender() { this.preRenders++; }
}

type FakeWorld = IWorld & {
    tick(): void;
    /** What each ticker listener asked to run at; see the pre-render test. */
    priorities(): number[];
};

/** Enough of a world for the registry: an identity plus a ticker to drive fades. */
function fakeWorld(): FakeWorld {
    const listeners: { cb: () => void, priority: number }[] = [];
    const children: any[] = [];
    return {
        width: 480, height: 360,
        app: {
            stage: {
                addChild: (c: any) => { children.push(c); return c; },
                children,
                getChildIndex: (c: any) => children.indexOf(c),
                setChildIndex: () => { },
            },
            ticker: {
                add: (cb: () => void, _context?: unknown, priority: number = 0) =>
                    listeners.push({ cb, priority }),
                remove: (cb: () => void) => {
                    const i = listeners.findIndex(l => l.cb === cb);
                    if (i >= 0) listeners.splice(i, 1);
                },
            },
        },
        tick: () => { for (const l of listeners.slice()) l.cb(); },
        priorities: () => listeners.map(l => l.priority),
    } as any;
}

const sleep = (millis: number) => new Promise(resolve => setTimeout(resolve, millis));

describe('Scratch stages', () => {

    test('the first stage of a run goes on screen, later ones wait', () => {
        beginScratchStages(fakeWorld());
        const one = new FakeStage(), two = new FakeStage();

        registerScratchStage(one);
        registerScratchStage(two);

        expect(activeScratchStage()).toBe(one);
        expect(one.activations).toBe(1);
        expect(two.activations).toBe(0);
        expect(isScratchStageActive(two)).toBe(false);
    });

    test('setStage swaps which stage is on screen', () => {
        beginScratchStages(fakeWorld());
        const one = new FakeStage(), two = new FakeStage();
        registerScratchStage(one);
        registerScratchStage(two);

        setActiveScratchStage(two);

        expect(activeScratchStage()).toBe(two);
        expect(one.deactivations).toBe(1);
        expect(two.activations).toBe(1);

        // setting the stage that is already showing changes nothing
        setActiveScratchStage(two);
        expect(two.activations).toBe(1);
        expect(two.deactivations).toBe(0);
    });

    test('a new run forgets the stages of the previous one', () => {
        beginScratchStages(fakeWorld());
        const first = new FakeStage();
        registerScratchStage(first);
        expect(activeScratchStage()).toBe(first);

        expect(beginScratchStages(fakeWorld())).toBe(true);
        expect(activeScratchStage()).toBeUndefined();

        const second = new FakeStage();
        registerScratchStage(second);
        expect(activeScratchStage()).toBe(second);
    });

    test('beginScratchStages reports the first stage of a run only once', () => {
        const world = fakeWorld();
        expect(beginScratchStages(world)).toBe(true);
        expect(beginScratchStages(world)).toBe(false);
    });

    test('transitionToStage holds the stages still, then swaps them halfway', async () => {
        const world = fakeWorld();
        beginScratchStages(world);
        const one = new FakeStage(), two = new FakeStage();
        registerScratchStage(one);
        registerScratchStage(two);

        // one millisecond per half, so a short wait is enough to end each of them
        transitionToScratchStage(two, 1);
        expect(scratchStagesRunning()).toBe(false);
        expect(activeScratchStage()).toBe(one);

        await sleep(10);
        world.tick();       // fade out is over: the new stage comes up
        expect(activeScratchStage()).toBe(two);
        expect(scratchStagesRunning()).toBe(true);

        await sleep(10);
        world.tick();       // fade in is over: the overlay goes away
        expect(activeScratchStage()).toBe(two);
        expect(scratchStagesRunning()).toBe(true);

        // and the ticker callback is gone, so a later tick does nothing
        world.tick();
        expect(two.activations).toBe(1);
    });

    test('the stage on screen is asked to draw once per frame, just before the frame is', () => {
        const world = fakeWorld();
        beginScratchStages(world);
        const one = new FakeStage(), two = new FakeStage();
        registerScratchStage(one);
        registerScratchStage(two);

        // between the interpreter tick WorldClass adds (NORMAL) and the renderer
        // the Application adds (LOW): the sprites have moved, nothing is painted
        expect(world.priorities()).toEqual([PIXI.UPDATE_PRIORITY.LOW + 1]);

        world.tick();
        world.tick();

        expect(one.preRenders).toBe(2);
        expect(two.preRenders).toBe(0);     // the stage waiting off screen draws nothing
    });

    test('the stage held still by a transition does not draw either', async () => {
        const world = fakeWorld();
        beginScratchStages(world);
        const one = new FakeStage(), two = new FakeStage();
        registerScratchStage(one);
        registerScratchStage(two);

        transitionToScratchStage(two, 1);
        world.tick();
        expect(one.preRenders).toBe(0);

        await sleep(10);
        world.tick();       // the fade out is over and the new stage is up
        world.tick();
        expect(two.preRenders).toBeGreaterThan(0);
    });

    test('a new run stops drawing the stages of the previous one', () => {
        const first = fakeWorld();
        beginScratchStages(first);
        const one = new FakeStage();
        registerScratchStage(one);

        beginScratchStages(fakeWorld());
        first.tick();

        expect(first.priorities()).toEqual([]);
        expect(one.preRenders).toBe(0);
    });

    test('a transition to the stage already showing is ignored', () => {
        const world = fakeWorld();
        beginScratchStages(world);
        const one = new FakeStage();
        registerScratchStage(one);

        transitionToScratchStage(one, 100);

        expect(scratchStagesRunning()).toBe(true);
        expect(one.activations).toBe(1);
    });

    test('a supplier runs once at black, stays reserved while loading and starts the fade when ready', () => {
        let now = 0;
        const clock = vi.spyOn(performance, 'now').mockImplementation(() => now);
        try {
            const world = fakeWorld();
            beginScratchStages(world);
            const first = new FakeStage(), next = new FakeStage();
            registerScratchStage(first);
            const ignored = vi.fn();
            let finish!: (stage: FakeStage) => void;
            const factory = vi.fn(ready => {
                expect(scratchStageTransitioning()).toBe(true);
                expect(activeScratchStage()).toBe(first);
                transitionToScratchStage(ignored, 100);
                finish = ready;
            });
            transitionToScratchStage(factory, 100);
            transitionToScratchStage(ignored, 100);
            expect(factory).not.toHaveBeenCalled();
            now = 200;
            world.tick();
            expect(factory).not.toHaveBeenCalled();
            expect((world.app.stage as any).children.at(-1).alpha).toBe(1);
            world.tick();
            expect(factory).toHaveBeenCalledTimes(1);
            now = 2000;
            world.tick();
            expect(scratchStagesRunning()).toBe(false);
            expect(activeScratchStage()).toBe(first);
            finish(next);
            expect(activeScratchStage()).toBe(next);
            expect(scratchStagesRunning()).toBe(true);
            transitionToScratchStage(ignored, 100);
            now = 2100;
            world.tick();
            expect(scratchStageTransitioning()).toBe(true);
            now = 2200;
            world.tick();
            expect(scratchStageTransitioning()).toBe(false);
            expect(ignored).not.toHaveBeenCalled();
        } finally { clock.mockRestore(); }
    });

    test('a new run cancels a pending supplier and ignores its late completion', () => {
        const clock = vi.spyOn(performance, 'now').mockReturnValue(0);
        try {
            const world = fakeWorld();
            beginScratchStages(world);
            const first = new FakeStage(), stale = new FakeStage(), fresh = new FakeStage();
            registerScratchStage(first);
            const cancel = vi.fn();
            let finish!: (stage: FakeStage) => void;
            transitionToScratchStage(ready => { finish = ready; return cancel; }, 100);
            clock.mockReturnValue(200);
            world.tick();
            world.tick();
            beginScratchStages(fakeWorld());
            registerScratchStage(fresh);
            expect(cancel).toHaveBeenCalledOnce();
            finish(stale);
            expect(activeScratchStage()).toBe(fresh);
            expect(stale.activations).toBe(0);
            expect(scratchStageTransitioning()).toBe(false);
        } finally { clock.mockRestore(); }
    });

    test('a failed supplier removes the overlay and releases the transition', () => {
        const clock = vi.spyOn(performance, 'now').mockReturnValue(0);
        try {
            const world = fakeWorld();
            beginScratchStages(world);
            const first = new FakeStage();
            registerScratchStage(first);
            transitionToScratchStage(() => { throw new Error('failed constructor'); }, 100);
            clock.mockReturnValue(200);
            world.tick();
            expect(() => world.tick()).toThrow('failed constructor');
            expect(scratchStageTransitioning()).toBe(false);
            expect(scratchStagesRunning()).toBe(true);
            expect(activeScratchStage()).toBe(first);
        } finally { clock.mockRestore(); }
    });
});
