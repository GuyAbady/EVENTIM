import { z } from "zod";
import { normalizePhone } from "@/lib/phone";

export const MAX_GUESTS_PER_REGISTRATION = 20;

export const registrationSchema = z.object({
  full_name: z.string().trim().min(2, "nameRequired").max(120, "tooLong"),
  phone: z
    .string()
    .trim()
    .min(1, "phoneRequired")
    .transform((v, ctx) => {
      const n = normalizePhone(v);
      if (!n) {
        ctx.addIssue({ code: "custom", message: "phoneInvalid" });
        return z.NEVER;
      }
      return n;
    }),
  email: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v.toLowerCase()))
    .nullable()
    .refine((v) => v == null || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), { message: "emailInvalid" }),
  guest_count: z.coerce.number().int().min(1, "guestCountInvalid").max(MAX_GUESTS_PER_REGISTRATION, "guestCountInvalid"),
  guest_names: z.array(z.string().trim().max(120, "tooLong")),
  notes: z
    .string()
    .trim()
    .max(1000, "tooLong")
    .transform((v) => (v === "" ? null : v))
    .nullable(),
});

export type RegistrationValues = z.output<typeof registrationSchema>;
export type RegistrationErrors = Partial<Record<keyof RegistrationValues | "form", string>>;

export function parseRegistration(formData: FormData) {
  const guestCount = Number(formData.get("guest_count") ?? 1);
  const extra: string[] = [];
  for (let i = 1; i < Math.min(Math.max(guestCount, 1), MAX_GUESTS_PER_REGISTRATION); i++) {
    extra.push(String(formData.get(`guest_name_${i}`) ?? ""));
  }
  const raw = {
    full_name: formData.get("full_name") ?? "",
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
    guest_count: formData.get("guest_count") ?? "1",
    guest_names: extra,
    notes: formData.get("notes") ?? "",
  };
  const result = registrationSchema.safeParse(raw);
  const errors: RegistrationErrors = {};
  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof RegistrationValues;
      if (key && !errors[key]) errors[key] = issue.message;
    }
    return { values: null, errors };
  }
  const values = result.data;
  // Every additional guest needs a name.
  if (values.guest_names.some((n) => n.length === 0)) {
    return { values: null, errors: { guest_names: "guestNamesRequired" } };
  }
  return { values: { ...values, guest_names: [values.full_name, ...values.guest_names] }, errors: null };
}
