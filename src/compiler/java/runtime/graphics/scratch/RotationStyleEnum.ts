import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { EnumClass } from "../../system/javalang/EnumClass";
import { SRC } from "./ScratchLibraryComments";

/**
 * How a sprite visually reacts to a change of its direction,
 * mirroring org.openpatch.scratch.RotationStyle.
 *  - LEFT_RIGHT: only mirror horizontally (never rotate)
 *  - DONT:       never change the visual orientation
 *  - ALL_AROUND: rotate freely (default)
 */
export enum RotationStyle { LEFT_RIGHT, DONT, ALL_AROUND }

export class RotationStyleEnum extends EnumClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", signature: "enum RotationStyle", comment: SRC.rotationStyleClassComment },
    ];

    static type: NonPrimitiveType;

    static values = [
        new RotationStyleEnum("LEFT_RIGHT", RotationStyle.LEFT_RIGHT),
        new RotationStyleEnum("DONT", RotationStyle.DONT),
        new RotationStyleEnum("ALL_AROUND", RotationStyle.ALL_AROUND),
    ];
}
