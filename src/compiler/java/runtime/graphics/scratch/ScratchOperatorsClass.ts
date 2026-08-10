import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ObjectClass } from "../../system/javalang/ObjectClassStringClass";
import { SRC } from "./ScratchLibraryComments";

/**
 * Static math/utility helpers, mirroring org.openpatch.scratch.Operators.
 * All trigonometric methods work in degrees (Scratch convention).
 */
export class ScratchOperatorsClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class Operators extends Object", comment: SRC.operatorsClassComment },

        { type: "method", signature: "static final double lerp(double start, double stop, double amt)", native: ScratchOperatorsClass._lerp, comment: SRC.operatorsLerpComment },
        { type: "method", signature: "static final double constrain(double amt, double low, double high)", native: ScratchOperatorsClass._constrainDouble, comment: SRC.operatorsConstrainComment },
        { type: "method", signature: "static final int constrain(int amt, int low, int high)", native: ScratchOperatorsClass._constrainInt, comment: SRC.operatorsConstrain2Comment },
        { type: "method", signature: "static final double min(double... v)", native: ScratchOperatorsClass._min, comment: SRC.operatorsMinComment },
        { type: "method", signature: "static final double max(double... v)", native: ScratchOperatorsClass._max, comment: SRC.operatorsMaxComment },
        { type: "method", signature: "static final int min(int... v)", native: ScratchOperatorsClass._min, comment: SRC.operatorsMin2Comment },
        { type: "method", signature: "static final int max(int... v)", native: ScratchOperatorsClass._max, comment: SRC.operatorsMax2Comment },
        { type: "method", signature: "static final double map(double value, double start1, double stop1, double start2, double stop2)", native: ScratchOperatorsClass._map, comment: SRC.operatorsMapComment },
        { type: "method", signature: "static final int round(double x)", native: ScratchOperatorsClass._round, comment: SRC.operatorsRoundComment },
        { type: "method", signature: "static final double round(double x, int precision)", native: ScratchOperatorsClass._roundPrecision, comment: SRC.operatorsRound2Comment },
        { type: "method", signature: "static final double mod(double x, double y)", native: ScratchOperatorsClass._mod, comment: SRC.operatorsModComment },
        { type: "method", signature: "static final int mod(int x, int y)", native: ScratchOperatorsClass._mod, comment: SRC.operatorsMod2Comment },
        { type: "method", signature: "static final int absOf(int x)", native: ScratchOperatorsClass._absOf, comment: SRC.operatorsAbsOfComment },
        { type: "method", signature: "static final double absOf(double x)", native: ScratchOperatorsClass._absOf, comment: SRC.operatorsAbsOf2Comment },
        { type: "method", signature: "static final double floorOf(double x)", native: ScratchOperatorsClass._floorOf, comment: SRC.operatorsFloorOfComment },
        { type: "method", signature: "static final double ceilingOf(double x)", native: ScratchOperatorsClass._ceilingOf, comment: SRC.operatorsCeilingOfComment },
        { type: "method", signature: "static final double sqrtOf(double x)", native: ScratchOperatorsClass._sqrtOf, comment: SRC.operatorsSqrtOfComment },
        { type: "method", signature: "static final double sinOf(double x)", native: ScratchOperatorsClass._sinOf, comment: SRC.operatorsSinOfComment },
        { type: "method", signature: "static final double cosOf(double x)", native: ScratchOperatorsClass._cosOf, comment: SRC.operatorsCosOfComment },
        { type: "method", signature: "static final double tanOf(double x)", native: ScratchOperatorsClass._tanOf, comment: SRC.operatorsTanOfComment },
        { type: "method", signature: "static final double asinOf(double x)", native: ScratchOperatorsClass._asinOf, comment: SRC.operatorsAsinOfComment },
        { type: "method", signature: "static final double acosOf(double x)", native: ScratchOperatorsClass._acosOf, comment: SRC.operatorsAcosOfComment },
        { type: "method", signature: "static final double atanOf(double x)", native: ScratchOperatorsClass._atanOf, comment: SRC.operatorsAtanOfComment },
        { type: "method", signature: "static final double lnOf(double x)", native: ScratchOperatorsClass._lnOf, comment: SRC.operatorsLnOfComment },
        { type: "method", signature: "static final double logOf(double x)", native: ScratchOperatorsClass._logOf, comment: SRC.operatorsLogOfComment },
        { type: "method", signature: "static final double eToThePowerOf(double x)", native: ScratchOperatorsClass._eToThePowerOf, comment: SRC.operatorsEToThePowerOfComment },
        { type: "method", signature: "static final double tenToThePowerOf(double x)", native: ScratchOperatorsClass._tenToThePowerOf, comment: SRC.operatorsTenToThePowerOfComment },
    ];

    static type: NonPrimitiveType;

    static _lerp(start: number, stop: number, amt: number): number { return start + (stop - start) * amt; }
    static _constrainDouble(amt: number, low: number, high: number): number { return Math.max(low, Math.min(high, amt)); }
    static _constrainInt(amt: number, low: number, high: number): number { return Math.max(low, Math.min(high, amt)); }
    static _min(v: number[]): number { return Math.min(...v); }
    static _max(v: number[]): number { return Math.max(...v); }
    static _map(value: number, start1: number, stop1: number, start2: number, stop2: number): number {
        return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
    }
    static _round(x: number): number { return Math.round(x); }
    static _roundPrecision(x: number, precision: number): number {
        const f = Math.pow(10, precision);
        return Math.round(x * f) / f;
    }
    /**
     * The Scratch block, not Java's `%`: the sign follows y, so mod(-7, 3) is 2.
     * That is what makes it wrap a value into a range without a special case.
     */
    static _mod(x: number, y: number): number { return ((x % y) + y) % y; }
    static _absOf(x: number): number { return Math.abs(x); }
    static _floorOf(x: number): number { return Math.floor(x); }
    static _ceilingOf(x: number): number { return Math.ceil(x); }
    static _sqrtOf(x: number): number { return Math.sqrt(x); }
    static _sinOf(x: number): number { return Math.sin(x / 180.0 * Math.PI); }
    static _cosOf(x: number): number { return Math.cos(x / 180.0 * Math.PI); }
    static _tanOf(x: number): number { return Math.tan(x / 180.0 * Math.PI); }
    static _asinOf(x: number): number { return Math.asin(x) * 180.0 / Math.PI; }
    static _acosOf(x: number): number { return Math.acos(x) * 180.0 / Math.PI; }
    static _atanOf(x: number): number { return Math.atan(x) * 180.0 / Math.PI; }
    static _lnOf(x: number): number { return Math.log(x); }
    static _logOf(x: number): number { return Math.log(x) / Math.LN10; }
    static _eToThePowerOf(x: number): number { return Math.exp(x); }
    static _tenToThePowerOf(x: number): number { return Math.pow(10, x); }
}
