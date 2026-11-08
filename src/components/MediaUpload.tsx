"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

const BUCKET = "inv-event-media";
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function MediaUpload({ name, defaultValue }: { name: string; defaultValue: string | null }) {
  const t = useTranslations("eventForm");
  const [url, setUrl] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File) {
    setError(null);
    if (file.size > MAX_BYTES || !ACCEPT.split(",").includes(file.type)) {
      setError(t("mediaHelp"));
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      setUrl(data.publicUrl);
    } catch {
      setError(t("mediaError"));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name={name} value={url} />
      {url ? (
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="h-28 w-28 rounded-lg border border-border object-cover" />
          <Button type="button" variant="secondary" onClick={() => setUrl("")}>
            {t("mediaRemove")}
          </Button>
        </div>
      ) : null}
      <div className="flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          id={`${name}-file`}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
          }}
        />
        <Button type="button" variant="secondary" disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? t("mediaUploading") : t("mediaUpload")}
        </Button>
        <span className="text-sm text-muted">{t("mediaHelp")}</span>
      </div>
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
    </div>
  );
}
