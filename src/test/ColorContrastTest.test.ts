import { expect, test } from 'vitest'

import { contrastRatio, parseColor, readableColor } from '../tools/ColorContrast';

const white = parseColor("#ffffff")!;
const dark = parseColor("#1e1e1e")!;

test('parseColor', () => {
  expect(parseColor("#ff0")).toStrictEqual([255, 255, 0, 1]);
  expect(parseColor("#1e1e1e")).toStrictEqual([30, 30, 30, 1]);
  expect(parseColor("rgba(255, 0, 0, 0.5)")).toStrictEqual([255, 0, 0, 0.5]);
  expect(parseColor("var(--defaultPrintColor)")).toBeUndefined();
})

test('contrastRatio', () => {
  expect(contrastRatio(parseColor("#000000")!, white)).toBeCloseTo(21, 1);
  expect(contrastRatio(parseColor("#ffff00")!, white)).toBeCloseTo(1.07, 2);
})

test('readableColor keeps colours that are readable already', () => {
  expect(readableColor("#000080", white)).toBe("#000080");
  expect(readableColor("#ffff00", dark)).toBe("#ffff00");
  expect(readableColor("var(--defaultPrintColor)", white)).toBe("var(--defaultPrintColor)");
})

test('readableColor darkens on light and lightens on dark backgrounds', () => {
  for (let color of ["#ffff00", "#00ffff", "#ff0000", "#00ff00", "#ffffff"]) {
    let adjusted = readableColor(color, white);
    expect(contrastRatio(parseColor(adjusted)!, white), color + " on white").toBeGreaterThanOrEqual(4.5);
  }
  for (let color of ["#008000", "#000080", "#ff0000", "#000000", "#800080"]) {
    let adjusted = readableColor(color, dark);
    expect(contrastRatio(parseColor(adjusted)!, dark), color + " on dark").toBeGreaterThanOrEqual(4.5);
  }
  // same hue: yellow stays yellowish (red and green equal, no blue)
  let yellow = parseColor(readableColor("#ffff00", white))!;
  expect(yellow[0]).toBe(yellow[1]);
  expect(yellow[2]).toBe(0);
})
