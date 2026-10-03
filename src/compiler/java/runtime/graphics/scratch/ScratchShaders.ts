import * as PIXI from "pixi.js";
import type { CallbackParameter } from "../../../../common/interpreter/CallbackParameter";
import type { Thread } from "../../../../common/interpreter/Thread";
import { ThreadState } from "../../../../common/interpreter/ThreadState";
import { LibraryDeclarations } from "../../../module/libraries/DeclareType";
import { NonPrimitiveType } from "../../../types/NonPrimitiveType";
import { ObjectClass } from "../../system/javalang/ObjectClassStringClass";
import { RuntimeExceptionClass } from "../../system/javalang/RuntimeException";
import { resolveAssetUrl } from "./ScratchAssetUrls";
import { ScratchColorClass } from "./ScratchColorClass";
import { SRC } from "./ScratchLibraryComments";
import { desktopOnly } from "./ScratchUnsupported";
import { ScratchVector2Class } from "./ScratchVector2Class";
import { ScratchWorkspaceAssets } from "./ScratchWorkspaceAssets";

/**
 * org.openpatch.scratch.extensions.shader — the same shader files as on the
 * desktop, as PIXI filters.
 *
 * Upstream hands a fragment shader written for Processing to OpenGL. A browser
 * speaks WebGL 2, whose GLSL ES 3.00 differs in a handful of fixed ways, so the
 * source is rewritten before it is compiled (see translate()):
 *
 *  - `vertTexCoord`, Processing's 0..1 across the costume, is worked out from
 *    PIXI's filter coordinates, and reading `texture` at such a point is
 *    mapped back, so a shader that pixelates in steps of 1/20 does so here too;
 *  - `texture2D` becomes `texture`, `gl_FragColor` an output;
 *  - `texOffset` and `textureSize(texture, 0)`, which Processing fills in, are
 *    supplied.
 *
 * Lines keep their numbers, so a compile error points at the line in the file.
 * WebGL is stricter than desktop drivers - `x == 1` with a float x is an error
 * there - and such errors are reported as they are, with that line.
 *
 * A PIXI filter has a vertex stage of its own. Processing's default vertex
 * shader, which the demos pass along, does nothing it would not do, so it is
 * accepted; any other is desktop only and ignored after a notice.
 *
 * The filter works on a sprite as it is drawn, so on a turned sprite a pattern
 * stays level with the screen, where upstream's turns with the costume.
 */

/** Fragment source, already translated, plus the uniforms it declares. */
type Translated = {
    fragment: string;
    uniforms: Record<string, { type: string, size?: number, value: any }>;
    /** for each uniform: the GLSL type, so set() can convert what it is given */
    glslTypes: Record<string, { type: string, count: number }>;
};

const VERTEX = `#version 300 es
in vec2 aPosition;
out vec2 vTextureCoord;
uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;
void main(void) {
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
    gl_Position = vec4(position, 0.0, 1.0);
    vTextureCoord = aPosition * (uOutputFrame.zw * uInputSize.zw);
}`;

const PIXI_TYPES: Record<string, string> = {
    float: "f32", int: "i32", bool: "i32",
    vec2: "vec2<f32>", vec3: "vec3<f32>", vec4: "vec4<f32>",
    ivec2: "vec2<i32>", ivec3: "vec3<i32>", ivec4: "vec4<i32>",
    bvec2: "vec2<i32>", bvec3: "vec3<i32>", bvec4: "vec4<i32>",
    mat2: "mat2x2<f32>", mat3: "mat3x3<f32>", mat4: "mat4x4<f32>",
};
const COMPONENTS: Record<string, number> = {
    float: 1, int: 1, bool: 1, vec2: 2, vec3: 3, vec4: 4, ivec2: 2, ivec3: 3, ivec4: 4,
    bvec2: 2, bvec3: 3, bvec4: 4, mat2: 4, mat3: 9, mat4: 16,
};

/** Replace what matches with blank lines of the same count, so line numbers stay. */
function blank(source: string, pattern: RegExp): string {
    return source.replace(pattern, m => m.replace(/[^\n]/g, ""));
}

