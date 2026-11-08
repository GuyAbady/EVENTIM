"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button, buttonLinkClass } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import type { RegistrationRow } from "@/lib/types/database";
import {
  createRegistration,
  deleteRegistration,
  setRegistrationStatus,
  updateRegistration,
  type RegistrationFormState,
} from "@/app/admin/events/[id]/registrations/actions";
import { sendRegistrationEmail } from "@/app/admin/events/[id]/reminders/actions";

export type RegistrationItem = RegistrationRow & {
  phoneDisplay: string;
  createdAtDisplay: string;
  whatsappUrl: string;
  /** when the last email to this registrant was sent, for display */
  lastEmailAtDisplay: string | null;
};

type Filter = "all" | "confirmed" | "cancelled";

export function RegistrationsPanel({ eventId, rows }: { eventId: string; rows: RegistrationItem[] }) {
  const t = useTranslations("registrations");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<RegistrationItem | "new" | null>(null);
  const [pending, startTransition] = useTransition();
  const [emailState, setEmailState] = useState<Record<string, "sending" | "sent" | "failed">>({});
  const tRem = useTranslations("reminders");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/[\s-]/g, "");
    return rows.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!q) return true;
      const hay = `${r.full_name} ${r.phone} ${r.phoneDisplay} ${r.email ?? ""} ${(r.guest_names ?? []).join(" ")}`
        .toLowerCase()
        .replace(/[\s-]/g, "");
      return hay.includes(q);
    });
  }, [rows, query, filter]);

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-semibold">{t("title")}</h2>
        <div className="flex flex-wrap gap-2">
          <a href={`/admin/events/${eventId}/export`} className={buttonLinkClass("secondary")}>
            {t("export")}
          </a>
          <Button type="button" onClick={() => setEditing("new")}>
            {t("add")}
          </Button>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="search"
            placeholder={t("search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={t("search")}
            className="sm:max-w-xs"
          />
          <Select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} className="sm:max-w-44" aria-label={t("columns.status")}>
            <option value="all">{t("filterAll")}</option>
            <option value="confirmed">{t("filterConfirmed")}</option>
            <option value="cancelled">{t("filterCancelled")}</option>
          </Select>
        </div>
      )}

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-muted">{t("empty")}</p>
      ) : visible.length === 0 ? (
        <p className="p-4 text-center text-muted">{t("noResults")}</p>
      ) : (
        <div className="-mx-5 overflow-x-auto px-5">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-start text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pe-3 text-start font-medium">{t("columns.name")}</th>
                <th className="py-2 pe-3 text-start font-medium">{t("columns.phone")}</th>
                <th className="py-2 pe-3 text-start font-medium">{t("columns.email")}</th>
                <th className="py-2 pe-3 text-center font-medium">{t("columns.guests")}</th>
                <th className="py-2 pe-3 text-start font-medium">{t("columns.notes")}</th>
                <th className="py-2 pe-3 text-start font-medium">{t("columns.status")}</th>
                <th className="py-2 text-end font-medium">{t("columns.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id} className={`border-b border-border/60 align-top ${r.status === "cancelled" ? "opacity-60" : ""}`}>
                  <td className="py-3 pe-3">
                    <div className="font-medium">{r.full_name}</div>
                    {r.guest_names.length > 1 && (
                      <div className="text-xs text-muted">{r.guest_names.slice(1).join(", ")}</div>
                    )}
                    <div className="text-xs text-muted">{r.createdAtDisplay} · {t(`source.${r.source}`)}</div>
                  </td>
                  <td className="py-3 pe-3 whitespace-nowrap" dir="ltr">{r.phoneDisplay}</td>
                  <td className="py-3 pe-3 break-all" dir="ltr">{r.email ?? <span className="text-muted">—</span>}</td>
                  <td className="py-3 pe-3 text-center tabular-nums">{r.guest_count}</td>
                  <td className="py-3 pe-3 max-w-56 whitespace-pre-line text-muted">{r.notes ?? ""}</td>
                  <td className="py-3 pe-3 whitespace-nowrap">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${r.status === "confirmed" ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-muted"}`}>
                      {t(`status.${r.status}`)}
                    </span>
                  </td>
                  <td className="py-2 text-end">
                    <div className="flex flex-wrap justify-end gap-1">
                      <a href={r.whatsappUrl} target="_blank" rel="noreferrer" className={buttonLinkClass("ghost") + " min-h-9 px-2 text-emerald-700"} title={t("actions.whatsapp")}>
                        <WhatsAppIcon /> <span className="sr-only sm:not-sr-only">{t("actions.whatsapp")}</span>
                      </a>
                      {r.email && (
                        <Button
                          type="button"
                          variant="ghost"
                          className={`min-h-9 px-2 ${emailState[r.id] === "failed" ? "text-red-700" : ""}`}
                          disabled={emailState[r.id] === "sending"}
                          title={r.lastEmailAtDisplay ? `${tRem("rowSent")}: ${r.lastEmailAtDisplay}` : t("actions.email")}
                          onClick={() => {
                            setEmailState((s) => ({ ...s, [r.id]: "sending" }));
                            startTransition(async () => {
                              const res = await sendRegistrationEmail(eventId, r.id);
                              setEmailState((s) => ({ ...s, [r.id]: res.ok ? "sent" : "failed" }));
                            });
                          }}
                        >
                          <MailIcon />{" "}
                          <span className="sr-only sm:not-sr-only">
                            {emailState[r.id] === "sending" ? tRem("sending") : emailState[r.id] === "sent" ? tRem("rowSent") : t("actions.email")}
                          </span>
                        </Button>
                      )}
                      <Button type="button" variant="ghost" className="min-h-9 px-2" onClick={() => setEditing(r)}>
                        {t("actions.edit")}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="min-h-9 px-2"
                        disabled={pending}
                        onClick={() =>
                          startTransition(() => setRegistrationStatus(eventId, r.id, r.status === "confirmed" ? "cancelled" : "confirmed"))
                        }
                      >
                        {r.status === "confirmed" ? t("actions.cancel") : t("actions.restore")}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="min-h-9 px-2 text-red-700"
                        disabled={pending}
                        onClick={() => {
                          if (window.confirm(t("actions.deleteConfirm", { name: r.full_name }))) {
                            startTransition(() => deleteRegistration(eventId, r.id));
                          }
                        }}
                      >
                        {t("actions.delete")}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <RegistrationDialog
          eventId={eventId}
          registration={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}

function RegistrationDialog({ eventId, registration, onClose }: { eventId: string; registration: RegistrationItem | null; onClose: () => void }) {
  const t = useTranslations("registrations.form");
  const tr = useTranslations("registrations");
  const ref = useRef<HTMLDialogElement>(null);
  const action = registration ? updateRegistration.bind(null, eventId, registration.id) : createRegistration.bind(null, eventId);
  const [state, formAction, pending] = useActionState<RegistrationFormState, FormData>(action, {});
  const raw = state.raw;
  const errors = state.errors ?? {};
  const err = (k: keyof typeof errors) => (errors[k] ? t(`errors.${errors[k]}` as never) : undefined);

  const extraNames = registration?.guest_names.slice(1) ?? [];
  const d = {
    full_name: raw?.full_name ?? registration?.full_name ?? "",
    phone: raw?.phone ?? registration?.phoneDisplay ?? "",
    email: raw?.email ?? registration?.email ?? "",
    guest_count: Number(raw?.guest_count ?? registration?.guest_count ?? 1),
    notes: raw?.notes ?? registration?.notes ?? "",
    status: raw?.status ?? registration?.status ?? "confirmed",
  };
  const [guestCount, setGuestCount] = useState(d.guest_count);

  useEffect(() => {
    const el = ref.current;
    if (el && !el.open) el.showModal();
  }, []);

  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="m-auto w-[min(100%-2rem,32rem)] rounded-2xl border border-border bg-white p-0 shadow-xl backdrop:bg-black/40"
    >
      <form action={formAction} className="flex flex-col gap-4 p-6">
        <h3 className="text-lg font-semibold">{registration ? t("editTitle") : t("addTitle")}</h3>
        {errors.form && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{t(`errors.${errors.form}` as never)}</p>
        )}
        <Field label={t("fullName")} htmlFor="r_full_name" required error={err("full_name")}>
          <Input id="r_full_name" name="full_name" required maxLength={120} defaultValue={d.full_name} aria-invalid={Boolean(errors.full_name)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("phone")} htmlFor="r_phone" required error={err("phone")}>
            <Input id="r_phone" name="phone" type="tel" dir="ltr" className="text-start" required defaultValue={d.phone} aria-invalid={Boolean(errors.phone)} />
          </Field>
          <Field label={t("email")} htmlFor="r_email" error={err("email")}>
            <Input id="r_email" name="email" type="email" dir="ltr" className="text-start" defaultValue={d.email} aria-invalid={Boolean(errors.email)} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("guestCount")} htmlFor="r_guest_count" error={err("guest_count")}>
            <Input id="r_guest_count" name="guest_count" type="number" min={1} max={50} dir="ltr" className="text-start" value={guestCount} onChange={(e) => setGuestCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))} />
          </Field>
          <Field label={t("status")} htmlFor="r_status">
            <Select id="r_status" name="status" defaultValue={d.status}>
              <option value="confirmed">{tr("status.confirmed")}</option>
              <option value="cancelled">{tr("status.cancelled")}</option>
            </Select>
          </Field>
        </div>
        {guestCount > 1 && (
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm text-muted">{t("guestNamesHelp")}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {Array.from({ length: guestCount - 1 }, (_, i) => i + 1).map((i) => (
                <Input key={i} name={`guest_name_${i}`} aria-label={t("guestName", { n: i + 1 })} placeholder={t("guestName", { n: i + 1 })} maxLength={120} defaultValue={raw?.[`guest_name_${i}`] ?? extraNames[i - 1] ?? ""} />
              ))}
            </div>
          </fieldset>
        )}
        <Field label={t("notes")} htmlFor="r_notes" error={err("notes")}>
          <Textarea id="r_notes" name="notes" maxLength={1000} defaultValue={d.notes} className="min-h-20" />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>{t("cancel")}</Button>
          <Button type="submit" disabled={pending}>{pending ? t("saving") : t("save")}</Button>
        </div>
      </form>
    </dialog>
  );
}

function WhatsAppIcon() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 1.8a8.2 8.2 0 1 1-4.2 15.3l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 0 1 12 3.8Zm-3 4.4c-.2 0-.5 0-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.2 5 4.4 2.5 1 3 .8 3.5.7.5 0 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4l-.5-.3-1.9-.9c-.3-.1-.4-.1-.6.1l-.9 1.1c-.2.2-.3.2-.6.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.3-.4.8-1.4.1-.2 0-.4 0-.5L10 8.8c-.2-.4-.4-.4-.6-.4H9Z" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}
