import { CallbackFunction } from "../../../../common/interpreter/StepFunction";
import { Thread } from "../../../../common/interpreter/Thread";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ObjectClass, ObjectClassOrNull, StringClass } from "../../system/javalang/ObjectClassStringClass";

/**
 * Immutable 2D vector, mirroring org.openpatch.scratch.Vector2.
 * All angle arguments/results are in degrees (Scratch convention).
 */
export class ScratchVector2Class extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class Vector2 extends Object", comment: "Unveränderlicher 2D-Vektor; alle Winkel in Grad" },

        { type: "method", signature: "Vector2()", native: ScratchVector2Class.prototype._c0, comment: "Erzeugt den Nullvektor" },
        { type: "method", signature: "Vector2(double x, double y)", native: ScratchVector2Class.prototype._c2, comment: "Erzeugt einen Vektor mit den angegebenen Koordinaten" },
        { type: "method", signature: "Vector2(Vector2 v)", native: ScratchVector2Class.prototype._cCopy, comment: "Erzeugt eine Kopie des übergebenen Vektors" },

        { type: "method", signature: "static Vector2 fromPolar(double magnitude, double angle)", native: ScratchVector2Class._fromPolar, comment: "Erzeugt einen Vektor aus Länge und Winkel (in Grad)" },

        { type: "method", signature: "double length()", native: ScratchVector2Class.prototype._length, comment: "Gibt die Länge des Vektors zurück" },
        { type: "method", signature: "double lengthSq()", native: ScratchVector2Class.prototype._lengthSq, comment: "Gibt das Quadrat der Länge zurück (schneller als length())" },
        { type: "method", signature: "double distanceSq(Vector2 v)", native: ScratchVector2Class.prototype._distanceSq, comment: "Gibt das Quadrat des Abstands zu v zurück" },
        { type: "method", signature: "double distance(Vector2 v)", native: ScratchVector2Class.prototype._distance, comment: "Gibt den Abstand zu v zurück" },
        { type: "method", signature: "double angle()", native: ScratchVector2Class.prototype._angle, comment: "Gibt den Winkel des Vektors in Grad zurück" },
        { type: "method", signature: "Vector2 unitVector()", native: ScratchVector2Class.prototype._unitVector, comment: "Gibt einen Vektor gleicher Richtung mit der Länge 1 zurück" },
        { type: "method", signature: "Vector2 normalVector()", native: ScratchVector2Class.prototype._normalVector, comment: "Gibt einen dazu senkrechten Vektor zurück" },
        { type: "method", signature: "Vector2 add(Vector2 v)", native: ScratchVector2Class.prototype._add, comment: "Gibt die Summe beider Vektoren als neuen Vektor zurück" },
        { type: "method", signature: "Vector2 sub(Vector2 v)", native: ScratchVector2Class.prototype._sub, comment: "Gibt die Differenz beider Vektoren als neuen Vektor zurück" },
        { type: "method", signature: "Vector2 multiply(double scalar)", native: ScratchVector2Class.prototype._multiply, comment: "Gibt den mit scalar multiplizierten Vektor als neuen Vektor zurück" },
        { type: "method", signature: "double dot(Vector2 v)", native: ScratchVector2Class.prototype._dot, comment: "Gibt das Skalarprodukt beider Vektoren zurück" },
        { type: "method", signature: "Vector2 rotateBy(double angle)", native: ScratchVector2Class.prototype._rotateBy, comment: "Gibt den um angle Grad gedrehten Vektor als neuen Vektor zurück" },
        { type: "method", signature: "Vector2 rotateTo(double angle)", native: ScratchVector2Class.prototype._rotateTo, comment: "Gibt einen Vektor gleicher Länge mit dem Winkel angle (in Grad) zurück" },
        { type: "method", signature: "Vector2 reverse()", native: ScratchVector2Class.prototype._reverse, comment: "Gibt den entgegengesetzten Vektor zurück" },
        { type: "method", signature: "double getX()", native: ScratchVector2Class.prototype._getX, comment: "Gibt die x-Koordinate zurück" },
        { type: "method", signature: "double getY()", native: ScratchVector2Class.prototype._getY, comment: "Gibt die y-Koordinate zurück" },
        { type: "method", signature: "Vector2 clone()", native: ScratchVector2Class.prototype._clone, comment: "Gibt eine Kopie des Vektors zurück" },
        { type: "method", signature: "boolean equals(Object obj)", java: ScratchVector2Class.prototype._mj$equals$boolean$Object, comment: "Gibt genau dann true zurück, wenn beide Vektoren gleich sind" },
        { type: "method", signature: "String toString()", java: ScratchVector2Class.prototype._mj$toString$String$, comment: "Gibt den Vektor als Zeichenkette zurück" },
        { type: "method", signature: "int hashCode()", native: ScratchVector2Class.prototype._hashCode, comment: "Gibt den Hashwert des Vektors zurück" },
    ];

    static type: NonPrimitiveType;

    x: number = 0;
    y: number = 0;

    constructor(x: number = 0, y: number = 0) {
        super();
        this.x = x;
        this.y = y;
    }

    _c0() { this.x = 0; this.y = 0; return this; }
    _c2(x: number, y: number) { this.x = x; this.y = y; return this; }
    _cCopy(v: ScratchVector2Class) { this.x = v.x; this.y = v.y; return this; }

    static _fromPolar(magnitude: number, angleDeg: number): ScratchVector2Class {
        const a = angleDeg / 180 * Math.PI;
        return new ScratchVector2Class(magnitude * Math.cos(a), magnitude * Math.sin(a));
    }

    _length(): number { return Math.sqrt(this._lengthSq()); }
    _lengthSq(): number { return this.x * this.x + this.y * this.y; }
    _distanceSq(v: ScratchVector2Class): number { const dx = v.x - this.x, dy = v.y - this.y; return dx * dx + dy * dy; }
    _distance(v: ScratchVector2Class): number { return Math.sqrt(this._distanceSq(v)); }
    _angle(): number { return Math.atan2(this.y, this.x) * 180 / Math.PI; }
    _unitVector(): ScratchVector2Class {
        const mag = this._length();
        return mag > 0 ? new ScratchVector2Class(this.x / mag, this.y / mag) : new ScratchVector2Class(0, 0);
    }
    _normalVector(): ScratchVector2Class { return new ScratchVector2Class(-this.y, this.x); }
    _add(v: ScratchVector2Class): ScratchVector2Class { return new ScratchVector2Class(this.x + v.x, this.y + v.y); }
    _sub(v: ScratchVector2Class): ScratchVector2Class { return new ScratchVector2Class(this.x - v.x, this.y - v.y); }
    _multiply(s: number): ScratchVector2Class { return new ScratchVector2Class(this.x * s, this.y * s); }
    _dot(v: ScratchVector2Class): number { return this.x * v.x + this.y * v.y; }
    _rotateBy(angleDeg: number): ScratchVector2Class {
        const a = angleDeg * Math.PI / 180, cos = Math.cos(a), sin = Math.sin(a);
        return new ScratchVector2Class(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
    }
    _rotateTo(angleDeg: number): ScratchVector2Class { return ScratchVector2Class._fromPolar(this._length(), angleDeg); }
    _reverse(): ScratchVector2Class { return new ScratchVector2Class(-this.x, -this.y); }
    _getX(): number { return this.x; }
    _getY(): number { return this.y; }
    _clone(): ScratchVector2Class { return new ScratchVector2Class(this.x, this.y); }

    _mj$equals$boolean$Object(t: Thread, callback: CallbackFunction, obj: ObjectClassOrNull): void {
        const eq = obj instanceof ScratchVector2Class && obj.x === this.x && obj.y === this.y;
        t.s.push(eq);
        if (callback) callback();
    }

    /** Upstream's format is "Vector2[x, y]", which print() output depends on. */
    _mj$toString$String$(t: Thread, callback: CallbackFunction): void {
        t.s.push(new StringClass(this.asString()));
        if (callback) callback();
    }

    private asString(): string {
        return "Vector2[" + ScratchVector2Class.asDouble(this.x) + ", " + ScratchVector2Class.asDouble(this.y) + "]";
    }

    /** x and y are doubles in Java, so a whole number prints as "3.0", not "3". */
    private static asDouble(n: number): string {
        return Number.isInteger(n) ? n.toFixed(1) : String(n);
    }

    /** Upstream hashes the toString(), so equal vectors hash equal. */
    _hashCode(): number {
        const s = this.asString();
        let h = 0;
        for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
        return h;
    }
}
