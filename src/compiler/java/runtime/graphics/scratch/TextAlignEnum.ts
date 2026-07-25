import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { EnumClass } from "../../system/javalang/EnumClass";

/**
 * Where a piece of text sits relative to its position,
 * mirroring org.openpatch.scratch.TextAlign.
 */
export enum TextAlign { DEFAULT, CENTER, RIGHT, LEFT }

export class TextAlignEnum extends EnumClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "enum TextAlign", comment: "Ausrichtung eines Texts zu seiner Position" },
    ];

    static type: NonPrimitiveType;

    static values = [
        new TextAlignEnum("DEFAULT", TextAlign.DEFAULT),
        new TextAlignEnum("CENTER", TextAlign.CENTER),
        new TextAlignEnum("RIGHT", TextAlign.RIGHT),
        new TextAlignEnum("LEFT", TextAlign.LEFT),
    ];
}
