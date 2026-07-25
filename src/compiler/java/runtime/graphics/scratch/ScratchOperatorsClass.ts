import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ObjectClass } from "../../system/javalang/ObjectClassStringClass";

/**
 * Static math/utility helpers, mirroring org.openpatch.scratch.Operators.
 * All trigonometric methods work in degrees (Scratch convention).
 */
export class ScratchOperatorsClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class Operators extends Object", comment: "Mathematische Hilfsfunktionen; alle Winkel in Grad" },

        { type: "method", signature: "static final double lerp(double start, double stop, double amt)", native: ScratchOperatorsClass._lerp, comment: "Interpoliert linear zwischen start und stop; amt liegt zwischen 0 und 1" },
        { type: "method", signature: "static final double constrain(double amt, double low, double high)", native: ScratchOperatorsClass._constrainDouble, comment: "Begrenzt den Wert auf den Bereich zwischen low und high" },
        { type: "method", signature: "static final int constrain(int amt, int low, int high)", native: ScratchOperatorsClass._constrainInt, comment: "Begrenzt den Wert auf den Bereich zwischen low und high" },
        { type: "method", signature: "static final double min(double... v)", native: ScratchOperatorsClass._min, comment: "Gibt den kleinsten der übergebenen Werte zurück" },
        { type: "method", signature: "static final double max(double... v)", native: ScratchOperatorsClass._max, comment: "Gibt den größten der übergebenen Werte zurück" },
        { type: "method", signature: "static final int min(int... v)", native: ScratchOperatorsClass._min, comment: "Gibt den kleinsten der übergebenen Werte zurück" },
        { type: "method", signature: "static final int max(int... v)", native: ScratchOperatorsClass._max, comment: "Gibt den größten der übergebenen Werte zurück" },
        { type: "method", signature: "static final double map(double value, double start1, double stop1, double start2, double stop2)", native: ScratchOperatorsClass._map, comment: "Rechnet einen Wert aus dem Bereich start1..stop1 in den Bereich start2..stop2 um" },
        { type: "method", signature: "static final int round(double x)", native: ScratchOperatorsClass._round, comment: "Rundet auf eine ganze Zahl" },
        { type: "method", signature: "static final double round(double x, int precision)", native: ScratchOperatorsClass._roundPrecision, comment: "Rundet auf die angegebene Anzahl Nachkommastellen" },
        { type: "method", signature: "static final double mod(double x, double y)", native: ScratchOperatorsClass._mod, comment: "Gibt den Rest der Division x geteilt durch y zurück" },
        { type: "method", signature: "static final int mod(int x, int y)", native: ScratchOperatorsClass._mod, comment: "Gibt den Rest der Division x geteilt durch y zurück" },
        { type: "method", signature: "static final int absOf(int x)", native: ScratchOperatorsClass._absOf, comment: "Gibt den Betrag zurück" },
        { type: "method", signature: "static final double absOf(double x)", native: ScratchOperatorsClass._absOf, comment: "Gibt den Betrag zurück" },
        { type: "method", signature: "static final double floorOf(double x)", native: ScratchOperatorsClass._floorOf, comment: "Rundet ab" },
        { type: "method", signature: "static final double ceilingOf(double x)", native: ScratchOperatorsClass._ceilingOf, comment: "Rundet auf" },
        { type: "method", signature: "static final double sqrtOf(double x)", native: ScratchOperatorsClass._sqrtOf, comment: "Gibt die Quadratwurzel zurück" },
        { type: "method", signature: "static final double sinOf(double x)", native: ScratchOperatorsClass._sinOf, comment: "Sinus des Winkels x, x in Grad" },
        { type: "method", signature: "static final double cosOf(double x)", native: ScratchOperatorsClass._cosOf, comment: "Kosinus des Winkels x, x in Grad" },
        { type: "method", signature: "static final double tanOf(double x)", native: ScratchOperatorsClass._tanOf, comment: "Tangens des Winkels x, x in Grad" },
        { type: "method", signature: "static final double asinOf(double x)", native: ScratchOperatorsClass._asinOf, comment: "Arkussinus von x, Ergebnis in Grad" },
        { type: "method", signature: "static final double acosOf(double x)", native: ScratchOperatorsClass._acosOf, comment: "Arkuskosinus von x, Ergebnis in Grad" },
        { type: "method", signature: "static final double atanOf(double x)", native: ScratchOperatorsClass._atanOf, comment: "Arkustangens von x, Ergebnis in Grad" },
        { type: "method", signature: "static final double lnOf(double x)", native: ScratchOperatorsClass._lnOf, comment: "Natürlicher Logarithmus von x" },
        { type: "method", signature: "static final double logOf(double x)", native: ScratchOperatorsClass._logOf, comment: "Zehnerlogarithmus von x" },
        { type: "method", signature: "static final double eToThePowerOf(double x)", native: ScratchOperatorsClass._eToThePowerOf, comment: "Gibt e hoch x zurück" },
        { type: "method", signature: "static final double tenToThePowerOf(double x)", native: ScratchOperatorsClass._tenToThePowerOf, comment: "Gibt 10 hoch x zurück" },
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
