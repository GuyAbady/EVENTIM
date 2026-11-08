declare module "bidi-js" {
  type EmbeddingLevels = { levels: Uint8Array; paragraphs: Array<{ start: number; end: number; level: number }> };
  type Bidi = {
    getEmbeddingLevels(text: string, baseDirection?: "ltr" | "rtl" | "auto"): EmbeddingLevels;
    getReorderSegments(text: string, levels: EmbeddingLevels, start?: number, end?: number): Array<[number, number]>;
    getMirroredCharactersMap(text: string, levels: EmbeddingLevels, start?: number, end?: number): Map<number, string>;
    getMirroredCharacter(char: string): string | null;
  };
  export default function bidiFactory(): Bidi;
}
