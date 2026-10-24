/**
 * Where lines break: at every {@code \n}; otherwise at spaces and after
 * hyphens, greedily; a word wider than the line breaks between letters, never
 * so that a hyphen starts a line. Spaces at a break belong to neither line.
 *
 * <p>A 1:1 port of the desktop's org.openpatch.scratch.internal.text.LineBreaker,
 * which is "small and separate so that the online IDE can port it line by
 * line". The lines here are strings where the Java keeps arrays of codepoints,
 * and the measure sees one run of codepoints at a time, as a string.
 */

/** The width of one run of codepoints as it would sit on a line, kerning included. */
export type Measure = (run: string) => number;

/**
 * The lines of a text.
 *
 * @param maxWidth the widest a line may be; 0, negative or infinite means no wrapping
 */
export function breakLines(text: string, maxWidth: number, measure: Measure): string[] {
    const wrap = maxWidth > 0 && Number.isFinite(maxWidth);
    const lines: string[] = [];
    for (const paragraph of text.split("\n")) {
        const cps = Array.from(paragraph);
        if (!wrap) {
            lines.push(cps.join(""));
            continue;
        }
        let start = 0;
        while (true) {
            let end = start;
            while (end < cps.length && measure(cps.slice(start, end + 1).join("")) <= maxWidth) {
                end++;
            }
            if (end === cps.length) {
                lines.push(cps.slice(start).join(""));
                break;
            }
            // cps[start, end) fits, cps[end] does not: find a break at a space or after a hyphen
            let at = -1;
            for (let p = end; p > start; p--) {
                if (cps[p] === " " || cps[p - 1] === "-") {
                    at = p;
                    break;
                }
            }
            let next;
            if (at > start) {
                lines.push(trimEnd(cps, start, at));
                next = at;
            } else {
                // a word wider than the line: between letters, at least one per line
                let cut = Math.max(end, start + 1);
                if (cut < cps.length && cps[cut] === "-" && cut - 1 > start) {
                    cut--; // the hyphen goes with the letter before it, not to the start of a line
                }
                lines.push(cps.slice(start, cut).join(""));
                next = cut;
            }
            while (next < cps.length && cps[next] === " ") {
                next++;
            }
            if (next === cps.length) {
                break;
            }
            start = next;
        }
    }
    return lines;
}

/** Drops the spaces a break leaves at the end of the line before it. */
function trimEnd(cps: string[], start: number, end: number): string {
    while (end > start && cps[end - 1] === " ") {
        end--;
    }
    return cps.slice(start, end).join("");
}
