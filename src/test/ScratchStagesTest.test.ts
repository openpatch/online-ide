import * as PIXI from 'pixi.js';
import { describe, expect, test, vi } from 'vitest';
import { IWorld } from '../compiler/java/runtime/graphics/IWorld';
import {
    activeScratchStage, advanceScratchTransition, beginScratchStages, isScratchStageActive, registerScratchStage,
    scratchStagesRunning, scratchStageTransitioning, scratchTransitionPlaying, setActiveScratchStage,
    transitionToScratchStage,
} from '../compiler/java/runtime/graphics/scratch/ScratchStages';

/**
 * Which stage is on screen, without a browser. The stages are stand-ins that
 * only record when they were activated; what is under test is the bookkeeping
 * ScratchStageClass and Window rely on.
 */

class FakeStage {
    /** what a transition draws of the stage */
    scratchLayers = { root: new PIXI.Container() };
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

/** A world that can draw: the transition takes its pictures through the renderer. */
function drawingWorld(): FakeWorld & { renders: any[] } {
    const world = fakeWorld() as FakeWorld & { renders: any[] };
    world.renders = [];
    (world.app as any).renderer = { render: (options: any) => world.renders.push(options) };
    return world;
}

/** The game clock's ticks while a transition is drawn. */
function transitionTicks(count: number) {
    for (let i = 0; i < count; i++) advanceScratchTransition();
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

    test('a transition holds both stages still for round(seconds * 60) game ticks, then the new one runs', () => {
        const world = drawingWorld();
        beginScratchStages(world);
        const one = new FakeStage(), two = new FakeStage();
        registerScratchStage(one);
        registerScratchStage(two);

        transitionToScratchStage(two, 0.5);
        expect(scratchStagesRunning()).toBe(false);
        expect(scratchTransitionPlaying()).toBe(false);
        expect(activeScratchStage()).toBe(one);

        world.tick();       // the next frame: the old picture, then the new stage under the shader
        expect(world.renders[0].container).toBe(one.scratchLayers.root);
        expect(activeScratchStage()).toBe(two);
        expect(scratchTransitionPlaying()).toBe(true);
        expect(scratchStagesRunning()).toBe(false);
        expect((world.app.stage as any).children.at(-1)).toBeInstanceOf(PIXI.Mesh);

        transitionTicks(29);
        expect(scratchStageTransitioning()).toBe(true);
        transitionTicks(1); // tick 30 of 30
        expect(scratchStageTransitioning()).toBe(false);
        expect(scratchStagesRunning()).toBe(true);
        expect(activeScratchStage()).toBe(two);
        expect(two.activations).toBe(1);
    });

    test('without time, or without an old picture, the new stage comes at once', () => {
        const world = drawingWorld();
        beginScratchStages(world);
        const one = new FakeStage(), two = new FakeStage(), three = new FakeStage();
        registerScratchStage(one);

        transitionToScratchStage(two, 0);
        world.tick();
        expect(activeScratchStage()).toBe(two);
        expect(scratchStageTransitioning()).toBe(false);

        // a world that cannot draw has no picture to mix
        const blind = fakeWorld();
        beginScratchStages(blind);
        registerScratchStage(one);
        transitionToScratchStage(three, 1);
        blind.tick();
        expect(activeScratchStage()).toBe(three);
        expect(scratchStageTransitioning()).toBe(false);
    });

    test('the pre-render of a held stage is left out; the transition draws it into its picture', () => {
        const world = drawingWorld();
        beginScratchStages(world);
        const one = new FakeStage(), two = new FakeStage();
        registerScratchStage(one);
        registerScratchStage(two);

        transitionToScratchStage(two, 1);
        world.tick();
        world.tick();
        expect(one.preRenders).toBe(1);     // once, for the old picture
        expect(two.preRenders).toBe(2);     // once per frame it is mixed in
        expect(world.renders.at(-1).container).toBe(two.scratchLayers.root);
    });

    test('a supplier runs in the next frame, stays reserved while loading and starts the transition when ready', () => {
        const world = drawingWorld();
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
        transitionToScratchStage(factory, 0.25);
        transitionToScratchStage(ignored, 100);
        expect(factory).not.toHaveBeenCalled();
        world.tick();
        expect(factory).toHaveBeenCalledTimes(1);
        world.tick();
        expect(scratchStagesRunning()).toBe(false);
        expect(scratchTransitionPlaying()).toBe(false);   // no time passes while it loads
        expect(activeScratchStage()).toBe(first);
        finish(next);
        expect(activeScratchStage()).toBe(next);
        expect(scratchTransitionPlaying()).toBe(true);
        transitionToScratchStage(ignored, 100);
        transitionTicks(15);
        expect(scratchStageTransitioning()).toBe(false);
        expect(ignored).not.toHaveBeenCalled();
    });

    test('a new run cancels a pending supplier and ignores its late completion', () => {
        const world = drawingWorld();
        beginScratchStages(world);
        const first = new FakeStage(), stale = new FakeStage(), fresh = new FakeStage();
        registerScratchStage(first);
        const cancel = vi.fn();
        let finish!: (stage: FakeStage) => void;
        transitionToScratchStage(ready => { finish = ready; return cancel; }, 1);
        world.tick();
        beginScratchStages(fakeWorld());
        registerScratchStage(fresh);
        expect(cancel).toHaveBeenCalledOnce();
        finish(stale);
        expect(activeScratchStage()).toBe(fresh);
        expect(stale.activations).toBe(0);
        expect(scratchStageTransitioning()).toBe(false);
    });

    test('a failed supplier releases the transition', () => {
        const world = drawingWorld();
        beginScratchStages(world);
        const first = new FakeStage();
        registerScratchStage(first);
        transitionToScratchStage(() => { throw new Error('failed constructor'); }, 1);
        expect(() => world.tick()).toThrow('failed constructor');
        expect(scratchStageTransitioning()).toBe(false);
        expect(scratchStagesRunning()).toBe(true);
        expect(activeScratchStage()).toBe(first);
        expect((world.app.stage as any).children.some((c: any) => c instanceof PIXI.Mesh)).toBe(false);
    });
});
