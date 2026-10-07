import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ObjectClass } from "../../system/javalang/ObjectClassStringClass";
import { SRC } from "./ScratchLibraryComments";

/**
 * The draw order of a stage's sprites, as in org.openpatch.scratch.extensions.sorting.Sorting.
 *
 * byY() is what top-down games need: whoever stands further down is nearer to
 * the viewer and is drawn later, so a figure can walk behind a tree and in front
 * of it. Like upstream, the key is the sprite's lower edge, y - height / 2, so a
 * tall tree and a small figure compare by where they touch the ground.
 *
 * Sorting by an arbitrary java.util.Comparator (upstream's by(...)) is left out.
 * The stage applies the order once per frame, see ScratchStageClass._preRender.
 */
export class ScratchSortingClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch.extensions.sorting", signature: "class Sorting extends Object", comment: SRC.sortingClassComment },
        { type: "method", signature: "Sorting()", native: ScratchSortingClass.prototype._c0 },
        { type: "method", signature: "void byY()", native: ScratchSortingClass.prototype._byY, comment: SRC.sortingByYComment },
        { type: "method", signature: "void off()", native: ScratchSortingClass.prototype._off, comment: SRC.sortingOffComment },
        { type: "method", signature: "boolean isOn()", native: ScratchSortingClass.prototype._isOn, comment: SRC.sortingIsOnComment },
    ];
    static type: NonPrimitiveType;

    /** True while the sprites are drawn in the order of their lower edge. */
    byY = false;

    _c0() { return this; }

    _byY() { this.byY = true; }
    _off() { this.byY = false; }
    _isOn(): boolean { return this.byY; }
}
