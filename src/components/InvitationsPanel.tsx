"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button, buttonLinkClass } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import {
  addInvitees,
  deleteInvitee,
  logWhatsappOpened,
  saveInvitationMessage,
  sendInvitation,
  sendInvitationsBulk,
  type InviteActionResult,
} from "@/app/admin/events/[id]/invitations/actions";
import { smsSegments } from "@/lib/sms/segments";
import { MESSAGE_PLACEHOLDERS } from "@/lib/invitations";
import type { Channel } from "@/lib/types/database";

export type InviteeItem = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  phoneDisplay: string | null;
  registered: boolean;
  whatsappUrl: string | null;
  last: Partial<Record<Channel, { at: string; ok: boolean; error: string | null }>>;
};

type Notice = { ok: boolean; text: string } | null;

export function InvitationsPanel({
  eventId,
  invitees,
  message,
  defaultMessage,
  preview,
  emailConfigured,
  smsConfigured,
}: {
  eventId: string;
  invitees: InviteeItem[];
  message: string;
  defaultMessage: string;
  preview: string;
  emailConfigured: boolean;
  smsConfigured: boolean;
}) {
  const t = useTranslations("invitations");
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState(message || defaultMessage);
  const [list, setList] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [busyRow, setBusyRow] = useState<string | null>(null);

  const seg = smsSegments(preview);
  const total = invitees.length;
  const registered = invitees.filter((i) => i.registered).length;
  const withEmail = invitees.filter((i) => i.email).length;
  const withPhone = invitees.filter((i) => i.phone).length;
  const pendingEmail = invitees.filter((i) => i.email && !i.registered && !i.last.email?.ok).length;
  const pendingSms = invitees.filter((i) => i.phone && !i.registered && !i.last.sms?.ok).length;

  const reportSend = (r: InviteActionResult) => {
    if (!r.ok) return setNotice({ ok: false, text: t("failed", { error: r.error }) });
    setNotice({
      ok: r.failed === 0,
      text:
        t("bulkResult", { sent: r.sent, failed: r.failed, remaining: r.remaining }) +
        (r.lastError ? ` (${r.lastError})` : ""),
    });
  };

  const bulk = (channel: "email" | "sms", count: number) => {
    if (!window.confirm(t(channel === "email" ? "bulkEmailConfirm" : "bulkSmsConfirm", { count: Math.min(count, 40) }))) return;
    setNotice(null);
    startTransition(async () => reportSend(await sendInvitationsBulk(eventId, channel)));
  };

  const single = (inviteeId: string, channel: "email" | "sms") => {
    setBusyRow(inviteeId + channel);
    setNotice(null);
    startTransition(async () => {
      const r = await sendInvitation(eventId, inviteeId, channel);
      setBusyRow(null);
      if (!r.ok) setNotice({ ok: false, text: t("failed", { error: r.error }) });
    });
  };

  return (
    <>
      {(!emailConfigured || !smsConfigured) && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {!emailConfigured && t("emailNotConfigured")} {!smsConfigured && t("smsNotConfigured")}
        </p>
      )}

      {/* 1. Message */}
      <section className="flex flex-col gap-3 rounded-xl border border-border bg-white p-5">
        <h2 className="font-semibold">{t("messageTitle")}</h2>
        <p className="text-sm text-muted">
          {t("messageHelp")} <span dir="ltr">{MESSAGE_PLACEHOLDERS.join(" ")}</span>
        </p>
        <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={1000} rows={4} aria-label={t("messageTitle")} />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const r = await saveInvitationMessage(eventId, draft === defaultMessage ? "" : draft);
                setNotice(r.ok ? { ok: true, text: t("messageSaved") } : { ok: false, text: t("failed", { error: r.error }) });
              })
            }
          >
            {t("saveMessage")}
          </Button>
          <Button type="button" variant="ghost" disabled={pending} onClick={() => setDraft(defaultMessage)}>
            {t("resetMessage")}
          </Button>
        </div>
        <div className="rounded-lg bg-stone-50 p-3 text-sm">
          <div className="mb-1 text-xs text-muted">{t("preview")}</div>
          <p className="whitespace-pre-line">{preview}</p>
          <p className="mt-2 text-xs text-muted">
            {t("smsCounter", { chars: seg.chars, segments: seg.segments })}
            {seg.unicode ? ` · ${t("smsUnicode")}` : ""}
          </p>
        </div>
      </section>

      {/* 2. Guest list */}
      <section className="flex flex-col gap-3 rounded-xl border border-border bg-white p-5">
        <h2 className="font-semibold">{t("addTitle")}</h2>
        <p className="text-sm text-muted">{t("addHelp")}</p>
        <Textarea
          value={list}
          onChange={(e) => setList(e.target.value)}
          rows={5}
          dir="auto"
          placeholder={t("addPlaceholder")}
          aria-label={t("addTitle")}
        />
        <div>
          <Button
            type="button"
            disabled={pending || !list.trim()}
            onClick={() =>
              startTransition(async () => {
                const r = await addInvitees(eventId, list);
                if (!r.ok) return setNotice({ ok: false, text: t("failed", { error: r.error }) });
                setNotice({
                  ok: r.invalid.length === 0,
                  text:
                    t("addResult", { added: r.added, duplicates: r.duplicates, invalid: r.invalid.length }) +
                    (r.invalid.length ? `\n${r.invalid.slice(0, 10).join("\n")}` : ""),
                });
                setList(r.invalid.join("\n"));
              })
            }
          >
            {t("addButton")}
          </Button>
        </div>
      </section>

      {notice && (
        <p
          className={`whitespace-pre-line rounded-lg px-3 py-2 text-sm ${notice.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}
          role="status"
        >
          {notice.text}
        </p>
      )}

      {/* 3. Send */}
      <section className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={t("stats.total")} value={total} />
          <Stat label={t("stats.registered")} value={registered} />
          <Stat label={t("stats.withEmail")} value={withEmail} />
          <Stat label={t("stats.withPhone")} value={withPhone} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={pending || pendingEmail === 0} onClick={() => bulk("email", pendingEmail)}>
            {t("bulkEmail", { count: pendingEmail })}
          </Button>
          <Button type="button" variant="secondary" disabled={pending || pendingSms === 0} onClick={() => bulk("sms", pendingSms)}>
            {t("bulkSms", { count: pendingSms })}
          </Button>
        </div>
        <p className="text-xs text-muted">{t("bulkNote")}</p>

        {total === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-muted">{t("empty")}</p>
        ) : (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 pe-3 text-start font-medium">{t("columns.name")}</th>
                  <th className="py-2 pe-3 text-start font-medium">{t("columns.phone")}</th>
                  <th className="py-2 pe-3 text-start font-medium">{t("columns.email")}</th>
                  <th className="py-2 pe-3 text-start font-medium">{t("columns.status")}</th>
                  <th className="py-2 text-end font-medium">{t("columns.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {invitees.map((i) => (
                  <tr key={i.id} className="border-b border-border/60 align-top">
                    <td className="py-3 pe-3 font-medium">{i.full_name}</td>
                    <td className="py-3 pe-3 whitespace-nowrap" dir="ltr">{i.phoneDisplay ?? <span className="text-muted">—</span>}</td>
                    <td className="py-3 pe-3 break-all" dir="ltr">{i.email ?? <span className="text-muted">—</span>}</td>
                    <td className="py-3 pe-3">
                      <div className="flex flex-col gap-1">
                        {i.registered ? (
                          <span className="w-fit rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">{t("registered")}</span>
                        ) : (
                          <span className="w-fit rounded-full bg-stone-100 px-2 py-0.5 text-xs text-muted">{t("notRegistered")}</span>
                        )}
                        {(["email", "sms", "whatsapp"] as const).map((c) =>
                          i.last[c] ? (
                            <span key={c} className={`text-xs ${i.last[c]!.ok ? "text-muted" : "text-red-700"}`} title={i.last[c]!.error ?? undefined}>
                              {t(`channels.${c}`)}: {i.last[c]!.ok ? i.last[c]!.at : t("sendFailed")}
                            </span>
                          ) : null,
                        )}
                      </div>
                    </td>
                    <td className="py-2 text-end">
                      <div className="flex flex-wrap justify-end gap-1">
                        {i.whatsappUrl && (
                          <a
                            href={i.whatsappUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={buttonLinkClass("ghost") + " min-h-9 px-2 text-emerald-700"}
                            onClick={() => startTransition(() => logWhatsappOpened(eventId, i.id))}
                          >
                            {t("channels.whatsapp")}
                          </a>
                        )}
                        {i.email && (
                          <Button type="button" variant="ghost" className="min-h-9 px-2" disabled={pending} onClick={() => single(i.id, "email")}>
                            {busyRow === i.id + "email" ? t("sending") : t("channels.email")}
                          </Button>
                        )}
                        {i.phone && (
                          <Button type="button" variant="ghost" className="min-h-9 px-2" disabled={pending} onClick={() => single(i.id, "sms")}>
                            {busyRow === i.id + "sms" ? t("sending") : t("channels.sms")}
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          className="min-h-9 px-2 text-red-700"
                          disabled={pending}
                          onClick={() => {
                            if (!window.confirm(t("deleteConfirm", { name: i.full_name }))) return;
                            startTransition(() => deleteInvitee(eventId, i.id));
                          }}
                        >
                          {t("delete")}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-stone-50 p-3">
      <div className="text-xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
