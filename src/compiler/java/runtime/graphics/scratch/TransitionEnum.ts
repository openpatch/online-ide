import type { Thread } from "../../../../common/interpreter/Thread";
import { ThreadState } from "../../../../common/interpreter/ThreadState";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { EnumClass } from "../../system/javalang/EnumClass";
import { StringClass } from "../../system/javalang/ObjectClassStringClass";
import { RuntimeExceptionClass } from "../../system/javalang/RuntimeException";
import { loadShaderSource } from "./ScratchShaders";
import { BUILT_IN_TRANSITIONS, transitionCompileError } from "./ScratchTransitionView";
import { SRC } from "./ScratchLibraryComments";

/**
 * Stage transitions, mirroring org.openpatch.scratch.Transition (7.0).
 * The built-in kinds; Transition.fromShader makes one from a fragment shader.
 */
export enum Transition { FADE, CROSSFADE, SLIDE_LEFT, SLIDE_RIGHT, SLIDE_UP, SLIDE_DOWN }

export class TransitionEnum extends EnumClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch", signature: "enum Transition", comment: SRC.transitionClassComment },

        { type: "method", signature: "static Transition fromShader(string path)", java: TransitionEnum._fromShader, comment: SRC.transitionFromShaderComment },
        { type: "method", signature: "String getName()", native: TransitionEnum.prototype._getName, comment: SRC.transitionGetNameComment },
        { type: "method", signature: "String toString()", native: TransitionEnum.prototype._toString, comment: SRC.transitionToStringComment },
    ];

    static type: NonPrimitiveType;

    /** shader path of a fromShader transition, null for the built-in kinds */
    shaderPath: string | null;
    /** its shader's body, read when fromShader was called */
    private shaderBody: string | null;

    constructor(name: string, ordinal: number, shaderPath: string | null = null, shaderBody: string | null = null) {
        super(name, ordinal);
        this.shaderPath = shaderPath;
        this.shaderBody = shaderBody;
    }

    static values = [
        new TransitionEnum("FADE", Transition.FADE),
        new TransitionEnum("CROSSFADE", Transition.CROSSFADE),
        new TransitionEnum("SLIDE_LEFT", Transition.SLIDE_LEFT),
        new TransitionEnum("SLIDE_RIGHT", Transition.SLIDE_RIGHT),
        new TransitionEnum("SLIDE_UP", Transition.SLIDE_UP),
        new TransitionEnum("SLIDE_DOWN", Transition.SLIDE_DOWN),
    ];

    /** As upstream: the file is read now, so a missing or broken one is reported here. */
    static _fromShader(t: Thread, path: string) {
        const oldState = t.state;
        t.state = ThreadState.waiting;
        loadShaderSource(path).catch(reason => {
            throw new RuntimeExceptionClass(
                `Shader-Datei nicht gefunden / could not load shader file '${path}': ${reason?.message ?? reason}`);
        }).then(body => {
            const error = transitionCompileError(body);
            if (error) {
                throw new RuntimeExceptionClass(
                    `Übergang '${path}' lässt sich nicht übersetzen / transition could not be compiled:\n${error}`);
            }
            t.state = oldState;
            t.s.push(new TransitionEnum("fromShader", 6, path, body));
        }).catch(reason => {
            t.state = oldState;
            t.throwRuntimeExceptionOnLastExecutedStep(reason instanceof RuntimeExceptionClass
                ? reason : new RuntimeExceptionClass(String(reason?.message ?? reason)));
        });
    }

    /** The shader that draws this transition. */
    transitionBody(): string {
        return this.shaderBody ?? BUILT_IN_TRANSITIONS[TransitionEnum.NAMES[this.ordinal]] ?? BUILT_IN_TRANSITIONS["fade"];
    }

    /** upstream's names of the built-in transitions */
    private static readonly NAMES = ["fade", "crossfade", "slide-left", "slide-right", "slide-up", "slide-down"];

    /** As upstream: the built-in name, or the shader file. */
    _getName(): StringClass {
        return new StringClass(this.shaderPath ?? TransitionEnum.NAMES[this.ordinal] ?? this.name);
    }

    _toString(): StringClass { return this._getName(); }
}
