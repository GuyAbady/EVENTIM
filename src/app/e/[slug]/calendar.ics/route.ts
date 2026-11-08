import { buildIcs } from "@/lib/calendar";
import { getPublicEvent } from "@/lib/public-event";
import { getPublicEventUrl } from "@/lib/site";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  if (!event) return new Response("Not found", { status: 404 });

  const ics = buildIcs(event, getPublicEventUrl(event.slug));
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
