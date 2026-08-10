import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { EnumClass } from "../../system/javalang/EnumClass";
import { SRC } from "./ScratchLibraryComments";

export enum TextureSampling { POINT, LINEAR, BILINEAR, TRILINEAR }

/** Mirrors org.openpatch.scratch.TextureSampling; the modes are Processing's. */
export class TextureSamplingEnum extends EnumClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "enum TextureSampling", comment: SRC.textureSamplingClassComment },
        { type: "method", signature: "int getMode()", native: TextureSamplingEnum.prototype._getMode, comment: SRC.textureSamplingGetModeComment },
    ];

    static type: NonPrimitiveType;

    static values: TextureSamplingEnum[] = [
        new TextureSamplingEnum("POINT", TextureSampling.POINT),
        new TextureSamplingEnum("LINEAR", TextureSampling.LINEAR),
        new TextureSamplingEnum("BILINEAR", TextureSampling.BILINEAR),
        new TextureSamplingEnum("TRILINEAR", TextureSampling.TRILINEAR),
    ];

    /** Upstream numbers the modes from 2, not from the ordinal. */
    _getMode(): number { return this.ordinal + 2; }
}
