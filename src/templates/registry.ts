// Invitation templates. The visual components arrive in stage 2; this
// registry already drives the picker in the event form.

export type TemplateMeta = {
  id: string;
  /** message key under `templates.names` */
  nameKey: string;
  palette: { bg: string; fg: string; accent: string };
  fontStyle: "sans" | "serif";
  suits: Array<"private" | "business">;
};

export const templates: TemplateMeta[] = [
  { id: "classic", nameKey: "classic", palette: { bg: "#fdfbf7", fg: "#2b2420", accent: "#b08d57" }, fontStyle: "serif", suits: ["private"] },
  { id: "minimal", nameKey: "minimal", palette: { bg: "#ffffff", fg: "#111111", accent: "#111111" }, fontStyle: "sans", suits: ["private", "business"] },
  { id: "floral", nameKey: "floral", palette: { bg: "#fff5f6", fg: "#4a2b33", accent: "#c4506b" }, fontStyle: "serif", suits: ["private"] },
  { id: "midnight", nameKey: "midnight", palette: { bg: "#0f1222", fg: "#f3f4ff", accent: "#8b9cff" }, fontStyle: "sans", suits: ["private", "business"] },
  { id: "gold", nameKey: "gold", palette: { bg: "#141210", fg: "#f6efe0", accent: "#d4af37" }, fontStyle: "serif", suits: ["private"] },
  { id: "kids", nameKey: "kids", palette: { bg: "#fff9e6", fg: "#2a2a2a", accent: "#ff7a59" }, fontStyle: "sans", suits: ["private"] },
  { id: "corporate", nameKey: "corporate", palette: { bg: "#f7f9fb", fg: "#1a2733", accent: "#0b63ce" }, fontStyle: "sans", suits: ["business"] },
  { id: "tech", nameKey: "tech", palette: { bg: "#0b0f14", fg: "#e6f1ff", accent: "#22d3ee" }, fontStyle: "sans", suits: ["business"] },
  { id: "festive", nameKey: "festive", palette: { bg: "#fff4f0", fg: "#3b1f1a", accent: "#e63946" }, fontStyle: "sans", suits: ["private", "business"] },
  { id: "romantic", nameKey: "romantic", palette: { bg: "#fbf6f3", fg: "#3d2c2e", accent: "#9a6b7a" }, fontStyle: "serif", suits: ["private"] },
];

export const templateIds = templates.map((t) => t.id) as [string, ...string[]];

export function getTemplate(id: string): TemplateMeta {
  return templates.find((t) => t.id === id) ?? templates[0];
}
