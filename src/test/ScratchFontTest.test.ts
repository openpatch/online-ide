import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { parseTtfMetrics } from '../compiler/java/runtime/graphics/scratch/ScratchFont';

/**
 * The TTF metrics the layout hangs its baselines on, read straight from the
 * bundled font files - the numbers the desktop's stb_truetype sees, verified
 * with fontTools.
 */

/** A Buffer may share a larger ArrayBuffer: the parser sees exactly the file. */
function fontBytes(name: string): ArrayBuffer {
    const buffer = fs.readFileSync(path.resolve(__dirname, '../../assets/fonts', name));
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
}

describe('Scratch font metrics', () => {

    test('UbuntuMono: hhea metrics, the font does not ask for the typographic ones', () => {
        expect(parseTtfMetrics(fontBytes('UbuntuMono-Regular.ttf')))
            .toEqual({ unitsPerEm: 1000, ascent: 830, descent: -170, lineGap: 0 });
    });

    test('Jersey10: typographic metrics, the font asks for them', () => {
        expect(parseTtfMetrics(fontBytes('Jersey10-Regular.ttf')))
            .toEqual({ unitsPerEm: 1400, ascent: 1125, descent: -375, lineGap: 0 });
    });

    test('not a font at all', () => {
        const notAFont = new TextEncoder().encode("plain words, no box");
        expect(parseTtfMetrics(notAFont.buffer as ArrayBuffer)).toBeUndefined();
        expect(parseTtfMetrics(new ArrayBuffer(0))).toBeUndefined();
    });
});
