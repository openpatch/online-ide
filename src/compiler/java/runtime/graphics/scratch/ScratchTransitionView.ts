import * as PIXI from "pixi.js";

/**
 * A stage transition as upstream draws it (internal.render.Programs): a
 * fragment shader that mixes `from`, the old stage's picture at the moment of
 * the request, with `to`, the new stage, by `progress` from 0 to 1. The
 * built-in transitions are such shaders too; Transition.fromShader brings one
 * of the program's own, in the same format:
 *
 *   uniform sampler2D from;  uniform sampler2D to;
 *   uniform float progress;  uniform vec2 resolution;
 *   in vec2 uv;              (0,0 top left to 1,1 bottom right)
 *   out vec4 color;          (straight alpha)
 *
 * Here the shader runs on a mesh that covers the stage, drawn over everything.
 */

/** upstream's Programs.BUILT_IN_TRANSITIONS, word for word */
export const BUILT_IN_TRANSITIONS: Record<string, string> = {
    "fade": `
void main() {
  float p = progress * 2.0;
  color = p < 1.0 ? mix(texture(from, uv), vec4(0.0, 0.0, 0.0, 1.0), p)
                  : mix(vec4(0.0, 0.0, 0.0, 1.0), texture(to, uv), p - 1.0);
}
`,
    "crossfade": `
void main() {
  color = mix(texture(from, uv), texture(to, uv), progress);
}
`,
    "slide-left": `
void main() {
  vec2 p = uv + vec2(progress, 0.0);
  color = p.x < 1.0 ? texture(from, p) : texture(to, p - vec2(1.0, 0.0));
}
`,
    "slide-right": `
void main() {
  vec2 p = uv - vec2(progress, 0.0);
  color = p.x >= 0.0 ? texture(from, p) : texture(to, p + vec2(1.0, 0.0));
}
`,
    "slide-up": `
void main() {
  vec2 p = uv + vec2(0.0, progress);
  color = p.y < 1.0 ? texture(from, p) : texture(to, p - vec2(0.0, 1.0));
}
`,
    "slide-down": `
void main() {
  vec2 p = uv - vec2(0.0, progress);
  color = p.y >= 0.0 ? texture(from, p) : texture(to, p + vec2(0.0, 1.0));
}
`,
};

const VERTEX = `#version 300 es
in vec2 aPosition;
in vec2 aUV;
out vec2 vUV;
uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;
void main() {
    mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
    gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
    vUV = aUV;
}`;

/**
 * upstream's Programs.transitionFragment in GLSL ES 3.00: the names in front
 * of the body, its main renamed, the colour premultiplied afterwards. Lines up
 * to `#line 1`, so a compile error names the line in the file.
 */
export function transitionFragment(body: string): string {
    return "#version 300 es\n"
        + "precision highp float; precision highp int;"
        + " uniform sampler2D from; uniform sampler2D to; uniform float progress; uniform vec2 resolution;"
        + " in vec2 vUV; out vec4 _pFragColor; vec2 uv; vec4 color;"
        + " vec4 _straight(vec4 p) { return p.a > 0.0 ? vec4(p.rgb / p.a, p.a) : vec4(0.0); }\n"
        + "#define texture(s, p) _straight(texture(s, p))\n"
        + "#define main _transition\n"
        + "#line 1\n"
        + body.replace(/\r\n?/g, "\n")
        + "\n#undef main\n"
        + "void main(void) { uv = vUV; color = vec4(0.0, 0.0, 0.0, 1.0); _transition();"
        + " _pFragColor = vec4(color.rgb * color.a, color.a); }\n";
}

/** The compiler's message for a transition shader that does not compile, or undefined. */
export function transitionCompileError(body: string): string | undefined {
    if (typeof document === "undefined") return undefined;
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return undefined;
    const shader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!shader) return undefined;
    gl.shaderSource(shader, transitionFragment(body));
    gl.compileShader(shader);
    const log = gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? undefined : (gl.getShaderInfoLog(shader) ?? "").trim();
    gl.deleteShader(shader);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return log;
}

/** The two pictures and the mesh that mixes them, for one transition. */
export class ScratchTransitionView {
    readonly mesh: PIXI.Mesh<PIXI.Geometry, PIXI.Shader>;
    private readonly from: PIXI.RenderTexture;
    private readonly to: PIXI.RenderTexture;
    private readonly uniforms: PIXI.UniformGroup;

    constructor(private readonly renderer: PIXI.Renderer, width: number, height: number, body: string) {
        this.from = PIXI.RenderTexture.create({ width, height, resolution: 1 });
        this.to = PIXI.RenderTexture.create({ width, height, resolution: 1 });
        this.uniforms = new PIXI.UniformGroup({
            progress: { value: 0, type: "f32" },
            resolution: { value: new Float32Array([width, height]), type: "vec2<f32>" },
        });
        const geometry = new PIXI.Geometry({
            attributes: {
                aPosition: [0, 0, width, 0, width, height, 0, height],
                aUV: [0, 0, 1, 0, 1, 1, 0, 1],
            },
            indexBuffer: [0, 1, 2, 0, 2, 3],
        });
        const shader = new PIXI.Shader({
            glProgram: PIXI.GlProgram.from({ vertex: VERTEX, fragment: transitionFragment(body), name: "scratch-transition" }),
            resources: { from: this.from.source, to: this.to.source, transitionUniforms: this.uniforms },
        });
        this.mesh = new PIXI.Mesh({ geometry, shader });
    }

    /**
     * The old stage as it is now: drawn once, it stands still for the whole
     * transition. `colour` is its stage colour, which the renderer otherwise
     * paints as the background.
     */
    snapshotFrom(root: PIXI.Container | undefined, colour: number) { this.draw(root, this.from, colour); }

    /** The new stage; it stands still as well, but is drawn each frame as it loads. */
    drawTo(root: PIXI.Container | undefined, colour: number) { this.draw(root, this.to, colour); }

    setProgress(progress: number) {
        (this.uniforms.uniforms as any).progress = Math.max(0, Math.min(1, progress));
        this.uniforms.update();
    }

    private draw(root: PIXI.Container | undefined, target: PIXI.RenderTexture, colour: number) {
        if (!root || root.destroyed) return;
        const visible = root.visible;
        root.visible = true;
        try {
            this.renderer.render({ container: root, target, clear: true,
                // an array: the number 0 for black would be taken for "no colour"
                clearColor: PIXI.Color.shared.setValue(colour).toArray(), transform: new PIXI.Matrix() });
        } finally {
            root.visible = visible;
        }
    }

    destroy() {
        this.mesh.destroy();
        this.from.destroy(true);
        this.to.destroy(true);
    }
}
