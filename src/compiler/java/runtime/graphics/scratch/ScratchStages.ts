import * as PIXI from "pixi.js";
import { IWorld } from "../IWorld";
import { BUILT_IN_TRANSITIONS, ScratchTransitionView } from "./ScratchTransitionView";

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

/** A factory may finish later while interpreted constructors load their assets. */
export type ScratchStageFactory = (ready: (stage: IScratchStageLike) => void,
    failed: () => void) => void | (() => void);

type Transition = {
    target?: IScratchStageLike;
    factory?: ScratchStageFactory;
    cancelFactory?: () => void;
    detachStop?: () => void;
    /**
     * "requested": the old stage is drawn and the supplier runs in the next
     * frame; "creating": the supplier is building the stage; "playing": the
     * shader mixes the two stages. Both stand still all the time, as upstream.
     */
    phase: "requested" | "creating" | "playing";
    /** how long, and how far along, in game ticks (upstream: round(seconds * 60)) */
    ticks: number;
    tick: number;
    /** the transition shader's body, a built-in one or Transition.fromShader's */
    body: string;
    view?: ScratchTransitionView;
    frame: () => void;
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
 * Whether the stages should be stepping. False for the whole of a transition:
 * upstream holds both stages still and starts the new one's run() once the
 * transition is over.
 */
export function scratchStagesRunning(): boolean {
    return !transition;
}

/** Whether a transition is being drawn: the game clock counts its ticks. */
export function scratchTransitionPlaying(): boolean {
    return transition?.phase === "playing";
}

/** One game tick of the transition; the last one ends it and the new stage runs from the next. */
export function advanceScratchTransition(): void {
    const tr = transition;
    if (!tr || tr.phase !== "playing") return;
    if (++tr.tick >= tr.ticks) endTransition(true);
    else tr.view?.setProgress(tr.tick / tr.ticks);
}

/** Whether a transition is still fading, upstream's Window.isTransitioning(). */
export function scratchStageTransitioning(): boolean {
    return transition !== undefined;
}

export function setActiveScratchStage(stage: IScratchStageLike | undefined): void {
    if (!stage || stage === active) return;
    active?._deactivate();
    active = stage;
    stage._activate();
}

/**
 * Upstream's Game.transition: in the next frame the old stage's picture is
 * taken and `stage` is made (a factory runs then); the transition then lasts
 * round(seconds * 60) game ticks, with both stages standing still, and the new
 * stage's run() starts once it is over. Without an old stage, or without time,
 * the new stage comes at once. Requests made meanwhile are ignored.
 */
export function transitionToScratchStage(stage: IScratchStageLike | ScratchStageFactory | undefined,
    seconds: number, body: string = BUILT_IN_TRANSITIONS["fade"]): void {
    if (!stage || transition || !registryWorld || stage === active) return;
    const world = registryWorld;
    const app = world.app;
    if (!app?.ticker) return;

    const frame = () => frameTransition();
    transition = {
        target: typeof stage === "function" ? undefined : stage,
        factory: typeof stage === "function" ? stage : undefined,
        phase: "requested",
        ticks: Math.round(seconds * 60), tick: 0,
        body, frame, world,
    };
    const events = world.interpreter?.eventManager;
    if (events) {
        const stop = () => endTransition(false);
        events.once("stop", stop);
        transition.detachStop = () => events.off(stop);
    }
    // before the renderer, as the pre-render: the frame shows the mix it drew
    app.ticker.add(frame, undefined, PRE_RENDER_PRIORITY);
}

/** The stage's colour, which the renderer paints as the background: white unless set. */
function colourOf(stage: IScratchStageLike | undefined): number {
    const colour = (stage as any)?._getColor?.();
    return colour ? colour._get() & 0xffffff : 0xffffff;
}

function rootOf(stage: IScratchStageLike | undefined): PIXI.Container | undefined {
    const root = (stage as any)?.scratchLayers?.root as PIXI.Container | undefined;
    return root && !root.destroyed ? root : undefined;
}

function frameTransition() {
    const tr = transition;
    if (!tr) return;
    if (tr.phase === "requested") {
        tr.phase = "creating";
        // the old stage's picture before the supplier runs: it may move sprites over
        const renderer = tr.world.app?.renderer as PIXI.Renderer | undefined;
        const fromRoot = rootOf(active);
        if (renderer && fromRoot && tr.ticks > 0) {
            tr.view = new ScratchTransitionView(renderer, tr.world.width, tr.world.height, tr.body);
            active?._preRender?.();
            tr.view.snapshotFrom(fromRoot, colourOf(active));
        }
        const ready = (stage: IScratchStageLike) => {
            if (transition !== tr || tr.phase !== "creating") return;
            tr.target = stage;
            tr.cancelFactory = undefined;
            if (!tr.view) {
                endTransition(true);
                return;
            }
            setActiveScratchStage(stage);
            tr.phase = "playing";
            tr.world.app.stage.addChild(tr.view.mesh);
            drawTransition(tr);
        };
        if (tr.factory) {
            try {
                const cancel = tr.factory(ready, () => {
                    if (transition === tr) endTransition(false);
                });
                if (transition === tr && tr.phase === "creating") tr.cancelFactory = cancel || undefined;
            } catch (error) {
                endTransition(false);
                throw error;
            }
        } else if (tr.target) ready(tr.target);
        return;
    }
    if (tr.phase === "playing") drawTransition(tr);
}

/** The new stage as it stands, mixed with the old picture over everything else. */
function drawTransition(tr: Transition) {
    const view = tr.view;
    if (!view) return;
    // a stage shown after the mesh went up would otherwise sit on top of it
    const parent = view.mesh.parent;
    if (parent && parent.getChildIndex(view.mesh) !== parent.children.length - 1) {
        parent.setChildIndex(view.mesh, parent.children.length - 1);
    }
    tr.target?._preRender?.();
    view.drawTo(rootOf(tr.target), colourOf(tr.target));
    view.setProgress(tr.tick / tr.ticks);
}

/** Take the transition down. `switchNow` shows the new stage, also when cut short. */
function endTransition(switchNow: boolean) {
    const tr = transition;
    transition = undefined;
    if (!tr) return;
    tr.detachStop?.();
    tr.cancelFactory?.();
    if (switchNow) setActiveScratchStage(tr.target);
    try {
        tr.world.app?.ticker?.remove(tr.frame);
    } catch {
        // the app is gone with the stopped program; nothing left to detach from
    }
    if (tr.view) {
        try {
            tr.view.mesh.removeFromParent();
            tr.view.destroy();
        } catch {
            // destroyed with the renderer of a stopped program
        }
    }
}
