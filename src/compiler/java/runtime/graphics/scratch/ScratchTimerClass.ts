import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ObjectClass } from "../../system/javalang/ObjectClassStringClass";

/**
 * Timing helper, mirroring org.openpatch.scratch.Timer.
 * `millis()` returns milliseconds since the program (Stage) started; the Stage
 * constructor calls ScratchTimerClass.resetProgramStart() so it restarts per run.
 */
export class ScratchTimerClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class Timer extends Object", comment: "Timer für zeitgesteuerte Abläufe" },

        { type: "method", signature: "Timer()", native: ScratchTimerClass.prototype._constructor, comment: "Erzeugt einen neuen Timer" },
        { type: "method", signature: "void reset()", native: ScratchTimerClass.prototype._reset, comment: "Setzt den Timer auf 0 zurück" },
        { type: "method", signature: "static int millis()", native: ScratchTimerClass._millis, comment: "Gibt die seit dem Programmstart vergangenen Millisekunden zurück" },
        { type: "method", signature: "boolean everyMillis(int millis)", native: ScratchTimerClass.prototype._everyMillis, comment: "Gibt alle millis Millisekunden einmal true zurück" },
        { type: "method", signature: "boolean forMillis(int millis)", native: ScratchTimerClass.prototype._forMillis, comment: "Gibt für die ersten millis Millisekunden nach dem Zurücksetzen true zurück" },
        { type: "method", signature: "boolean afterMillis(int millis)", native: ScratchTimerClass.prototype._afterMillis, comment: "Gibt true zurück, sobald seit dem Zurücksetzen millis Millisekunden vergangen sind" },
        { type: "method", signature: "boolean intervalMillis(int millis)", native: ScratchTimerClass.prototype._intervalMillis1, comment: "Wechselt alle millis Millisekunden zwischen true und false" },
        { type: "method", signature: "boolean intervalMillis(int millis, boolean skipFirst)", native: ScratchTimerClass.prototype._intervalMillis2, comment: "Wechselt alle millis Millisekunden zwischen true und false; skipFirst überspringt das erste Intervall" },
        { type: "method", signature: "boolean intervalMillis(int millis1, int millis2)", native: ScratchTimerClass.prototype._intervalMillis3, comment: "Gibt millis1 Millisekunden lang true und danach millis2 Millisekunden lang false zurück" },
        { type: "method", signature: "boolean intervalMillis(int millis1, int millis2, boolean skipFirst)", native: ScratchTimerClass.prototype._intervalMillis4, comment: "Gibt millis1 Millisekunden lang true und danach millis2 Millisekunden lang false zurück; skipFirst überspringt das erste Intervall" },
    ];

    static type: NonPrimitiveType;

    static programStart: number = (typeof performance !== "undefined") ? performance.now() : Date.now();

    static resetProgramStart() {
        ScratchTimerClass.programStart = (typeof performance !== "undefined") ? performance.now() : Date.now();
    }

    static _millis(): number {
        const now = (typeof performance !== "undefined") ? performance.now() : Date.now();
        return Math.round(now - ScratchTimerClass.programStart);
    }

    private startMillisEvery = -1;
    private startMillisFor = -1;
    private startMillisAfter = -1;
    private startMillisInterval = -1;
    private currentInterval = 0;

    _constructor() { this._reset(); return this; }

    _reset() {
        this.startMillisEvery = -1;
        this.startMillisFor = -1;
        this.startMillisAfter = -1;
        this.startMillisInterval = -1;
        this.currentInterval = 0;
    }

    _everyMillis(millis: number): boolean {
        const now = ScratchTimerClass._millis();
        if (this.startMillisEvery < 0) this.startMillisEvery = now;
        if (now >= this.startMillisEvery + millis) {
            this.startMillisEvery = now;
            return true;
        }
        return false;
    }

    _forMillis(millis: number): boolean {
        const now = ScratchTimerClass._millis();
        if (this.startMillisFor < 0) this.startMillisFor = now;
        return now < this.startMillisFor + millis;
    }

    _afterMillis(millis: number): boolean {
        const now = ScratchTimerClass._millis();
        if (this.startMillisAfter < 0) this.startMillisAfter = now;
        return now >= this.startMillisAfter + millis;
    }

    _intervalMillis1(millis: number): boolean { return this._intervalMillis4(millis, millis, false); }
    _intervalMillis2(millis: number, skipFirst: boolean): boolean { return this._intervalMillis4(millis, millis, skipFirst); }
    _intervalMillis3(millis1: number, millis2: number): boolean { return this._intervalMillis4(millis1, millis2, false); }
    _intervalMillis4(millis1: number, millis2: number, skipFirst: boolean): boolean {
        const now = ScratchTimerClass._millis();
        if (this.startMillisInterval < 0) {
            this.startMillisInterval = now;
            if (skipFirst) this.startMillisInterval -= millis1;
        }
        if (this.currentInterval === 0 && now < this.startMillisInterval + millis1) {
            return true;
        } else if (this.currentInterval === 0) {
            this.currentInterval = 1;
            this.startMillisInterval = now;
            return false;
        } else if (this.currentInterval === 1 && now < this.startMillisInterval + millis2) {
            return false;
        } else {
            this.currentInterval = 0;
            this.startMillisInterval = now;
            return true;
        }
    }
}
