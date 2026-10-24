import ubuntuMonoUrl from "/assets/fonts/UbuntuMono-Regular.ttf";
import jersey10Url from "/assets/fonts/Jersey10-Regular.ttf";
import { isPixelArt } from "./ScratchPixelArt";

/**
 * The desktop library draws all of its text in UbuntuMono — or in Jersey 10
 * once Window.usePixelArt() is on. The .ttf files are bundled by
 * src/development/scratchAssetsGenerator.js, but a bundled file is not a
 * usable font until it is registered with the document — without this every
 * `fontFamily: "UbuntuMono, monospace"` in the library silently fell back to
 * the browser's default monospace, so bubbles and Text came out in the wrong
 * typeface and at a slightly different size from the desktop render.
 */
export const SCRATCH_FONT_FAMILY = "UbuntuMono, monospace";
export const SCRATCH_PIXEL_FONT_FAMILY = "Jersey10, monospace";

/**
 * The font family text is drawn in by default right now: Jersey 10 in
 * pixel-art mode, UbuntuMono otherwise — mirroring the desktop, where
 * Text.resolveFont() falls back to Font.PIXEL_ART or Font.DEFAULT.
 */
export function scratchDefaultFontFamily(): string {
    return isPixelArt() ? SCRATCH_PIXEL_FONT_FAMILY : SCRATCH_FONT_FAMILY;
}

/**
 * The nearest size that is a whole number of Jersey-10 pixels (at least one),
 * unchanged outside pixel-art mode.
 *
 * <p>This mirrors the desktop's Font.roundToPixelGrid for Jersey 10, whose
 * outlines sit on a 75-unit grid at 1400 units per em, so one of its pixels is
 * 1400/75 ≈ 18.667 px and sizes land on 18.667, 37.333, …
 */
export function roundToScratchPixelGrid(size: number): number {
    if (!isPixelArt()) return size;
    const pixel = 1400 / 75;
    return Math.max(pixel, Math.round(size / pixel) * pixel);
}

let loadPromise: Promise<void> | undefined;

export function loadScratchFont(): Promise<void> {
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
        const fonts = (document as any).fonts;
        if (!fonts || typeof FontFace === "undefined") return;
        // each font on its own: one missing file must not keep the other
        // from loading
        try {
            await loadBundledFont("UbuntuMono", ubuntuMonoUrl);
        } catch (e) {
            // a missing font is not worth failing a program over
            console.warn("Scratch: UbuntuMono konnte nicht geladen werden / could not be loaded", e);
        }
        try {
            await loadBundledFont("Jersey10", jersey10Url);
        } catch (e) {
            // a missing font is not worth failing a program over
            console.warn("Scratch: Jersey10 konnte nicht geladen werden / could not be loaded", e);
        }
    })();
    return loadPromise;
}

/**
 * Registers one of the bundled fonts with the document and reads its vertical
 * metrics from the same bytes, so text can be laid out as the desktop's
 * Font.verticalMetrics lays it out. The font is fetched once: the browser
 * builds the FontFace from the bytes instead of fetching the URL again.
 */
async function loadBundledFont(family: string, url: string) {
    const bytes = await fetch(url).then(response => response.arrayBuffer());
    const face = new FontFace(family, bytes);
    await face.load();
    (document as any).fonts.add(face);
    const metrics = parseTtfMetrics(bytes);
    if (metrics) registerScratchFontMetrics(family, metrics);
}

/**
 * The vertical metrics of a font, in font units, as the desktop's
 * Font.verticalMetrics reads them from the file: hhea's ascent, descent and
 * lineGap - or OS/2's typographic ones when the font asks for them
 * (fsSelection bit 7, USE_TYPO_METRICS). The layout scales them by
 * size / unitsPerEm, so text sits the same wherever the font goes.
 */
export interface ScratchFontMetrics {
    /** Font units per em. */
    unitsPerEm: number;
    /** Font units above the baseline. */
    ascent: number;
    /** Font units below the baseline, negative. */
    descent: number;
    /** Font units of extra room between lines. */
    lineGap: number;
}

/** The parsed metrics of the bundled fonts, by their family name. */
const metricsByFamily = new Map<string, ScratchFontMetrics>();

