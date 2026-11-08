import { getSiteUrl } from "@/lib/site";

export function shareImagePath(slug: string, version: string | null | undefined): string {
  const v = version ? new Date(version).getTime() : 0;
  return `/e/${slug}/og.jpg?v=${v}`;
}

export function shareImageUrl(slug: string, version: string | null | undefined): string {
  return `${getSiteUrl()}${shareImagePath(slug, version)}`;
}
