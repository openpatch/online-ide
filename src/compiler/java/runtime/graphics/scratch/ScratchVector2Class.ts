import { CallbackFunction } from "../../../../common/interpreter/StepFunction";
import { Thread } from "../../../../common/interpreter/Thread";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ObjectClass, ObjectClassOrNull, StringClass } from "../../system/javalang/ObjectClassStringClass";
import { SRC } from "./ScratchLibraryComments";

/**
 * Immutable 2D vector, mirroring org.openpatch.scratch.Vector2.
 * All angle arguments/results are in degrees (Scratch convention).
 */
export class ScratchVector2Class extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch", signature: "class Vector2 extends Object", comment: SRC.vector2ClassComment },

        { type: "method", signature: "Vector2()", native: ScratchVector2Class.prototype._c0, comment: SRC.vector2ConstructorComment },
        { type: "method", signature: "Vector2(double x, double y)", native: ScratchVector2Class.prototype._c2, comment: SRC.vector2Constructor2Comment },
        { type: "method", signature: "Vector2(Vector2 v)", native: ScratchVector2Class.prototype._cCopy, comment: SRC.vector2Constructor3Comment },

        { type: "method", signature: "static Vector2 fromPolar(double magnitude, double angle)", native: ScratchVector2Class._fromPolar, comment: SRC.vector2FromPolarComment },

        { type: "method", signature: "double length()", native: ScratchVector2Class.prototype._length, comment: SRC.vector2LengthComment },
        { type: "method", signature: "double lengthSq()", native: ScratchVector2Class.prototype._lengthSq, comment: SRC.vector2LengthSqComment },
        { type: "method", signature: "double distanceSq(Vector2 v)", native: ScratchVector2Class.prototype._distanceSq, comment: SRC.vector2DistanceSqComment },
        { type: "method", signature: "double distance(Vector2 v)", native: ScratchVector2Class.prototype._distance, comment: SRC.vector2DistanceComment },
        { type: "method", signature: "double angle()", native: ScratchVector2Class.prototype._angle, comment: SRC.vector2AngleComment },
        { type: "method", signature: "Vector2 unitVector()", native: ScratchVector2Class.prototype._unitVector, comment: SRC.vector2UnitVectorComment },
        { type: "method", signature: "Vector2 normalVector()", native: ScratchVector2Class.prototype._normalVector, comment: SRC.vector2NormalVectorComment },
        { type: "method", signature: "Vector2 add(Vector2 v)", native: ScratchVector2Class.prototype._add, comment: SRC.vector2AddComment },
        { type: "method", signature: "Vector2 sub(Vector2 v)", native: ScratchVector2Class.prototype._sub, comment: SRC.vector2SubComment },
        { type: "method", signature: "Vector2 multiply(double scalar)", native: ScratchVector2Class.prototype._multiply, comment: SRC.vector2MultiplyComment },
        { type: "method", signature: "double dot(Vector2 v)", native: ScratchVector2Class.prototype._dot, comment: SRC.vector2DotComment },
        { type: "method", signature: "Vector2 rotateBy(double angle)", native: ScratchVector2Class.prototype._rotateBy, comment: SRC.vector2RotateByComment },
        { type: "method", signature: "Vector2 rotateTo(double angle)", native: ScratchVector2Class.prototype._rotateTo, comment: SRC.vector2RotateToComment },
        { type: "method", signature: "Vector2 reverse()", native: ScratchVector2Class.prototype._reverse, comment: SRC.vector2ReverseComment },
        { type: "method", signature: "double getX()", native: ScratchVector2Class.prototype._getX, comment: SRC.vector2GetXComment },
        { type: "method", signature: "double getY()", native: ScratchVector2Class.prototype._getY, comment: SRC.vector2GetYComment },
        { type: "method", signature: "Vector2 clone()", native: ScratchVector2Class.prototype._clone, comment: SRC.vector2CloneComment },
        { type: "method", signature: "boolean equals(Object obj)", java: ScratchVector2Class.prototype._mj$equals$boolean$Object, comment: SRC.vector2EqualsComment },
        { type: "method", signature: "String toString()", java: ScratchVector2Class.prototype._mj$toString$String$, comment: SRC.vector2ToStringComment },
        { type: "method", signature: "int hashCode()", native: ScratchVector2Class.prototype._hashCode, comment: SRC.vector2HashCodeComment },
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
