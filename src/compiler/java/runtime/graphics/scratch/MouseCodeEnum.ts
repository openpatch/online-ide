import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { EnumClass } from "../../system/javalang/EnumClass";
import { SRC } from "./ScratchLibraryComments";

/**
 * Mouse buttons, mirroring org.openpatch.scratch.MouseCode, in its order
 * (LEFT, RIGHT, CENTER) so values() and ordinal() agree. The browser numbers
 * its MouseEvent.button differently (0 = left, 1 = middle, 2 = right); see button.
 */
export enum MouseCode { LEFT = 0, RIGHT = 1, CENTER = 2 }

export class MouseCodeEnum extends EnumClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch", signature: "enum MouseCode", comment: SRC.mouseCodeClassComment },
    ];

    static type: NonPrimitiveType;

    static values = [
        new MouseCodeEnum("LEFT", MouseCode.LEFT),
        new MouseCodeEnum("RIGHT", MouseCode.RIGHT),
        new MouseCodeEnum("CENTER", MouseCode.CENTER),
    ];

    /** browser MouseEvent.button value this enum entry corresponds to */
    get button(): number {
        return [0, 2, 1][this.ordinal];
    }
}
