import { describe, expect, test } from 'vitest';
// the interpreter and compiler first, as JavaTests does: importing the runtime classes
// on their own runs into an import cycle
import '../compiler/common/interpreter/Interpreter';
import '../compiler/java/JavaCompiler';
import { isDefaultVertexShader, translate } from '../compiler/java/runtime/graphics/scratch/ScratchShaders';

const PIXELATE = `#ifdef GL_ES
precision mediump float;
#endif

#define PROCESSING_TEXTURE_SHADER

varying vec4 vertTexCoord;
uniform sampler2D texture;
uniform vec2 pixels;

void main(void)
{
    vec2 p = vertTexCoord.st;
    p.x -= mod(p.x, 1.0 / pixels.x);
    gl_FragColor = texture2D(texture, p);
}`;

/** The translated program's lines from the `#line 1` on: the file's own lines. */
function fileLines(fragment: string): string[] {
    const after = fragment.split("\n");
    return after.slice(after.indexOf("#line 1") + 1);
}

describe('Processing shaders as PIXI filters', () => {

    test('every line of the file keeps its number, so errors point at it', () => {
        const lines = fileLines(translate(PIXELATE).fragment);
        const original = PIXELATE.split("\n");
        // the line with mod() is line 14 in the file and in the translation
        expect(original[13]).toContain("mod(p.x");
        expect(lines[13]).toContain("mod(p.x");
    });

    test('Processing names are mapped to WebGL 2', () => {
        const { fragment } = translate(PIXELATE);
        expect(fragment.startsWith("#version 300 es")).toBe(true);
        expect(fragment).not.toMatch(/varying\s+vec4\s+vertTexCoord/);
        expect(fragment).not.toMatch(/uniform\s+sampler2D\s+texture\s*;/);
        expect(fragment).toContain("_pTexture(p)");
        expect(fragment).toContain("#define gl_FragColor _pFragColor");
        expect(fragment).toContain("void _pMain()");
    });

    test('texture() on the costume, textureSize and texOffset are supplied', () => {
        const { fragment } = translate(`uniform sampler2D texture;
uniform vec2 texOffset;
varying vec4 vertTexCoord;
void main() {
  vec2 size = vec2(textureSize(texture, 0));
  gl_FragColor = texture(texture, vertTexCoord.st + texOffset);
}`);
        expect(fragment).toContain("vec2(ivec2(uOutputFrame.zw))");
        expect(fragment).toContain("_pTexture(vertTexCoord.st + texOffset)");
        expect(fragment).toContain("#define texOffset (1.0 / uOutputFrame.zw)");
        expect(fragment).not.toMatch(/uniform\s+vec2\s+texOffset/);
    });

    test('uniforms are declared with their types, arrays in both spellings', () => {
        const { uniforms } = translate(`uniform float time;
uniform int rad;
uniform vec2 resolution;
uniform vec3[100] lights;
uniform vec4 colours[4];
uniform sampler2D texture;
void main() {}`);
        expect(uniforms.time).toEqual({ type: "f32", value: 0 });
        expect(uniforms.rad).toEqual({ type: "i32", value: 0 });
        expect(uniforms.resolution.type).toBe("vec2<f32>");
        expect(uniforms.resolution.value).toBeInstanceOf(Float32Array);
        expect(uniforms.lights.size).toBe(100);
        expect(uniforms.lights.value.length).toBe(300);
        expect(uniforms.colours.size).toBe(4);
        expect(uniforms.texture).toBeUndefined();
    });

    test("Processing's default vertex shader is recognised", () => {
        expect(isDefaultVertexShader(`uniform mat4 transformMatrix;
uniform mat4 texMatrix;
attribute vec4 position;
attribute vec2 texCoord;
varying vec4 vertTexCoord;
void main() {
  gl_Position = transformMatrix * position;
  vertTexCoord = texMatrix * vec4(texCoord, 1.0, 1.0);
}`)).toBe(true);
        expect(isDefaultVertexShader(`void main() { gl_Position = vec4(0.0); }`)).toBe(false);
    });
});
