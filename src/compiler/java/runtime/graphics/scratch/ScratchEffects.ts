import * as PIXI from "pixi.js";

/**
 * Scratch's colour effect, the exact maths of the desktop library's shader
 * (internal/render/Programs.java, EFFECTS): the hue turns in HSV — dark colours
 * are lifted to a visible hue first and near-greys get a saturation floor, as
 * in Scratch — with 200 being once around. The desktop applies the effect on
 * the straight colour; Pixi's filter input is premultiplied, so the filter
 * unpremultiplies and premultiplies back the same way the desktop's SPRITE
 * program does. Tint and ghost are not part of this filter: the containers
 * already carry them as tint and alpha.
 */
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

const FRAGMENT = `#version 300 es
precision highp float;
in vec2 vTextureCoord;
out vec4 fragColor;
uniform sampler2D uTexture;
uniform float uColorEffect;   // colour effect in turns, 0..1 (desktop: effect / 200)
vec3 _rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}
vec3 _hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
void main(void) {
    vec4 p = texture(uTexture, vTextureCoord);
    if (p.a <= 0.0) { fragColor = p; return; }
    vec4 c = vec4(p.rgb / p.a, p.a);          // straight colour, as on the desktop
    if (uColorEffect != 0.0) {
        vec3 hsv = _rgb2hsv(c.rgb);
        if (hsv.z < 0.055) {
            hsv = vec3(0.0, 1.0, 0.055);
        } else if (hsv.y < 0.09) {
            hsv = vec3(0.0, 0.09, hsv.z);
        }
        hsv.x = fract(hsv.x + uColorEffect);
        c.rgb = _hsv2rgb(hsv);
    }
    fragColor = vec4(c.rgb * c.a, c.a);
}`;

let glProgram: PIXI.GlProgram | undefined;

/**
 * A filter for one colour effect value. Each owner keeps its own instance,
 * because the effect value rides in the filter's uniform.
 */
export function createColorEffectFilter(effect: number): PIXI.Filter {
    glProgram ??= PIXI.GlProgram.from({ vertex: VERTEX, fragment: FRAGMENT, name: "scratch-color-effect" });
    const group = new PIXI.UniformGroup({ uColorEffect: { type: "f32", value: effect / 200 } });
    return new PIXI.Filter({ glProgram, resources: { scratchColorEffect: group } });
}
