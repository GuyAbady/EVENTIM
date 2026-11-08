import { z } from "zod";
import { templateIds } from "@/templates/registry";
import { SLUG_PATTERN } from "./slug";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

const optionalUrl = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional()
  .refine((v) => v == null || /^https?:\/\/\S+$/i.test(v), { message: "invalidUrl" });

const optionalNumber = (min: number, max: number) =>
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .nullable()
    .optional()
    .refine((v) => v == null || (Number.isFinite(v) && v >= min && v <= max), { message: "invalidNumber" });

export const eventFormSchema = z.object({
  title: z.string().trim().min(1, "required").max(120, "tooLong"),
  slug: z.string().trim().toLowerCase().regex(SLUG_PATTERN, "invalidSlug"),
  event_type: z.enum(["private", "business"]),
  description: optionalText(2000),
  // datetime-local value, converted to ISO by the action
  date_time_local: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "required"),
  venue_name: optionalText(120),
  address: optionalText(300),
  lat: optionalNumber(-90, 90),
  lng: optionalNumber(-180, 180),
  template_id: z.enum(templateIds),
  media_url: optionalUrl,
  primary_color: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .refine((v) => v == null || /^#[0-9a-f]{6}$/i.test(v), { message: "invalidColor" }),
  gift_link_url: optionalUrl,
  reminder_offset_hours: z.coerce.number().int().min(0).max(24 * 30),
  rsvp_deadline_local: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  max_guests: optionalNumber(1, 100000),
  is_active: z.boolean(),
});

export type EventFormInput = z.input<typeof eventFormSchema>;
export type EventFormValues = z.output<typeof eventFormSchema>;
export type EventFormErrors = Partial<Record<keyof EventFormValues | "form", string>>;

export function parseEventForm(formData: FormData) {
  const raw = {
    title: formData.get("title") ?? "",
    slug: formData.get("slug") ?? "",
    event_type: formData.get("event_type") ?? "private",
    description: formData.get("description") ?? "",
    date_time_local: formData.get("date_time_local") ?? "",
    venue_name: formData.get("venue_name") ?? "",
    address: formData.get("address") ?? "",
    lat: formData.get("lat") ?? "",
    lng: formData.get("lng") ?? "",
    template_id: formData.get("template_id") ?? "classic",
    media_url: formData.get("media_url") ?? "",
    primary_color: formData.get("primary_color") ?? "",
    gift_link_url: formData.get("gift_link_url") ?? "",
    reminder_offset_hours: formData.get("reminder_offset_hours") ?? "24",
    rsvp_deadline_local: formData.get("rsvp_deadline_local") ?? "",
    max_guests: formData.get("max_guests") ?? "",
    is_active: formData.get("is_active") === "on",
  };
  const result = eventFormSchema.safeParse(raw);
  if (result.success) return { values: result.data, errors: null };

  const errors: EventFormErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof EventFormValues;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return { values: null, errors };
}
