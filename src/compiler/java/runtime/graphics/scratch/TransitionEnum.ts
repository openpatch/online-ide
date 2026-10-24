import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { EnumClass } from "../../system/javalang/EnumClass";
import { SRC } from "./ScratchLibraryComments";

/**
 * Stage transitions, mirroring org.openpatch.scratch.Transition (7.0).
 * The built-in kinds; Transition.fromShader makes one from a fragment shader.
 */
export enum Transition { FADE, CROSSFADE, SLIDE_LEFT, SLIDE_RIGHT, SLIDE_UP, SLIDE_DOWN }

export class TransitionEnum extends EnumClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch", signature: "enum Transition", comment: SRC.transitionClassComment },

        { type: "method", signature: "static Transition fromShader(String path)", native: TransitionEnum._fromShader, comment: SRC.transitionFromShaderComment },
        { type: "method", signature: "String getName()", native: TransitionEnum.prototype._getName, comment: SRC.transitionGetNameComment },
        { type: "method", signature: "String toString()", native: TransitionEnum.prototype._toString, comment: SRC.transitionToStringComment },
    ];

    static type: NonPrimitiveType;

    /** shader path of a fromShader transition, null for the built-in kinds */
    shaderPath: string | null;

    constructor(name: string, ordinal: number, shaderPath: string | null = null) {
        super(name, ordinal);
        this.shaderPath = shaderPath;
    }

    static values = [
        new TransitionEnum("FADE", Transition.FADE),
        new TransitionEnum("CROSSFADE", Transition.CROSSFADE),
        new TransitionEnum("SLIDE_LEFT", Transition.SLIDE_LEFT),
        new TransitionEnum("SLIDE_RIGHT", Transition.SLIDE_RIGHT),
        new TransitionEnum("SLIDE_UP", Transition.SLIDE_UP),
        new TransitionEnum("SLIDE_DOWN", Transition.SLIDE_DOWN),
    ];

    static _fromShader(path: string): TransitionEnum {
        // registered under the path the shader was loaded from; the stage
        // transition resolves it when the transition starts
        return new TransitionEnum("fromShader", 6, path);
    }

    _getName(): string { return this.shaderPath ?? this.name; }

    _toString(): string { return this._getName(); }
}
