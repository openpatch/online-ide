import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { EnumClass } from "../../system/javalang/EnumClass";
import { SRC } from "./ScratchLibraryComments";

/**
 * Mouse buttons, mirroring org.openpatch.scratch.MouseCode.
 * The ordinal values match the browser MouseEvent.button values
 * (0 = left, 2 = right, 1 = middle/center) so they can be compared directly.
 */
export enum MouseCode { LEFT = 0, CENTER = 1, RIGHT = 2 }

export class MouseCodeEnum extends EnumClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch", signature: "enum MouseCode", comment: SRC.mouseCodeClassComment },
    ];

    static type: NonPrimitiveType;

    static values = [
        new MouseCodeEnum("LEFT", MouseCode.LEFT),
        new MouseCodeEnum("CENTER", MouseCode.CENTER),
        new MouseCodeEnum("RIGHT", MouseCode.RIGHT),
    ];

    /** browser MouseEvent.button value this enum entry corresponds to */
    get button(): number {
        return this.ordinal;
    }
}
