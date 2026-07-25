import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ObjectClass } from "../../system/javalang/ObjectClassStringClass";

/**
 * Axis-aligned bounding box, mirroring org.openpatch.scratch.Bounds.
 * Upstream this is a record, so the accessors are x(), y(), width(), height().
 */
export class ScratchBoundsClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "class Bounds extends Object", comment: "Umschließendes Rechteck" },

        { type: "method", signature: "Bounds(double x, double y, double width, double height)", native: ScratchBoundsClass.prototype._c4, comment: "Erzeugt ein Rechteck aus Position und Größe" },
        { type: "method", signature: "double x()", template: "§1.bx", comment: "Gibt die linke x-Koordinate zurück" },
        { type: "method", signature: "double y()", template: "§1.by", comment: "Gibt die obere y-Koordinate zurück" },
        { type: "method", signature: "double width()", template: "§1.bwidth", comment: "Gibt die Breite zurück" },
        { type: "method", signature: "double height()", template: "§1.bheight", comment: "Gibt die Höhe zurück" },
        { type: "method", signature: "boolean intersects(Bounds other)", native: ScratchBoundsClass.prototype._intersects, comment: "Gibt genau dann true zurück, wenn sich beide Rechtecke überlappen" },
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

    _intersects(other: ScratchBoundsClass): boolean {
        if (!other) return false;
        return this.bx < other.bx + other.bwidth
            && this.bx + this.bwidth > other.bx
            && this.by < other.by + other.bheight
            && this.by + this.bheight > other.by;
    }
}
