import { renderShareImage } from "@/lib/og/render";

export const dynamic = "force-dynamic";

// The page links to /e/[slug]/og.jpg?v=<updated_at>, so every edit gets a new
// URL and the CDN can hold each version for a long time.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const jpeg = await renderShareImage(slug);
  if (!jpeg) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  return new Response(new Uint8Array(jpeg), {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(jpeg.byteLength),
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
