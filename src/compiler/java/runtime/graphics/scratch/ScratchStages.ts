import * as PIXI from "pixi.js";
import { IWorld } from "../IWorld";

/**
 * Which of the program's stages is on screen — the job org.openpatch.scratch's
 * Applet does for the desktop library.
 *
 * A program may build as many stages as it likes; exactly one of them is the
 * active one. Only the active stage renders, runs its run() method and receives
 * keyboard and mouse events, so the stages a program is not currently showing
 * cost nothing but memory. Window.setStage()/transitionToStage() switch between
 * them, and the first stage a program constructs becomes the active one.
 *
 * The registry lives in the module rather than in the interpreter's object store
 * because sprites, pens and texts have to reach it from plain (non-interpreter)
 * methods. It is keyed on the World: a new program run creates a new World, and
 * that is what clears out the stages of the previous run.
 */

/** What the registry needs of a stage; ScratchStageClass implements it. */
export interface IScratchStageLike {
    /** Show this stage and re-apply the state it shares with the window. */
    _activate(): void;
    /** Take this stage off screen. Its sprites keep their state. */
    _deactivate(): void;
    /** Last chance to draw before PIXI paints the frame; see startPreRender. */
    _preRender?(): void;
}

let registryWorld: IWorld | undefined;
let active: IScratchStageLike | undefined;

type Transition = {
    target: IScratchStageLike;
    /** "out" fades the old stage away, "in" fades the new one up. */
    phase: "out" | "in";
    start: number;
    duration: number;
    overlay: PIXI.Graphics;
    tick: () => void;
    world: IWorld;
};

let transition: Transition | undefined;

/**
 * Start of a program run, called from the Stage constructor. Returns true when
 * this is the first stage of a new run, which is what tells the caller to reset
 * the program clock and size the window.
 */
export function beginScratchStages(world: IWorld): boolean {
    if (registryWorld === world) return false;
    endTransition(false);
    active = undefined;
    registryWorld = world;
    startPreRender(world);
    return true;
}

/**
 * Everything the active stage draws for itself — the camera transform and the
 * debug overlay — happens here, on the PIXI ticker, rather than from the stage's
 * act() method.
 *
 * act() runs from Interpreter#timerFunction, which the world ticks *before* it
 * hands the interpreter's scheduler its slice of the frame; the program's own
 * threads therefore move their sprites after act() has already drawn. PIXI then
 * paints the frame, showing sprites where they now are and a debug overlay built
 * from where they were — a hitbox trailing its sprite by exactly one frame's
 * worth of movement, which is why it got worse the faster a sprite moved.
 *
 * Between UPDATE_PRIORITY.NORMAL, where WorldClass adds the interpreter tick,
 * and UPDATE_PRIORITY.LOW, where the Application adds its renderer, is the one
 * point in the frame where the program has finished moving and nothing has been
 * painted yet.
 */
const PRE_RENDER_PRIORITY = PIXI.UPDATE_PRIORITY.LOW + 1;

let preRenderWorld: IWorld | undefined;
let preRenderTick: (() => void) | undefined;

function startPreRender(world: IWorld): void {
    stopPreRender();
    const ticker = world.app?.ticker;
    if (!ticker) return;
    preRenderWorld = world;
    // the stage on screen may change from frame to frame, so it is looked up
    // here rather than bound to the listener
    preRenderTick = () => { if (scratchStagesRunning()) active?._preRender?.(); };
    ticker.add(preRenderTick, undefined, PRE_RENDER_PRIORITY);
}

function stopPreRender(): void {
    if (preRenderTick && preRenderWorld) {
        try {
            preRenderWorld.app?.ticker?.remove(preRenderTick);
        } catch {
            // the app went with the stopped program; its ticker is gone already
        }
    }
    preRenderTick = undefined;
    preRenderWorld = undefined;
}

/**
 * Add a stage to the program. The first one becomes the active stage, mirroring
 * upstream, where the Stage constructor calls Applet.setStage() only while there
 * is no window yet.
 */
export function registerScratchStage(stage: IScratchStageLike): void {
    if (!active) setActiveScratchStage(stage);
}

export function activeScratchStage<T>(): T | undefined {
    return active as T | undefined;
}

export function isScratchStageActive(stage: IScratchStageLike | undefined): boolean {
    return stage !== undefined && stage === active;
}

/**
 * Whether the stages should be stepping. False while the old stage is fading
 * out: upstream stops calling the stage's render loop for that half of a
 * transition, so the picture that fades away is frozen.
 */
export function scratchStagesRunning(): boolean {
    return transition?.phase !== "out";
}

export function setActiveScratchStage(stage: IScratchStageLike | undefined): void {
    if (!stage || stage === active) return;
    active?._deactivate();
    active = stage;
    stage._activate();
}

/**
 * Fade to black, switch to `stage`, fade back — upstream's
 * Applet.transitionToStage, driven by the PIXI ticker because it has to keep
 * going while the stages themselves are held still.
 *
 * NOTE on the timing: upstream computes the fade with
 * `lerp(0, 255, elapsed / duration / 2)`, so one half of the transition takes
 * `2 * duration` milliseconds and the whole thing `4 * duration` — almost
 * certainly not what the parameter name suggests, but a program has to take the
 * same time in both places, so the formula is copied as it stands.
 */
export function transitionToScratchStage(stage: IScratchStageLike | undefined, duration: number): void {
    // upstream only transitions while the applet is in its RUNNING state, which
    // rules out starting a second transition on top of a running one
    if (!stage || transition || !registryWorld || stage === active) return;
    const world = registryWorld;
    const app = world.app;
    if (!app?.ticker) return;

    const overlay = new PIXI.Graphics();
    overlay.rect(0, 0, world.width, world.height).fill({ color: 0x000000 });
    overlay.alpha = 0;
    app.stage.addChild(overlay);

    const tick = () => stepTransition();
    transition = {
        target: stage, phase: "out", start: performance.now(),
        duration: Math.max(1, duration), overlay, tick, world,
    };
    app.ticker.add(tick);
}

function stepTransition() {
    const tr = transition;
    if (!tr) return;
    if (tr.overlay.destroyed) { endTransition(false); return; }

    // a stage built after the transition started would otherwise sit on top of
    // the black overlay — transitionToStage(new Level2(), …) does exactly that
    const parent = tr.overlay.parent;
    if (parent && parent.getChildIndex(tr.overlay) !== parent.children.length - 1) {
        parent.setChildIndex(tr.overlay, parent.children.length - 1);
    }

    const elapsed = performance.now() - tr.start;
    const amount = elapsed / tr.duration / 2;
    if (tr.phase === "out") {
        if (amount < 1) {
            tr.overlay.alpha = amount;
            return;
        }
        tr.overlay.alpha = 1;
        tr.phase = "in";
        tr.start = performance.now();
        setActiveScratchStage(tr.target);
        return;
    }
    if (amount < 1) {
        tr.overlay.alpha = 1 - amount;
        return;
    }
    endTransition(true);
}

/** Take the overlay down. `switchNow` finishes a transition that was cut short. */
function endTransition(switchNow: boolean) {
    const tr = transition;
    transition = undefined;
    if (!tr) return;
    if (switchNow) setActiveScratchStage(tr.target);
    try {
        tr.world.app?.ticker?.remove(tr.tick);
    } catch {
        // the app is gone with the stopped program; nothing left to detach from
    }
    if (!tr.overlay.destroyed) tr.overlay.destroy();
}
