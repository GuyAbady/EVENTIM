import bidiFactory from "bidi-js";

const bidi = bidiFactory();

// Satori (next/og) draws characters in logical order and does not run the
// Unicode bidi algorithm, so Hebrew comes out mirrored. This converts a
// single-line string to visual order so it can be drawn left-to-right.
export function toVisual(text: string, baseDirection: "rtl" | "ltr" = "rtl"): string {
  if (!text) return text;
  const chars = Array.from(text);
  const levels = bidi.getEmbeddingLevels(text, baseDirection);
  const mirrored = bidi.getMirroredCharactersMap(text, levels);
  for (const [index, replacement] of mirrored) chars[index] = replacement;
  const flips = bidi.getReorderSegments(text, levels);
  for (const [start, end] of flips) {
    const slice = chars.slice(start, end + 1).reverse();
    for (let i = 0; i < slice.length; i++) chars[start + i] = slice[i];
  }
  return chars.join("");
}
