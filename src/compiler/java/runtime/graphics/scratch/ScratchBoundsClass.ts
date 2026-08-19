import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ObjectClass, StringClass } from "../../system/javalang/ObjectClassStringClass";
import { SRC } from "./ScratchLibraryComments";
import { CallbackFunction } from "../../../../common/interpreter/StepFunction";
import { Thread } from "../../../../common/interpreter/Thread";

/**
 * Axis-aligned bounding box, mirroring org.openpatch.scratch.Bounds.
 * Upstream this is a record, so the accessors are x(), y(), width(), height().
 */
export class ScratchBoundsClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch", signature: "class Bounds extends Object", comment: SRC.boundsClassComment },

        { type: "method", signature: "Bounds(double x, double y, double width, double height)", native: ScratchBoundsClass.prototype._c4, comment: SRC.boundsConstructorComment },
        { type: "method", signature: "double x()", template: "§1.bx", comment: SRC.boundsXComment },
        { type: "method", signature: "double y()", template: "§1.by", comment: SRC.boundsYComment },
        { type: "method", signature: "double width()", template: "§1.bwidth", comment: SRC.boundsWidthComment },
        { type: "method", signature: "double height()", template: "§1.bheight", comment: SRC.boundsHeightComment },
        { type: "method", signature: "boolean intersects(Bounds other)", native: ScratchBoundsClass.prototype._intersects, comment: SRC.boundsIntersectsComment },
        { type: "method", signature: "String toString()", java: ScratchBoundsClass.prototype._mj$toString$String$, comment: SRC.boundsToStringComment },
    ];

    static type: NonPrimitiveType;

    // not named x/y/width/height: ShapeClass-style hosts already use those
    bx: number = 0;
    by: number = 0;
    bwidth: number = 0;
    bheight: number = 0;

    constructor(x: number = 0, y: number = 0, width: number = 0, height: number = 0) {
        super();
        this.bx = x; this.by = y; this.bwidth = width; this.bheight = height;
    }

    _c4(x: number, y: number, width: number, height: number) {
        this.bx = x; this.by = y; this.bwidth = width; this.bheight = height;
        return this;
    }

    /**
     * Upstream is a record, so printing one gives
     * "Bounds[x=-34.0, y=2.0, width=88.0, height=62.0]".
     */
    _mj$toString$String$(t: Thread, callback: CallbackFunction): void {
        const d = (n: number) => Number.isInteger(n) ? n.toFixed(1) : String(n);
        t.s.push(new StringClass(
            `Bounds[x=${d(this.bx)}, y=${d(this.by)}, width=${d(this.bwidth)}, height=${d(this.bheight)}]`));
        if (callback) callback();
    }

    _intersects(other: ScratchBoundsClass): boolean {
        if (!other) return false;
        return this.bx < other.bx + other.bwidth
            && this.bx + this.bwidth > other.bx
            && this.by < other.by + other.bheight
            && this.by + this.bheight > other.by;
    }
}
