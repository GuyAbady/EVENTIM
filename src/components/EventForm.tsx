"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button, buttonLinkClass } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { TemplatePicker } from "@/components/TemplatePicker";
import { MediaUpload } from "@/components/MediaUpload";
import type { EventFormState } from "@/app/admin/events/actions";
import type { EventRow } from "@/lib/types/database";
import { isoToLocalInput } from "@/lib/dates";

const REMINDER_OPTIONS = [0, 24, 48, 72, 168];

export type EventFormInitial = Partial<EventRow> & { slug: string };

export function EventForm({
  initial,
  action,
  mode,
  cancelHref,
}: {
  initial: EventFormInitial;
  action: (prev: EventFormState, formData: FormData) => Promise<EventFormState>;
  mode: "create" | "edit";
  cancelHref: string;
}) {
  const t = useTranslations("eventForm");
  const [state, formAction, pending] = useActionState<EventFormState, FormData>(action, { errors: null });
  const errors = state.errors ?? {};
  // After a failed submit the form resets, so prefer the values that were just sent.
  const raw = state.raw;
  const d = {
    title: raw?.title ?? initial.title ?? "",
    slug: raw?.slug ?? initial.slug,
    event_type: raw?.event_type ?? initial.event_type ?? "private",
    description: raw?.description ?? initial.description ?? "",
    date_time_local: raw?.date_time_local ?? isoToLocalInput(initial.date_time ?? null),
    venue_name: raw?.venue_name ?? initial.venue_name ?? "",
    address: raw?.address ?? initial.address ?? "",
    lat: raw?.lat ?? (initial.lat == null ? "" : String(initial.lat)),
    lng: raw?.lng ?? (initial.lng == null ? "" : String(initial.lng)),
    template_id: raw?.template_id ?? initial.template_id ?? "classic",
    media_url: raw?.media_url ?? initial.media_url ?? "",
    primary_color: raw?.primary_color ?? initial.primary_color ?? "",
    gift_link_url: raw?.gift_link_url ?? initial.gift_link_url ?? "",
    reminder_offset_hours: raw?.reminder_offset_hours ?? String(initial.reminder_offset_hours ?? 24),
    rsvp_deadline_local: raw?.rsvp_deadline_local ?? isoToLocalInput(initial.rsvp_deadline ?? null),
    max_guests: raw?.max_guests ?? (initial.max_guests == null ? "" : String(initial.max_guests)),
    is_active: raw ? raw.is_active === "on" : (initial.is_active ?? true),
  };
  const [title, setTitle] = useState(d.title);
  const err = (key: keyof typeof errors) => (errors[key] ? t(`errors.${errors[key]}` as never) : undefined);

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {errors.form && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {t(`errors.${errors.form}` as never)}
        </p>
      )}

      <Section title={t("sectionBasics")}>
        <Field label={t("title")} htmlFor="title" required error={err("title")}>
          <Input
            id="title"
            name="title"
            required
            maxLength={120}
            placeholder={t("titlePlaceholder")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={Boolean(errors.title)}
          />
        </Field>
        <Field label={t("eventType")} htmlFor="event_type" error={err("event_type")}>
          <Select id="event_type" name="event_type" defaultValue={d.event_type}>
            <option value="private">{t("typePrivate")}</option>
            <option value="business">{t("typeBusiness")}</option>
          </Select>
        </Field>
        <Field label={t("description")} htmlFor="description" error={err("description")}>
          <Textarea
            id="description"
            name="description"
            maxLength={2000}
            placeholder={t("descriptionPlaceholder")}
            defaultValue={d.description}
          />
        </Field>
      </Section>

      <Section title={t("sectionWhen")}>
        <Field label={t("dateTime")} htmlFor="date_time_local" required error={err("date_time_local")}>
          <Input
            id="date_time_local"
            name="date_time_local"
            type="datetime-local"
            dir="ltr"
            className="text-start"
            required
            defaultValue={d.date_time_local}
            aria-invalid={Boolean(errors.date_time_local)}
          />
        </Field>
        <Field label={t("venueName")} htmlFor="venue_name" error={err("venue_name")}>
          <Input id="venue_name" name="venue_name" maxLength={120} placeholder={t("venuePlaceholder")} defaultValue={d.venue_name} />
        </Field>
        <Field label={t("address")} htmlFor="address" error={err("address")}>
          <Input id="address" name="address" maxLength={300} placeholder={t("addressPlaceholder")} defaultValue={d.address} />
        </Field>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">{t("coordinates")}</legend>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("lat")} htmlFor="lat" error={err("lat")}>
              <Input id="lat" name="lat" inputMode="decimal" dir="ltr" className="text-start" placeholder="32.0853" defaultValue={d.lat} />
            </Field>
            <Field label={t("lng")} htmlFor="lng" error={err("lng")}>
              <Input id="lng" name="lng" inputMode="decimal" dir="ltr" className="text-start" placeholder="34.7818" defaultValue={d.lng} />
            </Field>
          </div>
          <p className="text-sm text-muted">{t("coordinatesHelp")}</p>
        </fieldset>
      </Section>

      <Section title={t("sectionDesign")}>
        <Field label={t("template")} error={err("template_id")}>
          <TemplatePicker name="template_id" defaultValue={d.template_id} sampleTitle={title} />
        </Field>
        <Field label={t("media")} error={err("media_url")}>
          <MediaUpload name="media_url" defaultValue={d.media_url || null} />
        </Field>
        <Field label={t("primaryColor")} htmlFor="primary_color" help={t("primaryColorHelp")} error={err("primary_color")}>
          <ColorInput name="primary_color" defaultValue={d.primary_color || null} />
        </Field>
      </Section>

      <Section title={t("sectionExtras")}>
        <Field label={t("giftLink")} htmlFor="gift_link_url" error={err("gift_link_url")}>
          <Input id="gift_link_url" name="gift_link_url" type="url" dir="ltr" className="text-start" placeholder={t("giftLinkPlaceholder")} defaultValue={d.gift_link_url} />
        </Field>
        <Field label={t("reminderOffset")} htmlFor="reminder_offset_hours" error={err("reminder_offset_hours")}>
          <Select id="reminder_offset_hours" name="reminder_offset_hours" defaultValue={d.reminder_offset_hours}>
            {REMINDER_OPTIONS.map((h) => (
              <option key={h} value={h}>
                {t("reminderHours", { count: h })}
              </option>
            ))}
          </Select>
        </Field>
      </Section>

      <Section title={t("sectionSettings")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("rsvpDeadline")} htmlFor="rsvp_deadline_local" help={t("rsvpDeadlineHelp")} error={err("rsvp_deadline_local")}>
            <Input id="rsvp_deadline_local" name="rsvp_deadline_local" type="datetime-local" dir="ltr" className="text-start" defaultValue={d.rsvp_deadline_local} />
          </Field>
          <Field label={t("maxGuests")} htmlFor="max_guests" help={t("maxGuestsHelp")} error={err("max_guests")}>
            <Input id="max_guests" name="max_guests" type="number" min={1} inputMode="numeric" dir="ltr" className="text-start" defaultValue={d.max_guests} />
          </Field>
        </div>
        <Field label={t("slug")} htmlFor="slug" required help={t("slugHelp")} error={err("slug")}>
          <div className="flex items-center gap-2" dir="ltr">
            <span className="text-sm text-muted">/e/</span>
            <Input id="slug" name="slug" required pattern="[a-z0-9][a-z0-9-]{1,38}[a-z0-9]" defaultValue={d.slug} className="text-start font-mono" aria-invalid={Boolean(errors.slug)} />
          </div>
        </Field>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name="is_active" defaultChecked={d.is_active} className="size-4 accent-accent" />
          {t("isActive")}
        </label>
      </Section>

      <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
        <Link href={cancelHref} className={buttonLinkClass("secondary")}>
          {t("cancel")}
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? t("saving") : mode === "create" ? t("create") : t("save")}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function ColorInput({ name, defaultValue }: { name: string; defaultValue: string | null }) {
  const [value, setValue] = useState(defaultValue ?? "");
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        aria-label={name}
        value={value || "#0f766e"}
        onChange={(e) => setValue(e.target.value)}
        className="h-11 w-14 cursor-pointer rounded-lg border border-border bg-white p-1"
      />
      <Input name={name} id={name} value={value} onChange={(e) => setValue(e.target.value)} placeholder="#0f766e" dir="ltr" className="max-w-36 text-start font-mono" />
      {value && (
        <Button type="button" variant="ghost" onClick={() => setValue("")}>
          ×
        </Button>
      )}
    </div>
  );
}
