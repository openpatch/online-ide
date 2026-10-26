import type { Thread } from '../../../../common/interpreter/Thread';
import type { IActor } from '../IActor';
import { activeScratchStage, advanceScratchTransition, scratchStagesRunning, scratchTransitionPlaying } from './ScratchStages';

/**
 * Port of desktop internal.loop.TickClock: a tick is exactly 1/60 s of game
 * time, and real time decides how many ticks a frame runs - one per 1/60 s,
 * so a 120 Hz screen runs a tick every other frame. Game speed changes how
 * many ticks run, not their length. Window transitions keep real time.
 */
export class ScratchGameClock {
    static readonly STEP_SECONDS = 1 / 60;
    static readonly MAX_STEPS_PER_FRAME = 8;
    /** A frame longer than this (a breakpoint, a hidden tab) counts as this. */
    static readonly MAX_FRAME = 0.25;
    millis = 0;
    steps = 0;
    stepSeconds = 0;
    paused = false;
    speed = 1;
    private pendingSteps = 0;
    private owed = 0;
    private lastFrame = performance.now();
    private deadlines = new Set<{ at: number, callback: () => void }>();
    /** waits in run() or an event that hold the whole game, as upstream's game thread sleeps */
    private holds = 0;

    /** Stop game time until the returned function is called. */
    hold(): () => void {
        this.holds++;
        let released = false;
        return () => { if (!released) { released = true; this.holds--; } };
    }

    /** As upstream: pausing and resuming forget the time owed, so resuming starts without a burst. */
    pause() { if (!this.paused) this.owed = 0; this.paused = true; }
    resume() { if (this.paused) this.owed = 0; this.pendingSteps = 0; this.paused = false; }
    step() { if (this.paused) this.pendingSteps++; }
    setSpeed(speed: number) { this.speed = Number.isFinite(speed) ? Math.max(0, speed) : 0; }

    frame(realSeconds: number): number {
        if (this.paused) {
            if (this.pendingSteps > 0) {
                this.pendingSteps--;
                this.stepSeconds = ScratchGameClock.STEP_SECONDS;
                return 1;
            }
            this.stepSeconds = 0;
            return 0;
        }
        const step = ScratchGameClock.STEP_SECONDS, max = ScratchGameClock.MAX_STEPS_PER_FRAME;
        const elapsed = ScratchGameClock.snap(Math.min(Math.max(realSeconds, 0), ScratchGameClock.MAX_FRAME));
        this.owed += elapsed * this.speed;
        // the epsilon keeps a sum of exact 1/60ths from landing a hair below a whole tick
        const steps = Math.min(Math.floor(this.owed / step + 1e-9), max);
        this.owed = Math.max(0, this.owed - steps * step);
        if (steps === max) this.owed = Math.min(this.owed, step);
        this.stepSeconds = steps > 0 ? step : 0;
        return steps;
    }

    /** Near a whole number of 60 Hz frames: exactly that many, so timer jitter changes nothing. */
    private static snap(elapsed: number): number {
        const period = ScratchGameClock.STEP_SECONDS;
        const periods = Math.round(elapsed / period);
        return periods >= 1 && Math.abs(elapsed - periods * period) < 0.1 * period ? periods * period : elapsed;
    }

    advance() {
        this.steps++;
        // as upstream's Game.getTime(): ticks x 1/60, so no rounding error piles up
        this.millis = this.steps * ScratchGameClock.STEP_SECONDS * 1000;
        // The 1e-9 epsilon is upstream's: a wait of exactly the ticks that
        // passed must count as over, despite the accumulated float error.
        for (const deadline of [...this.deadlines]) if (this.millis + 1e-9 >= deadline.at) {
            this.deadlines.delete(deadline);
            deadline.callback();
        }
    }

    schedule(callback: () => void, millis: number): () => void {
        const deadline = { at: this.millis + Math.max(0, millis), callback };
        this.deadlines.add(deadline);
        return () => { this.deadlines.delete(deadline); };
    }

    /** Run one stage and then its sprites, with Java callbacks preserving order. */
    runFrame(thread: Thread, registered: IActor[] | { has(actor: IActor): boolean }) {
        const includes = (actor: IActor) => Array.isArray(registered) ? registered.includes(actor) : registered.has(actor);
        const now = performance.now();
        const elapsed = (now - this.lastFrame) / 1000;
        this.lastFrame = now;
        // while the supplier of a transition builds the next stage no time
        // passes (upstream runs it on the game thread); while the transition is
        // drawn its ticks are game time, the stages standing still
        if (this.holds > 0 || (!scratchStagesRunning() && !scratchTransitionPlaying())) return;
        let steps = this.frame(elapsed);
        while (steps > 0 && scratchTransitionPlaying()) {
            steps--;
            this.advance();
            advanceScratchTransition();
        }
        if (!scratchStagesRunning()) return;
        const stage = activeScratchStage<IActor & { sprites: IActor[] }>();
        if (!stage || !includes(stage)) {
            // as upstream, game time runs on while no stage is shown
            while (steps-- > 0) this.advance();
            return;
        }
        if (steps > 0) {
            // The batch will run ticks. Upstream's window thread polls the
            // controllers once per batch and its game thread tells the
            // GamepadListeners on the batch's first tick, before any run()
            // (Game.runTicks); a paused game runs no ticks and hands out only
            // the keys (Game.runInputOnly). Both hooks are reached through the
            // stage: it holds the runtime manager and re-applies its sort
            // order before the sprites run, as the desktop's tick() does. And
            // because the act thread of one batch has to finish before the
            // next batch starts, the IDE's speed slider paces all of this
            // together with the program.
            (stage as any).runtime?.pollAndDispatchGamepads();
            (stage as any)._applySorting?.();
        }
        const nextStep = () => {
            if (!steps--) return;
            this.advance();
            // as upstream's Stage.tick: every glide moves, then the stage runs, then its sprites
            for (const sprite of [...stage.sprites]) (sprite as any).advanceGlide?.();
            const runSprites = () => {
                const sprites = stage.sprites.filter(includes);
                let index = 0;
                const nextSprite = () => {
                    const sprite = sprites[index++];
                    if (!sprite) { (stage as any)._tickTimedTexts?.(); nextStep(); return; }
                    if (sprite.isActing && !sprite['isDestroyed']) sprite._mj$act$void$(thread, nextSprite as any);
                    else nextSprite();
                };
                nextSprite();
            };
            if (stage.isActing) stage._mj$act$void$(thread, runSprites as any);
            else runSprites();
        };
        nextStep();
    }
}

let clock = new ScratchGameClock();
export const scratchGameClock = () => clock;
export function resetScratchGameClock() { clock = new ScratchGameClock(); return clock; }
