import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { getLocale } from "next-intl/server";
import { getPublicEvent, type PublicEvent } from "@/lib/public-event";
import { formatEventDate, formatEventTime } from "@/lib/dates";
import { getTemplate } from "@/templates/registry";
import { toVisual } from "@/lib/bidi-visual";

// Share preview for WhatsApp, Facebook, Telegram and friends.
// 1200x630 JPEG kept small, because WhatsApp drops previews above ~300KB.

export const OG_SIZE = { width: 1200, height: 630 };
const size = OG_SIZE;

const FONT_DIR = path.join(process.cwd(), "src/assets/fonts");

async function loadFonts() {
  const [he400, he700, la400, la700] = await Promise.all(
    ["heebo-hebrew-400-normal", "heebo-hebrew-700-normal", "heebo-latin-400-normal", "heebo-latin-700-normal"].map((f) =>
      readFile(path.join(FONT_DIR, `${f}.woff`)),
    ),
  );
  return [
    { name: "Heebo", data: he400, weight: 400 as const, style: "normal" as const },
    { name: "Heebo", data: he700, weight: 700 as const, style: "normal" as const },
    { name: "Heebo", data: la400, weight: 400 as const, style: "normal" as const },
    { name: "Heebo", data: la700, weight: 700 as const, style: "normal" as const },
  ];
}

// Downscale the uploaded media to the card size so Satori does not embed a huge image.
async function loadBackground(mediaUrl: string | null): Promise<string | null> {
  if (!mediaUrl) return null;
  try {
    const res = await fetch(mediaUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const input = Buffer.from(await res.arrayBuffer());
    const jpeg = await sharp(input, { animated: false })
      .resize(size.width, size.height, { fit: "cover", position: "attention" })
      .jpeg({ quality: 70 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return null;
  }
}

const isHebrew = (s: string) => /[֐-׿]/.test(s);

export async function renderShareImage(slug: string): Promise<Buffer | null> {
  const event: PublicEvent | null = await getPublicEvent(slug);
  if (!event) return null;
  const locale = await getLocale();
  const [fonts, background] = await Promise.all([loadFonts(), loadBackground(event?.media_url ?? null)]);

  const template = getTemplate(event?.template_id ?? "classic");
  const accent = event?.primary_color ?? template.palette.accent;
  const bg = background ? "#111" : template.palette.bg;
  const fg = background ? "#ffffff" : template.palette.fg;
  const rawTitle = event?.title ?? "";
  const rtl = isHebrew(rawTitle) || locale === "he";
  const base = rtl ? "rtl" : "ltr";
  // Everything is drawn LTR in visual order; RTL content is aligned to the end.
  const title = toVisual(rawTitle, base);
  const dateLine = event ? toVisual(`${formatEventDate(event.date_time, locale)} · ${formatEventTime(event.date_time)}`, base) : "";
  const venueLine = event ? toVisual([event.venue_name, event.address].filter(Boolean).join(" · "), base) : "";
  const kicker = toVisual(locale === "he" ? "הנכם מוזמנים" : "You are invited", base);
  // Keep the title on one line: visual reordering cannot survive wrapping.
  const titleSize = Math.max(34, Math.min(72, Math.floor(1056 / (Math.max(Array.from(rawTitle).length, 1) * 0.56))));
  const align = rtl ? "flex-end" : "flex-start";

  const png = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: bg,
          color: fg,
          fontFamily: "Heebo",
        }}
      >
        {background && (
          // eslint-disable-next-line @next/next/no-img-element -- Satori markup, not a DOM image
          <img src={background} alt="" width={size.width} height={size.height} style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }} />
        )}
        {background && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.15) 100%)",
            }}
          />
        )}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            width: "100%",
            height: "100%",
            padding: "56px 72px",
            gap: 14,
            alignItems: align,
          }}
        >
          <div style={{ display: "flex", flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", gap: 16, fontSize: 26, color: background ? "#fff" : accent, opacity: 0.95 }}>
            <div style={{ width: 48, height: 6, background: accent, borderRadius: 3 }} />
            <span>{kicker}</span>
          </div>
          <div
            style={{
              fontSize: titleSize,
              fontWeight: 700,
              lineHeight: 1.15,
              whiteSpace: "nowrap",
              ...(background ? { textShadow: "0 2px 24px rgba(0,0,0,0.5)" } : {}),
            }}
          >
            {title}
          </div>
          {dateLine && <div style={{ fontSize: 34, opacity: 0.95, whiteSpace: "nowrap" }}>{dateLine}</div>}
          {venueLine && <div style={{ fontSize: 28, opacity: 0.8, whiteSpace: "nowrap" }}>{venueLine}</div>}
        </div>
      </div>
    ),
    { ...size, fonts },
  );

  return sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
}
