"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { templates } from "@/templates/registry";

export function TemplatePicker({ name, defaultValue, sampleTitle }: { name: string; defaultValue: string; sampleTitle: string }) {
  const t = useTranslations("templates");
  const [selected, setSelected] = useState(defaultValue);

  return (
    <div role="radiogroup" className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
      {templates.map((tpl) => {
        const active = tpl.id === selected;
        return (
          <label
            key={tpl.id}
            className={`flex cursor-pointer flex-col gap-2 rounded-xl border-2 p-2 transition-colors ${
              active ? "border-accent" : "border-border hover:border-stone-300"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={tpl.id}
              checked={active}
              onChange={() => setSelected(tpl.id)}
              className="sr-only"
            />
            <span
              aria-hidden
              className="flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded-lg px-2 text-center"
              style={{ background: tpl.palette.bg, color: tpl.palette.fg }}
            >
              <span className="h-1 w-8 rounded-full" style={{ background: tpl.palette.accent }} />
              <span
                className={`text-xs leading-tight ${tpl.fontStyle === "serif" ? "font-serif" : "font-sans"}`}
              >
                {sampleTitle || t("sampleTitle")}
              </span>
              <span className="h-1 w-5 rounded-full" style={{ background: tpl.palette.accent }} />
            </span>
            <span className="text-center text-sm">{t(`names.${tpl.nameKey}` as never)}</span>
          </label>
        );
      })}
    </div>
  );
}
