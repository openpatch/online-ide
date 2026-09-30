/**
 * Contrast between text and background as WCAG defines it, and a way to make
 * a colour readable on a given background while keeping its hue.
 *
 * Used for the colours programs print with (println("...", Color.yellow)):
 * they are chosen by the program, not by the theme, so yellow would be all
 * but invisible on the light theme's white output and dark green on the dark
 * theme's black.
 */

type RGBA = [number, number, number, number];

/** Parses #rgb, #rrggbb and rgb()/rgba() as getComputedStyle returns them. */
export function parseColor(color: string): RGBA | undefined {
    color = color.trim();
    let hex = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hex) {
        let h = hex[1];
        if (h.length == 3) h = h.split("").map(c => c + c).join("");
        return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16), 1];
    }
    let rgb = color.match(/^rgba?\(([^)]*)\)$/i);
    if (rgb) {
        let parts = rgb[1].split(/[\s,\/]+/).filter(p => p != "").map(p => parseFloat(p));
        if (parts.length < 3 || parts.some(p => isNaN(p))) return undefined;
        return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
    }
    return undefined;
}

function over(top: RGBA, bottom: RGBA): RGBA {
    let a = top[3];
    return [0, 1, 2].map(i => top[i] * a + bottom[i] * (1 - a)).concat(1) as RGBA;
}

function relativeLuminance(c: RGBA): number {
    let f = (v: number) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
}

export function contrastRatio(a: RGBA, b: RGBA): number {
    let la = relativeLuminance(a);
    let lb = relativeLuminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** The colour actually painted behind element: its and its ancestors' backgrounds, composited. */
export function effectiveBackground(element: HTMLElement): RGBA {
    let layers: RGBA[] = [];
    for (let e: HTMLElement | null = element; e != null; e = e.parentElement) {
        let c = parseColor(getComputedStyle(e).backgroundColor);
        if (c && c[3] > 0) {
            layers.push(c);
            if (c[3] >= 1) break;
        }
    }
    let background: RGBA = [255, 255, 255, 1];
    for (let i = layers.length - 1; i >= 0; i--) background = over(layers[i], background);
    return background;
}

/**
 * color itself if it reaches minRatio against background, otherwise color
 * mixed with black (on a light background) or white (on a dark one) just as
 * far as needed: same hue, only darker or lighter.
 */
export function readableColor(color: string, background: RGBA, minRatio: number = 4.5): string {
    let c = parseColor(color);
    if (!c) return color;
    c = over(c, background);
    if (contrastRatio(c, background) >= minRatio) return color;

    let target: RGBA = relativeLuminance(background) > 0.18 ? [0, 0, 0, 1] : [255, 255, 255, 1];
    let mixed = c;
    for (let t = 0.05; t <= 1.0001; t += 0.05) {
        mixed = [0, 1, 2].map(i => c![i] * (1 - t) + target[i] * t).concat(1) as RGBA;
        if (contrastRatio(mixed, background) >= minRatio) break;
    }
    return "#" + mixed.slice(0, 3).map(v => Math.round(v).toString(16).padStart(2, "0")).join("");
}

/** Attribute that keeps the colour a program printed with, before readableColor. */
export const printColorAttribute = "data-jo-print-color";

/**
 * Called after a theme switch: adjusts the text a program printed to the new
 * background, starting again from the colours the program asked for.
 */
export function readjustPrintColors(root: HTMLElement) {
    let backgrounds = new Map<Element, RGBA>();
    root.querySelectorAll<HTMLElement>(`[${printColorAttribute}]`).forEach(span => {
        let output = span.parentElement?.parentElement ?? span;
        let background = backgrounds.get(output);
        if (!background) {
            background = effectiveBackground(<HTMLElement>output);
            backgrounds.set(output, background);
        }
        span.style.color = readableColor(span.getAttribute(printColorAttribute)!, background);
    });
}
