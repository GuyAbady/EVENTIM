import { createElement, type ComponentType } from "react";
import type { TemplateProps } from "./types";
import ClassicTemplate from "./classic/Template";
import MinimalTemplate from "./minimal/Template";
import MidnightTemplate from "./midnight/Template";
import FloralTemplate from "./floral/Template";
import GoldTemplate from "./gold/Template";
import KidsTemplate from "./kids/Template";
import CorporateTemplate from "./corporate/Template";
import TechTemplate from "./tech/Template";
import FestiveTemplate from "./festive/Template";
import RomanticTemplate from "./romantic/Template";

const components: Record<string, ComponentType<TemplateProps>> = {
  classic: ClassicTemplate,
  minimal: MinimalTemplate,
  midnight: MidnightTemplate,
  floral: FloralTemplate,
  gold: GoldTemplate,
  kids: KidsTemplate,
  corporate: CorporateTemplate,
  tech: TechTemplate,
  festive: FestiveTemplate,
  romantic: RomanticTemplate,
};

export function renderTemplate(id: string, props: TemplateProps) {
  return createElement(components[id] ?? ClassicTemplate, props);
}
