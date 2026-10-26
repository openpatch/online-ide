import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ObjectClass } from "../../system/javalang/ObjectClassStringClass";
import { SRC } from "./ScratchLibraryComments";
import { resetScratchGameClock, ScratchGameClock, scratchGameClock } from './ScratchGameClock';

/**
 * Timing helper, mirroring org.openpatch.scratch.Timer (7.0). All durations are
 * seconds of game time; the game clock drives them, and the Stage constructor
 * calls ScratchTimerClass.resetProgramStart() so the clock restarts per run.
 *
 * The instance methods follow the desktop's Timer exactly: a per-instance start,
 * NaN sentinels for the phase timers and the same 1e-9 epsilon.
 */
export class ScratchTimerClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch", signature: "class Timer extends Object", comment: SRC.timerClassComment },

        { type: "method", signature: "Timer()", native: ScratchTimerClass.prototype._constructor, comment: SRC.timerConstructorComment },
        { type: "method", signature: "void reset()", native: ScratchTimerClass.prototype._reset, comment: SRC.timerResetComment },
        { type: "method", signature: "double getSeconds()", native: ScratchTimerClass.prototype._getSeconds, comment: SRC.timerGetSecondsComment },
        { type: "method", signature: "boolean every(double seconds)", native: ScratchTimerClass.prototype._every, comment: SRC.timerEveryComment },
        { type: "method", signature: "boolean during(double seconds)", native: ScratchTimerClass.prototype._during, comment: SRC.timerDuringComment },
        { type: "method", signature: "boolean after(double seconds)", native: ScratchTimerClass.prototype._after, comment: SRC.timerAfterComment },
        { type: "method", signature: "boolean interval(double seconds)", native: ScratchTimerClass.prototype._interval1, comment: SRC.timerIntervalComment },
        { type: "method", signature: "boolean interval(double on, double off)", native: ScratchTimerClass.prototype._interval2, comment: SRC.timerInterval2Comment },
    ];

    static type: NonPrimitiveType;

    static programStart: number = (typeof performance !== "undefined") ? performance.now() : Date.now();

    static resetProgramStart() {
        ScratchTimerClass.programStart = (typeof performance !== "undefined") ? performance.now() : Date.now();
        resetScratchGameClock();
    }

    /** Internal: milliseconds of game time; not declared to Java any more. */
    static _millis(): number {
        return Math.trunc(scratchGameClock().millis);
    }

    /** Game time in seconds, as upstream's Game.getTime(): ticks x 1/60. */
    static _now(): number {
        return scratchGameClock().steps * ScratchGameClock.STEP_SECONDS;
    }

    private start = 0;
    private everyStart = NaN;
    private duringStart = NaN;
    private afterStart = NaN;
    private intervalStart = NaN;
    private intervalOff = false;

    _constructor() { this._reset(); return this; }

    _reset() {
        this.start = ScratchTimerClass._now();
        this.everyStart = NaN;
        this.duringStart = NaN;
        this.afterStart = NaN;
        this.intervalStart = NaN;
        this.intervalOff = false;
    }

    _getSeconds(): number {
        return ScratchTimerClass._now() - this.start;
    }

    _every(seconds: number): boolean {
        const t = ScratchTimerClass._now();
        if (Number.isNaN(this.everyStart)) this.everyStart = t;
        if (t >= this.everyStart + seconds - 1e-9) {
            this.everyStart = t;
            return true;
        }
        return false;
    }

    _during(seconds: number): boolean {
        const t = ScratchTimerClass._now();
        if (Number.isNaN(this.duringStart)) this.duringStart = t;
        return t < this.duringStart + seconds - 1e-9;
    }

    _after(seconds: number): boolean {
        const t = ScratchTimerClass._now();
        if (Number.isNaN(this.afterStart)) this.afterStart = t;
        return t >= this.afterStart + seconds - 1e-9;
    }

    _interval1(seconds: number): boolean { return this._interval2(seconds, seconds); }

    _interval2(on: number, off: number): boolean {
        const t = ScratchTimerClass._now();
        if (Number.isNaN(this.intervalStart)) this.intervalStart = t;
        while (true) {
            const phase = this.intervalOff ? off : on;
            if (t < this.intervalStart + phase - 1e-9 || phase <= 0 && on <= 0 && off <= 0) {
                return !this.intervalOff;
            }
            this.intervalStart += phase;
            this.intervalOff = !this.intervalOff;
        }
    }
}
