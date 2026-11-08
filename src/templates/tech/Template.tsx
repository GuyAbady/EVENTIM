import { getTranslations } from "next-intl/server";
import { Countdown } from "../blocks/Countdown";
import { ActionLinks, DateLine, VenueLine } from "../blocks/EventInfo";
import type { TemplateProps } from "../types";

// Tech: near-black, grid lines, cyan glow, bracketed labels.
export default async function TechTemplate({ event, locale, links, rsvp }: TemplateProps) {
  const t = await getTranslations("invite");
  const accent = event.primary_color ?? "#22d3ee";

  return (
    <div
      className="min-h-full bg-[#0b0f14] text-[#e6f1ff]"
      style={{
        backgroundImage: `linear-gradient(${accent}14 1px, transparent 1px), linear-gradient(90deg, ${accent}14 1px, transparent 1px)`,
        backgroundSize: "32px 32px",
      }}
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-5 py-12 sm:py-20">
        <header className="flex flex-col gap-5">
          <p className="font-mono text-sm" style={{ color: accent }}>
            {"// "}{t("youAreInvited")}
          </p>
          <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight sm:text-6xl" style={{ textShadow: `0 0 32px ${accent}55` }}>
            {event.title}
          </h1>
          {event.media_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.media_url} alt="" className="aspect-[16/9] w-full rounded-lg object-cover" style={{ boxShadow: `0 0 0 1px ${accent}66, 0 0 40px ${accent}22` }} />
          )}
          {event.description && <p className="max-w-prose whitespace-pre-line text-lg leading-relaxed text-[#e6f1ff]/75">{event.description}</p>}
        </header>
        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border p-4" style={{ borderColor: `${accent}44` }}>
            <div className="font-mono text-xs" style={{ color: accent }}>[{t("when")}]</div>
            <DateLine event={event} locale={locale} className="mt-1 text-lg" />
          </div>
          {(event.venue_name || event.address) && (
            <div className="rounded-lg border p-4" style={{ borderColor: `${accent}44` }}>
              <div className="font-mono text-xs" style={{ color: accent }}>[{t("where")}]</div>
              <VenueLine event={event} className="mt-1 text-lg" />
            </div>
          )}
        </section>
        <Countdown dateTime={event.date_time} />
        <ActionLinks event={event} links={links} pillClass="border-[#e6f1ff]/15 bg-[#e6f1ff]/5" />
        <section className="rounded-lg border bg-[#0b0f14]/80 p-6 backdrop-blur" style={{ borderColor: `${accent}55` }}>{rsvp}</section>
      </div>
    </div>
  );
}
