"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { sendRemindersNow, sendTestEmail, type EmailActionResult } from "@/app/admin/events/[id]/reminders/actions";
import type { EmailKind, EmailStatus } from "@/lib/types/database";

export type EmailLogItem = {
  id: string;
  kind: EmailKind;
  to_email: string;
  status: EmailStatus;
  error: string | null;
  createdAtDisplay: string;
  recipientName: string | null;
};

export function RemindersPanel({
  eventId,
  offsetHours,
  dueAtDisplay,
  sentAtDisplay,
  recipientsWithEmail,
  log,
}: {
  eventId: string;
  offsetHours: number;
  dueAtDisplay: string | null;
  sentAtDisplay: string | null;
  recipientsWithEmail: number;
  log: EmailLogItem[];
}) {
  const t = useTranslations("reminders");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const report = (r: EmailActionResult, kind: "all" | "test") => {
    if (r.ok) {
      setMessage({
        ok: true,
        text: kind === "test" ? t("testSentTo", { email: r.to ?? "" }) : t("resultSent", { sent: r.sent, failed: r.failed }),
      });
    } else {
      setMessage({ ok: false, text: t("failed", { error: r.error }) });
    }
  };

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5">
      <h2 className="font-semibold">{t("title")}</h2>

      <div className="flex flex-col gap-1 text-sm">
        {offsetHours <= 0 ? (
          <p className="text-muted">{t("off")}</p>
        ) : sentAtDisplay ? (
          <p>{t("sentAt", { date: sentAtDisplay })}</p>
        ) : (
          <>
            <p>{t("scheduledFor", { date: dueAtDisplay ?? "" })}</p>
            <p className="text-muted">{t("dailyNote")}</p>
          </>
        )}
        <p className="text-muted">{t("recipients", { count: recipientsWithEmail })}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={pending || recipientsWithEmail === 0}
          onClick={() => {
            if (!window.confirm(t("sendNowConfirm", { count: recipientsWithEmail }))) return;
            setMessage(null);
            startTransition(async () => report(await sendRemindersNow(eventId), "all"));
          }}
        >
          {pending ? t("sending") : t("sendNow")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => {
            setMessage(null);
            startTransition(async () => report(await sendTestEmail(eventId), "test"));
          }}
        >
          {t("sendTest")}
        </Button>
      </div>

      {message && (
        <p className={`rounded-lg px-3 py-2 text-sm ${message.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`} role="status">
          {message.text}
        </p>
      )}

      <details className="text-sm">
        <summary className="cursor-pointer text-muted">{t("log")} ({log.length})</summary>
        {log.length === 0 ? (
          <p className="pt-2 text-muted">{t("logEmpty")}</p>
        ) : (
          <ul className="mt-2 flex flex-col divide-y divide-border/60">
            {log.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                <span className="text-muted">{l.createdAtDisplay}</span>
                <span>{l.recipientName ?? ""}</span>
                <span dir="ltr">{l.to_email}</span>
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs">{t(`logKinds.${l.kind}`)}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${l.status === "sent" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                  {t(`logStatus.${l.status}`)}
                </span>
                {l.error && <span className="text-xs text-red-700" dir="ltr">{l.error}</span>}
              </li>
            ))}
          </ul>
        )}
      </details>
    </section>
  );
}
