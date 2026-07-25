import { describe, expect, test } from 'vitest';
import { IWorld } from '../compiler/java/runtime/graphics/IWorld';
import {
    activeScratchStage, beginScratchStages, isScratchStageActive, registerScratchStage,
    scratchStagesRunning, setActiveScratchStage, transitionToScratchStage,
} from '../compiler/java/runtime/graphics/scratch/ScratchStages';

/**
 * Which stage is on screen, without a browser. The stages are stand-ins that
 * only record when they were activated; what is under test is the bookkeeping
 * ScratchStageClass and Window rely on.
 */

class FakeStage {
    activations: number = 0;
    deactivations: number = 0;
    _activate() { this.activations++; }
    _deactivate() { this.deactivations++; }
}

/** Enough of a world for the registry: an identity plus a ticker to drive fades. */
function fakeWorld(): IWorld & { tick(): void } {
    const callbacks: (() => void)[] = [];
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
                add: (cb: () => void) => callbacks.push(cb),
                remove: (cb: () => void) => {
                    const i = callbacks.indexOf(cb);
                    if (i >= 0) callbacks.splice(i, 1);
                },
            },
        },
        tick: () => { for (const cb of callbacks.slice()) cb(); },
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

    test('a transition to the stage already showing is ignored', () => {
        const world = fakeWorld();
        beginScratchStages(world);
        const one = new FakeStage();
        registerScratchStage(one);

        transitionToScratchStage(one, 100);

        expect(scratchStagesRunning()).toBe(true);
        expect(one.activations).toBe(1);
    });
});
