import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { EnumClass } from "../../system/javalang/EnumClass";
import { SRC } from "./ScratchLibraryComments";

/**
 * How a piece of text is framed, mirroring org.openpatch.scratch.TextStyle.
 *  - BOX:   a plain rounded rectangle
 *  - SPEAK: a speech bubble with a pointed tail
 *  - THINK: a thought bubble
 *  - PLAIN: no frame at all — just the text, and the default for a new Text
 *
 * The order matches upstream's declaration order, so the ordinals line up.
 */
export enum TextStyle { BOX, SPEAK, THINK, PLAIN }

export class TextStyleEnum extends EnumClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "enum TextStyle", comment: SRC.textStyleClassComment },
    ];

    static type: NonPrimitiveType;

    static values = [
        new TextStyleEnum("BOX", TextStyle.BOX),
        new TextStyleEnum("SPEAK", TextStyle.SPEAK),
        new TextStyleEnum("THINK", TextStyle.THINK),
        new TextStyleEnum("PLAIN", TextStyle.PLAIN),
    ];
}
