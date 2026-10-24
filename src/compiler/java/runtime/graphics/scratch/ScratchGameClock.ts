import type { Thread } from '../../../../common/interpreter/Thread';
import type { IActor } from '../IActor';
import { activeScratchStage, scratchStagesRunning } from './ScratchStages';

/** Port of desktop internal.GameClock. Window transitions keep real time. */
export class ScratchGameClock {
    static readonly STEP_SECONDS = 1 / 60;
    static readonly MAX_STEPS_PER_FRAME = 8;
    millis = 0;
    steps = 0;
    stepSeconds = 0;
    paused = false;
    speed = 1;
    private pendingSteps = 0;
    private credit = 0;
    private owed = 0;
    private lastFrame = performance.now();
    private deadlines = new Set<{ at: number, callback: () => void }>();

    pause() { this.paused = true; }
    resume() { this.pendingSteps = 0; this.paused = false; }
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
        this.owed += Math.max(0, realSeconds) * this.speed;
        this.credit += this.speed;
        const steps = Math.min(Math.floor(this.credit), ScratchGameClock.MAX_STEPS_PER_FRAME);
        if (!steps) { this.stepSeconds = 0; return 0; }
        this.credit = Math.min(this.credit - steps, 1);
        this.stepSeconds = this.owed / steps;
        this.owed = 0;
        return steps;
    }

    advance() {
        this.millis += this.stepSeconds * 1000;
        this.steps++;
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
        const stage = activeScratchStage<IActor & { sprites: IActor[] }>();
        if (!stage || !includes(stage) || !scratchStagesRunning()) return;
        let steps = this.frame(elapsed);
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
            const runSprites = () => {
                const sprites = stage.sprites.filter(includes);
                let index = 0;
                const nextSprite = () => {
                    const sprite = sprites[index++];
                    if (!sprite) { nextStep(); return; }
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