export function translate(source: string): Translated {
    let s = source.replace(/\r\n?/g, "\n");
    s = blank(s, /^[ \t]*#version[^\n]*/m);
    s = blank(s, /^[ \t]*#define[ \t]+PROCESSING_\w+[^\n]*/gm);
    s = blank(s, /^[ \t]*(?:varying|in)\s+vec4\s+(?:vertTexCoord|vertColor)\s*;/gm);
    s = blank(s, /^[ \t]*uniform\s+sampler2D\s+texture\s*;/m);
    const usesTexOffset = /uniform\s+vec2\s+texOffset\s*;/.test(s);
    s = blank(s, /^[ \t]*uniform\s+vec2\s+texOffset\s*;/m);

    const uniforms: Translated["uniforms"] = {};
    const glslTypes: Translated["glslTypes"] = {};
    const declaration = /uniform\s+(?:(?:lowp|mediump|highp)\s+)?(\w+)\s*(?:\[\s*(\d+)\s*\])?\s+(\w+)\s*(?:\[\s*(\d+)\s*\])?\s*;/g;
    for (const m of s.matchAll(declaration)) {
        const [, type, n1, name, n2] = m;
        if (!PIXI_TYPES[type]) continue;
        const count = parseInt(n1 ?? n2 ?? "1", 10);
        const length = COMPONENTS[type] * count;
        const integer = /^(int|bool|ivec|bvec)/.test(type);
        const array = integer ? new Int32Array(length) : new Float32Array(length);
        uniforms[name] = n1 ?? n2
            ? { type: PIXI_TYPES[type], size: count, value: array }
            : { type: PIXI_TYPES[type], value: length === 1 ? 0 : array };
        glslTypes[name] = { type, count };
    }

    s = s.replace(/textureSize\s*\(\s*texture\s*,\s*0\s*\)/g, "ivec2(uOutputFrame.zw)");
    s = s.replace(/\b(?:texture2D|texture)\s*\(\s*texture\s*,\s*/g, "_pTexture(");
    s = s.replace(/\btexture2D\s*\(/g, "texture(");
    s = s.replace(/\bvoid\s+main\s*\(\s*(?:void)?\s*\)/, "void _pMain()");

    // One line, so that `#line 1` below makes the file's first line line 1.
    const header = "#version 300 es\nprecision highp float; precision highp int;"
        + " in vec2 vTextureCoord; out vec4 _pFragColor;"
        + " uniform sampler2D uTexture; uniform vec4 uInputSize; uniform vec4 uOutputFrame;"
        + " vec4 vertTexCoord;"
        + " vec4 _pTexture(vec2 p) { return texture(uTexture, p * uOutputFrame.zw * uInputSize.zw); }\n"
        + "#define gl_FragColor _pFragColor\n"
        + (usesTexOffset ? "#define texOffset (1.0 / uOutputFrame.zw)\n" : "")
        + "#line 1\n";
    const footer = "\nvoid main(void) {"
        + " vertTexCoord = vec4(vTextureCoord * uInputSize.xy / uOutputFrame.zw, 0.0, 1.0);"
        + " _pMain(); }\n";
    return { fragment: header + s + footer, uniforms, glslTypes };
}

/** Processing's default vertex shader, or one that does the same. */
export function isDefaultVertexShader(source: string): boolean {
    return /gl_Position\s*=\s*transformMatrix\s*\*\s*position/.test(source)
        && /vertTexCoord\s*=\s*texMatrix\s*\*\s*vec4\s*\(\s*texCoord/.test(source);
}

/**
 * Compile the translated source once on its own, so a mistake is reported at
 * the line that added the shader, with the compiler's message, rather than as
 * a sprite that silently stops being drawn.
 */
function compileError(fragment: string): string | undefined {
    if (typeof document === "undefined") return undefined;
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return undefined;
    const shader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!shader) return undefined;
    gl.shaderSource(shader, fragment);
    gl.compileShader(shader);
    const ok = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    const log = ok ? undefined : (gl.getShaderInfoLog(shader) ?? "").trim();
    gl.deleteShader(shader);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return log;
}

/** The text of a shader file: one of the project's files, else downloaded. */
async function loadSource(path: string): Promise<string> {
    const own = ScratchWorkspaceAssets.getText(path);
    if (own !== undefined) return own;
    const response = await fetch(resolveAssetUrl(path));
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return response.text();
}

/** Loaded sources, so that cloned sprites do not download a shader again. */
const sources: Map<string, Promise<string>> = new Map();
function source(path: string): Promise<string> {
    let pending = sources.get(path);
    if (!pending) {
        pending = loadSource(path);
        sources.set(path, pending);
        pending.catch(() => sources.delete(path));
    }
    return pending;
}

/** A single GLSL program. */
export class ScratchShaderClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch.extensions.shader", signature: "class Shader extends Object", comment: SRC.shaderClassComment },
        { type: "method", signature: "Shader(string name, string fragmentShaderPath, string vertexShaderPath)", java: ScratchShaderClass.prototype._cj$_constructor_$Shader$string$string$string, comment: SRC.shaderConstructorComment },
        { type: "method", signature: "Shader(Shader shader)", native: ScratchShaderClass.prototype._cCopy, comment: SRC.shaderConstructor2Comment },
        { type: "method", signature: "string getName()", native: ScratchShaderClass.prototype._getName, comment: SRC.shaderGetNameComment },
        { type: "method", signature: "void setName(string name)", native: ScratchShaderClass.prototype._setName, comment: SRC.shaderSetNameComment },
        { type: "method", signature: "void set(string name, int x)", native: ScratchShaderClass.prototype._set1, comment: SRC.shaderSetComment },
        { type: "method", signature: "void set(string name, boolean x)", native: ScratchShaderClass.prototype._setBool1, comment: SRC.shaderSet2Comment },
        { type: "method", signature: "void set(string name, double x)", native: ScratchShaderClass.prototype._set1, comment: SRC.shaderSet3Comment },
        { type: "method", signature: "void set(string name, int x, int y)", native: ScratchShaderClass.prototype._set2, comment: SRC.shaderSet4Comment },
        { type: "method", signature: "void set(string name, boolean x, boolean y)", native: ScratchShaderClass.prototype._setBool2, comment: SRC.shaderSet5Comment },
        { type: "method", signature: "void set(string name, double x, double y)", native: ScratchShaderClass.prototype._set2, comment: SRC.shaderSet6Comment },
        { type: "method", signature: "void set(string name, Vector2 vec)", native: ScratchShaderClass.prototype._setVector, comment: SRC.shaderSet7Comment },
        { type: "method", signature: "void set(string name, Color c)", native: ScratchShaderClass.prototype._setColor, comment: SRC.shaderSet8Comment },
        { type: "method", signature: "void set(string name, int[] values, int ncoords)", native: ScratchShaderClass.prototype._setArray, comment: SRC.shaderSet9Comment },
        { type: "method", signature: "void set(string name, double[] values, int ncoords)", native: ScratchShaderClass.prototype._setArray, comment: SRC.shaderSet10Comment },
    ];
    static type: NonPrimitiveType;

    name: string = "";
    filter: PIXI.Filter | undefined;
    private group: PIXI.UniformGroup | undefined;
    private glslTypes: Translated["glslTypes"] = {};

    _cj$_constructor_$Shader$string$string$string(t: Thread, callback: CallbackParameter,
        name: string, fragmentShaderPath: string, vertexShaderPath: string) {
        this.name = name;
        const oldState = t.state;
        t.state = ThreadState.waiting;
        this.load(fragmentShaderPath, vertexShaderPath).then(() => {
            t.state = oldState;
            t.s.push(this);
            if (callback) callback();
        }).catch(reason => {
            t.state = oldState;
            t.throwRuntimeExceptionOnLastExecutedStep(reason instanceof RuntimeExceptionClass
                ? reason : new RuntimeExceptionClass(String(reason?.message ?? reason)));
        });
    }

    /** Read, check and compile the files; rejects with an explanation. */
    async load(fragmentShaderPath: string, vertexShaderPath: string | null | undefined): Promise<void> {
        let fragmentSource: string;
        try {
            fragmentSource = await source(fragmentShaderPath);
        } catch (e: any) {
            throw new RuntimeExceptionClass(
                `Shader-Datei nicht gefunden / could not load shader file '${fragmentShaderPath}': ${e?.message ?? e}`);
        }
        if (vertexShaderPath) {
            const vertexSource = await source(vertexShaderPath).catch(() => undefined);
            if (vertexSource !== undefined && !isDefaultVertexShader(vertexSource)) {
                desktopOnly("Shader (vertex shader)",
                    "Eigene Vertex-Shader gibt es nur in der Desktop-Version; hier wird der Standard verwendet. / "
                    + "Custom vertex shaders are desktop only; the default one is used here.");
            }
        }

        const translated = translate(fragmentSource);
        const error = compileError(translated.fragment);
        if (error) {
            throw new RuntimeExceptionClass(
                `Shader '${fragmentShaderPath}' lässt sich nicht übersetzen / could not be compiled:\n${error}\n`
                + "Tipp / Tip: WebGL ist strenger als der Desktop - schreibe 1.0 statt 1, wo eine Kommazahl gemeint ist. / "
                + "WebGL is stricter than desktop drivers - write 1.0, not 1, where a decimal number is meant.");
        }

        this.glslTypes = translated.glslTypes;
        this.group = new PIXI.UniformGroup(translated.uniforms as any);
        const glProgram = PIXI.GlProgram.from({ vertex: VERTEX, fragment: translated.fragment, name: "scratch-shader" });
        this.filter = new PIXI.Filter({ glProgram, resources: { scratchUniforms: this.group } });
    }

    /** upstream's copy constructor: the same program under the same name */
    _cCopy(shader: ScratchShaderClass) {
        this.name = shader?.name ?? "";
        this.filter = shader?.filter;
        this.group = shader?.group;
        this.glslTypes = shader?.glslTypes ?? {};
        return this;
    }

    _getName(): string { return this.name; }
    _setName(name: string) { this.name = name; }

    /** Store values into a uniform, converted to what the shader declared it as. */
    private store(name: string, values: number[]) {
        const group: any = this.group;
        const declared = this.glslTypes[name];
        // Processing ignores a name the shader does not use; so does this.
        if (!group || !declared) return;
        const current = group.uniforms[name];
        if (typeof current === "number") {
            group.uniforms[name] = values[0] ?? 0;
        } else {
            const target = current as Float32Array | Int32Array;
            target.fill(0);
            for (let i = 0; i < Math.min(values.length, target.length); i++) target[i] = values[i];
        }
        group.update();
    }

    _set1(name: string, x: number) { this.store(name, [x]); }
    _setBool1(name: string, x: boolean) { this.store(name, [x ? 1 : 0]); }
    _set2(name: string, x: number, y: number) { this.store(name, [x, y]); }
    _setBool2(name: string, x: boolean, y: boolean) { this.store(name, [x ? 1 : 0, y ? 1 : 0]); }
    _setVector(name: string, v: ScratchVector2Class) { if (v) this.store(name, [v.x, v.y]); }
    /** as upstream: the colour's red, green and blue, from 0 to 255 */
    _setColor(name: string, c: ScratchColorClass) { if (c) this.store(name, [c.r, c.g, c.b]); }
    _setArray(name: string, values: number[], _ncoords: number) { if (values) this.store(name, Array.from(values)); }
}

/** The shaders a stage or sprite owns, of which one at a time is drawn with. */
export class ScratchShadersClass extends ObjectClass {
    static __javaDeclarations: LibraryDeclarations = [
        { type: "declaration", package: "org.openpatch.scratch.extensions.shader", signature: "class Shaders extends Object", comment: SRC.shadersClassComment },
        { type: "method", signature: "Shaders(string owner)", native: ScratchShadersClass.prototype._c1, comment: SRC.shadersConstructorComment },
        { type: "method", signature: "Shader add(string name, string fragmentShaderPath, string vertexShaderPath)", java: ScratchShadersClass.prototype._mj$add$Shader$string$string$string, comment: SRC.shadersAddComment },
        { type: "method", signature: "Shader get(string name)", native: ScratchShadersClass.prototype._get, comment: SRC.shadersGetComment },
        { type: "method", signature: "void switchTo(string name)", native: ScratchShadersClass.prototype._switchToName, comment: SRC.shadersSwitchToComment },
        { type: "method", signature: "void switchTo(double index)", native: ScratchShadersClass.prototype._switchToIndex, comment: SRC.shadersSwitchTo2Comment },
        { type: "method", signature: "void next()", native: ScratchShadersClass.prototype._next, comment: SRC.shadersNextComment },
        { type: "method", signature: "void reset()", native: ScratchShadersClass.prototype._reset, comment: SRC.shadersResetComment },
        { type: "method", signature: "Shader getCurrent()", native: ScratchShadersClass.prototype._getCurrent, comment: SRC.shadersGetCurrentComment },
        { type: "method", signature: "int getCurrentIndex()", native: ScratchShadersClass.prototype._getCurrentIndex, comment: SRC.shadersGetCurrentIndexComment },
        { type: "method", signature: "string getCurrentName()", native: ScratchShadersClass.prototype._getCurrentName, comment: SRC.shadersGetCurrentNameComment },
    ];
    static type: NonPrimitiveType;

    private shaders: ScratchShaderClass[] = [];
    // as upstream: 0, so the first shader added is drawn with at once
    private current: number = 0;
    private owner: string = "sprite";
    /** put the current shader's filter on whatever these shaders belong to */
    onChange: ((filter: PIXI.Filter | undefined) => void) | undefined;

    _c1(owner: string) { this.owner = owner ?? "sprite"; return this; }

    static of(owner: string, onChange: (filter: PIXI.Filter | undefined) => void): ScratchShadersClass {
        const shaders = new ScratchShadersClass();
        shaders.owner = owner;
        shaders.onChange = onChange;
        return shaders;
    }

    /** a copy for a cloned sprite, sharing the compiled shaders as upstream does */
    copyFor(onChange: (filter: PIXI.Filter | undefined) => void): ScratchShadersClass {
        const copy = ScratchShadersClass.of(this.owner, onChange);
        copy.shaders = this.shaders.map(s => new ScratchShaderClass()._cCopy(s));
        copy.current = this.current;
        copy.changed();
        return copy;
    }

    private changed() {
        this.onChange?.(this._getCurrent()?.filter);
    }

    _mj$add$Shader$string$string$string(t: Thread, callback: CallbackParameter,
        name: string, fragmentShaderPath: string, vertexShaderPath: string) {
        const existing = this._get(name);
        if (existing) {
            t.s.push(existing);
            if (callback) callback();
            return;
        }
        const shader = new ScratchShaderClass();
        shader._cj$_constructor_$Shader$string$string$string(t, () => {
            // the constructor left the shader on the stack for us to return
            this.shaders.push(shader);
            this.changed();
            if (callback) callback();
        }, name, fragmentShaderPath, vertexShaderPath);
    }

    _get(name: string): ScratchShaderClass | undefined {
        return this.shaders.find(s => s.name === name);
    }

    _switchToName(name: string) {
        const index = this.shaders.findIndex(s => s.name === name);
        if (index >= 0) {
            this.current = index;
            this.changed();
            return;
        }
        const available = this.shaders.length === 0
            ? `This ${this.owner} has no shaders. Use getShaders().add() to add one first.`
            : "Available shaders: " + this.shaders.map(s => `'${s.name}'`).join(", ");
        console.warn(`Scratch: shader '${name}' not found. ${available}`);
    }

    _switchToIndex(index: number) {
        if (this.shaders.length === 0) return;
        this.current = Math.trunc(index) % this.shaders.length;
        this.changed();
    }

    _next() {
        if (this.shaders.length === 0) return;
        this.current = (this.current + 1) % this.shaders.length;
        this.changed();
    }

    _reset() {
        this.current = -1;
        this.changed();
    }

    _getCurrent(): ScratchShaderClass | undefined {
        if (this.shaders.length === 0 || this.current < 0) return undefined;
        return this.shaders[this.current];
    }

    _getCurrentIndex(): number { return this.current; }

    _getCurrentName(): string | null {
        return this._getCurrent()?.name ?? null;
    }
}
