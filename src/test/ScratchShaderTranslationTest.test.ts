import { describe, expect, test } from 'vitest';
// the interpreter and compiler first, as JavaTests does: importing the runtime classes
// on their own runs into an import cycle
import '../compiler/common/interpreter/Interpreter';
import '../compiler/java/JavaCompiler';
import { translate } from '../compiler/java/runtime/graphics/scratch/ScratchShaders';

// the library's demos/shader/pixelate.frag
const PIXELATE = `uniform vec2 pixels;

void main(void)
{
  	vec2 p = uv;

	p.x -= mod(p.x, 1.0 / pixels.x);
	p.y -= mod(p.y, 1.0 / pixels.y);

	vec4 col = texture(costume, p).rgba;
	color = vec4(col);
}`;

/** The translated program's lines from the `#line 1` on: the file's own lines. */
function fileLines(fragment: string): string[] {
    const after = fragment.split("\n");
    return after.slice(after.indexOf("#line 1") + 1);
}

describe('Scratch for Java 7 shaders as PIXI filters', () => {

    test('every line of the file keeps its number, so errors point at it', () => {
        const lines = fileLines(translate(PIXELATE).fragment);
        const original = PIXELATE.split("\n");
        // the line with mod() is line 7 in the file and in the translation
        expect(original[6]).toContain("mod(p.x");
        expect(lines[6]).toContain("mod(p.x");
    });

    test('the names upstream puts in front of the body are there', () => {
        const { fragment } = translate(PIXELATE);
        expect(fragment.startsWith("#version 300 es")).toBe(true);
        expect(fragment).toContain("#define costume uTexture");
        expect(fragment).toContain("#define texture(s, p) _pTexture(s, p)");
        expect(fragment).toContain("uniform float time;");
        expect(fragment).toContain("vec2 uv; vec4 color;");
        // the body's main runs from the real one, which premultiplies color
        expect(fragment).toContain("#define main _student");
        expect(fragment).toContain("_student(); _pFragColor = vec4(color.rgb * color.a, color.a);");
    });

    test("textureSize of the costume is the costume's size", () => {
        const { fragment } = translate(`void main() {
  vec2 size = vec2(textureSize(costume, 0));
  color = texture(costume, uv + 1.0 / size);
}`);
        expect(fragment).toContain("vec2(ivec2(resolution))");
    });

    test('uniforms are declared with their types, arrays in both spellings', () => {
        const { uniforms, glslTypes } = translate(`uniform int rad;
uniform vec3[100] lights;
uniform vec4 colours[4];
uniform sampler2D other;
void main() {}`);
        // time is filled in on every draw, and set() may not reach it
        expect(uniforms.time).toEqual({ type: "f32", value: 0 });
        expect(glslTypes.time).toBeUndefined();
        expect(uniforms.rad).toEqual({ type: "i32", value: 0 });
        expect(uniforms.lights.size).toBe(100);
        expect(uniforms.lights.value.length).toBe(300);
        expect(uniforms.colours.size).toBe(4);
        expect(uniforms.other).toBeUndefined();
    });
});
