import { describe, expect, test } from 'vitest';
import { breakLines } from '../compiler/java/runtime/graphics/scratch/ScratchLineBreaker';

/**
 * The ported LineBreaker (org.openpatch.scratch.internal.text.LineBreaker):
 * a newline always breaks; otherwise lines break at spaces and after hyphens,
 * greedily; a word wider than the line breaks between letters, never so that
 * a hyphen starts a line; spaces at a break belong to neither line.
 *
 * <p>The measure counts 10 for every letter, so a run of n letters is 10n
 * wide and the cases below can be worked out on paper.
 */
const measure = (run: string) => run.length * 10;

describe('Scratch line breaker', () => {

    test('a newline always breaks, and an empty line stays a line', () => {
        expect(breakLines("a\nb", 1000, measure)).toEqual(["a", "b"]);
        expect(breakLines("a\n\nb", 1000, measure)).toEqual(["a", "", "b"]);
        expect(breakLines("a\nb\n", 1000, measure)).toEqual(["a", "b", ""]);
        expect(breakLines("", 1000, measure)).toEqual([""]);
    });

    test('without a width, nothing wraps', () => {
        expect(breakLines("a b c", 0, measure)).toEqual(["a b c"]);
        expect(breakLines("a b c", -1, measure)).toEqual(["a b c"]);
        expect(breakLines("a b c", Infinity, measure)).toEqual(["a b c"]);
    });

    test('breaks greedily at a space, and the space belongs to neither line', () => {
        // "aa bb" is 50 wide: it fits, "aa bb c" does not
        expect(breakLines("aa bb c", 50, measure)).toEqual(["aa bb", "c"]);
        // "aa b" would fit in 40, "aa bb" does not: the break is at the space
        expect(breakLines("aa bb", 40, measure)).toEqual(["aa", "bb"]);
        // the spaces a break leaves behind are trimmed from both lines
        expect(breakLines("aa    bb", 30, measure)).toEqual(["aa", "bb"]);
    });

    test('breaks after a hyphen, when the hyphen fits', () => {
        // "Donut-" is 60 wide: it fits in 60, the whole word does not
        expect(breakLines("Donut-io", 60, measure)).toEqual(["Donut-", "io"]);
    });

    test('never so that a hyphen starts a line', () => {
        // "Donut" is 50 wide and the hyphen does not fit: cutting after it
        // would start the next line with "-", so the cut moves back a letter
        expect(breakLines("Donut-io", 50, measure)).toEqual(["Donu", "t-io"]);
        // and where a hyphen ends a line, the next one starts with a letter
        expect(breakLines("aaaaa-bbbb", 50, measure)).toEqual(["aaaa", "a-", "bbbb"]);
    });

    test('a word wider than the line breaks between letters, at least one per line', () => {
        expect(breakLines("Donut", 30, measure)).toEqual(["Don", "ut"]);
        expect(breakLines("aaaaaa", 10, measure)).toEqual(["a", "a", "a", "a", "a", "a"]);
    });
});
