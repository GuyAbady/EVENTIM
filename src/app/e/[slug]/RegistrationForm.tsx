"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { registerGuest, type RegisterState } from "./actions";
import { MAX_GUESTS_PER_REGISTRATION } from "@/lib/registration/schema";

const control =
  "w-full rounded-lg border border-current/20 bg-white/90 px-3 py-3 text-base text-[#1c1917] placeholder:text-[#1c1917]/40 focus:outline-none focus:ring-2 focus:ring-[var(--tpl-accent,#0f766e)]/40 aria-[invalid=true]:border-red-500";

export function RegistrationForm({ slug, accent }: { slug: string; accent: string }) {
  const t = useTranslations("invite.rsvp");
  const action = registerGuest.bind(null, slug);
  const [state, formAction, pending] = useActionState<RegisterState, FormData>(action, { status: "idle" });
  const raw = state.raw ?? {};
  const [guestCount, setGuestCount] = useState(Number(raw.guest_count ?? 1));
  const errors = state.errors ?? {};
  const err = (k: keyof typeof errors) => (errors[k] ? t(`errors.${errors[k]}` as never) : undefined);

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 text-center" role="status">
        <CheckIcon color={accent} />
        <h2 className="text-2xl font-semibold">{state.created ? t("thanksTitle") : t("updatedTitle")}</h2>
        <p className="opacity-80">
          {t(state.created ? "thanksBody" : "updatedBody", { name: state.name ?? "", count: state.guestCount ?? 1 })}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5" style={{ ["--tpl-accent" as string]: accent }}>
      <div className="text-center">
        <h2 className="text-2xl font-semibold">{t("title")}</h2>
        <p className="opacity-75">{t("subtitle")}</p>
      </div>

      {errors.form && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {t(`errors.${errors.form}` as never)}
        </p>
      )}

      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <Field label={t("fullName")} htmlFor="full_name" required error={err("full_name")}>
        <input id="full_name" name="full_name" className={control} required maxLength={120} autoComplete="name" defaultValue={raw.full_name ?? ""} aria-invalid={Boolean(errors.full_name)} />
      </Field>

      <Field label={t("phone")} htmlFor="phone" required error={err("phone")}>
        <input id="phone" name="phone" type="tel" inputMode="tel" dir="ltr" className={`${control} text-start`} required autoComplete="tel" placeholder={t("phonePlaceholder")} defaultValue={raw.phone ?? ""} aria-invalid={Boolean(errors.phone)} />
      </Field>

      <Field label={t("email")} htmlFor="email" help={t("emailHelp")} error={err("email")}>
        <input id="email" name="email" type="email" inputMode="email" dir="ltr" className={`${control} text-start`} autoComplete="email" defaultValue={raw.email ?? ""} aria-invalid={Boolean(errors.email)} />
      </Field>

      <Field label={t("guestCount")} htmlFor="guest_count" required error={err("guest_count")}>
        <select
          id="guest_count"
          name="guest_count"
          className={control}
          value={guestCount}
          onChange={(e) => setGuestCount(Number(e.target.value))}
        >
          {Array.from({ length: MAX_GUESTS_PER_REGISTRATION }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </Field>

      {guestCount > 1 && (
        <fieldset className="flex flex-col gap-3">
          {Array.from({ length: guestCount - 1 }, (_, i) => i + 1).map((i) => (
            <Field key={i} label={t("guestName", { n: i + 1 })} htmlFor={`guest_name_${i}`} required>
              <input id={`guest_name_${i}`} name={`guest_name_${i}`} className={control} required maxLength={120} defaultValue={raw[`guest_name_${i}`] ?? ""} />
            </Field>
          ))}
          {errors.guest_names && <p className="text-sm text-red-600" role="alert">{err("guest_names")}</p>}
        </fieldset>
      )}

      <Field label={t("notes")} htmlFor="notes" error={err("notes")}>
        <textarea id="notes" name="notes" className={`${control} min-h-20`} maxLength={1000} placeholder={t("notesPlaceholder")} defaultValue={raw.notes ?? ""} />
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 min-h-12 rounded-full px-6 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ background: accent }}
      >
        {pending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}

function Field({ label, htmlFor, help, error, required, children }: { label: string; htmlFor: string; help?: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
        {required && <span className="ms-1 text-red-500" aria-hidden>*</span>}
      </label>
      {children}
      {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : help ? <p className="text-sm opacity-60">{help}</p> : null}
    </div>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <svg aria-hidden width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m8 12 3 3 5-6" />
    </svg>
  );
}
