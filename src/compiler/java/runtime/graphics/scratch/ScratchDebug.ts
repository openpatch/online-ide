/** Window.DEBUG_COLOR upstream. */
export const DEBUG_COLOR = 0xff0000;

/** The debug overlay uses the library's default font at its default size. */
export const DEBUG_FONT_FAMILY = "UbuntuMono, monospace";
export const DEBUG_FONT_SIZE = 14;

/**
 * `Math.round(v * 100) / 100.0` the way Java prints it — two decimals at most,
 * and a whole number still shows its `.0`.
 */
export function round2(value: number): string {
    const rounded = Math.round(value * 100) / 100;
    return Number.isInteger(rounded) ? rounded.toFixed(1) : String(rounded);
}

/**
 * `Math.round(v * 100) / 100` with no decimal point on the divisor — that is
 * integer division in Java, so the result is a whole number. Upstream uses this
 * for the frame rate and the zoom, and the readout would be wrong with decimals.
 */
export function roundInt(value: number): string {
    return String(Math.trunc(Math.round(value * 100) / 100));
}
