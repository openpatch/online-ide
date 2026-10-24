import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { EnumClass } from "../../system/javalang/EnumClass";
import { SRC } from "./ScratchLibraryComments";

/**
 * Which drawing layer something goes onto, mirroring org.openpatch.scratch.Layer
 * (7.0). Values follow the declaration order of the desktop enum, which is also
 * back-to-front:
 *  - BACKGROUND: behind the sprites
 *  - MAIN:        where sprites and texts live by default
 *  - FOREGROUND:  in front of the sprites, behind the UI
 *  - UI:          on top of everything, unaffected by the camera
 */
export enum Layer { BACKGROUND, MAIN, FOREGROUND, UI }

export class LayerEnum extends EnumClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch", signature: "enum Layer", comment: SRC.layerClassComment },
    ];

    static type: NonPrimitiveType;

    static values = [
        new LayerEnum("BACKGROUND", Layer.BACKGROUND),
        new LayerEnum("MAIN", Layer.MAIN),
        new LayerEnum("FOREGROUND", Layer.FOREGROUND),
        new LayerEnum("UI", Layer.UI),
    ];
}