/**
 * The metrics of a font, looked up by the CSS font-family list it is drawn
 * in: the first family of the list is the one that is used. Undefined for a
 * family whose file the browser has - a workspace font - or that is not one
 * of the bundled fonts.
 */
export function scratchFontMetrics(family: string): ScratchFontMetrics | undefined {
    return metricsByFamily.get(firstFamily(family));
}

/** Registers parsed metrics under a family; loadScratchFont() does for the bundled ones. */
export function registerScratchFontMetrics(family: string, metrics: ScratchFontMetrics): void {
    metricsByFamily.set(family, metrics);
}

/** "UbuntuMono, monospace" is the family "UbuntuMono"; so is '"UbuntuMono"'. */
function firstFamily(family: string): string {
    return family.split(",")[0].trim().replace(/^["']|["']$/g, "");
}

/**
 * The vertical metrics of a TrueType or OpenType font, read straight from its
 * bytes - a small sfnt parser standing in for the stb_truetype calls the
 * desktop's Font makes. hhea's ascent, descent and lineGap, unless the font
 * asks for OS/2's typographic ones (fsSelection bit 7, USE_TYPO_METRICS),
 * which Jersey 10 does and UbuntuMono does not.
 *
 * <p>Returns undefined when the bytes are not a readable sfnt font; the text
 * layout then falls back to the canvas's measurements.
 */
export function parseTtfMetrics(bytes: ArrayBuffer): ScratchFontMetrics | undefined {
    const view = new DataView(bytes);
    if (view.byteLength < 12) return undefined;
    // 0x00010000, "true" or "OTTO" start a font; "ttcf" a collection of
    // them, whose first font shares the tables
    const kind = view.getUint32(0);
    let base = 0;
    if (kind === 0x74746366) {
        if (view.byteLength < 16) return undefined;
        base = view.getUint32(12);
    } else if (kind !== 0x00010000 && kind !== 0x4f54544f && kind !== 0x74727565) {
        return undefined;
    }
    if (base + 12 > view.byteLength) return undefined;
    const u16 = (at: number) => view.getUint16(base + at);
    const i16 = (at: number) => view.getInt16(base + at);
    const fits = (at: number, bytes: number) => at >= 0 && at + bytes <= view.byteLength;
    // The table directory: a count at offset 4, then 16-byte records of tag,
    // checksum, offset and length
    const numTables = u16(4);
    const table = (tag: string): { offset: number; length: number } | undefined => {
        for (let i = 0; i < numTables; i++) {
            const record = base + 12 + i * 16;
            if (!fits(record, 16)) return undefined;
            let matches = true;
            for (let c = 0; c < 4; c++) {
                if (view.getUint8(record + c) !== tag.charCodeAt(c)) {
                    matches = false;
                    break;
                }
            }
            if (matches) return { offset: view.getUint32(record + 8), length: view.getUint32(record + 12) };
        }
        return undefined;
    };
    const head = table("head");
    const hhea = table("hhea");
    if (!head || !hhea || !fits(head.offset + 18, 2) || !fits(hhea.offset + 8, 2)) return undefined;
    const unitsPerEm = u16(head.offset + 18);
    if (unitsPerEm === 0) return undefined;
    const metrics: ScratchFontMetrics = {
        unitsPerEm,
        ascent: i16(hhea.offset + 4),
        descent: i16(hhea.offset + 6),
        lineGap: i16(hhea.offset + 8),
    };
    // OS/2's typographic metrics win when the font asks for them
    // (fsSelection bit 7, USE_TYPO_METRICS) - Font.verticalMetrics. The
    // fields sit at 68, 70 and 72 in every version of the table.
    const os2 = table("OS/2");
    if (os2 && os2.length >= 74 && fits(os2.offset + 62, 12)
        && (view.getUint16(base + os2.offset + 62) & (1 << 7)) !== 0) {
        return {
            unitsPerEm,
            ascent: view.getInt16(base + os2.offset + 68),
            descent: view.getInt16(base + os2.offset + 70),
            lineGap: view.getInt16(base + os2.offset + 72),
        };
    }
    return metrics;
}
