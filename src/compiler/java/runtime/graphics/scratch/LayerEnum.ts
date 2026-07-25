import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { EnumClass } from "../../system/javalang/EnumClass";

/**
 * Which drawing layer something goes onto, mirroring org.openpatch.scratch.Layer.
 *  - BACKGROUND: behind the sprites (where the pen also draws)
 *  - FOREGROUND: in front of the sprites
 *  - UI:         on top of everything
 */
export enum Layer { BACKGROUND, FOREGROUND, UI }

export class LayerEnum extends EnumClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "enum Layer", comment: "Zeichenebene, auf die gedruckt wird" },
    ];

    static type: NonPrimitiveType;

    static values = [
        new LayerEnum("BACKGROUND", Layer.BACKGROUND),
        new LayerEnum("FOREGROUND", Layer.FOREGROUND),
        new LayerEnum("UI", Layer.UI),
    ];
}
