/**
 * Fretboard geometry, in percent of the instrument surface width.
 * The neck covers 0–70%; the nut sits at 4% and the 12th fret at 70%,
 * with real equal-temperament spacing in between.
 */
export const NUT_PERCENT = 4;
export const NECK_END_PERCENT = 70;
export const VISIBLE_FRETS = 12;
const OCTAVE_FRACTION = 1 - 2 ** (-VISIBLE_FRETS / 12);

/** Horizontal position of fret wire `fret` (0 = the nut). */
export function fretPosition(fret: number): number {
  const fraction = (1 - 2 ** (-fret / 12)) / OCTAVE_FRACTION;
  return NUT_PERCENT + (NECK_END_PERCENT - NUT_PERCENT) * fraction;
}

/** Where a fingertip sits for `fret`: midway between its two fret wires. */
export function fingerPosition(fret: number): number {
  if (fret <= 0) throw new RangeError("Open and muted strings have no finger position");
  return (fretPosition(fret - 1) + fretPosition(fret)) / 2;
}

export const INLAY_FRETS = [3, 5, 7, 9] as const;
export const DOUBLE_INLAY_FRET = 12;

/** Top and bottom string heights in the fretboard's SVG viewBox (362 units tall). */
export const STRING_SPAN = { top: 46, bottom: 316 } as const;

/** Evenly spaced string heights for `count` strings, low string first. */
export function stringPositions(count: number): number[] {
  if (count < 2) return [(STRING_SPAN.top + STRING_SPAN.bottom) / 2];
  const gap = (STRING_SPAN.bottom - STRING_SPAN.top) / (count - 1);
  return Array.from({ length: count }, (_, index) => STRING_SPAN.top + index * gap);
}
