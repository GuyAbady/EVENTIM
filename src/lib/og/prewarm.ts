import "server-only";
import { getPublicEventUrl } from "@/lib/site";
import { shareImageUrl } from "./url";

// Messaging apps give a link a few seconds to answer. Fetching the page and
// the share image right after a save puts both in the CDN before the first
// real share.
export async function prewarmShare(slug: string, version: string | null | undefined): Promise<void> {
  const targets = [shareImageUrl(slug, version), getPublicEventUrl(slug)];
  await Promise.allSettled(
    targets.map((url) => fetch(url, { cache: "no-store", signal: AbortSignal.timeout(25000) }).then((r) => r.arrayBuffer())),
  );
}
