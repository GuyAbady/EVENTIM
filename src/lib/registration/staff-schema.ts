import { z } from "zod";
import { normalizePhone } from "@/lib/phone";

// Staff entries are looser than public ones: guest names are optional.
export const staffRegistrationSchema = z.object({
  full_name: z.string().trim().min(1, "nameRequired").max(120, "tooLong"),
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
  guest_count: z.coerce.number().int().min(1, "guestCountInvalid").max(50, "guestCountInvalid"),
  guest_names: z.array(z.string().trim().max(120, "tooLong")),
  notes: z
    .string()
    .trim()
    .max(1000, "tooLong")
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  status: z.enum(["confirmed", "cancelled"]),
});

export type StaffRegistrationValues = z.output<typeof staffRegistrationSchema>;
export type StaffRegistrationErrors = Partial<Record<keyof StaffRegistrationValues | "form", string>>;

export function parseStaffRegistration(formData: FormData) {
  const guestCount = Number(formData.get("guest_count") ?? 1);
  const extra: string[] = [];
  for (let i = 1; i < Math.min(Math.max(guestCount, 1), 50); i++) {
    extra.push(String(formData.get(`guest_name_${i}`) ?? ""));
  }
  const raw = {
    full_name: formData.get("full_name") ?? "",
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
    guest_count: formData.get("guest_count") ?? "1",
    guest_names: extra,
    notes: formData.get("notes") ?? "",
    status: formData.get("status") ?? "confirmed",
  };
  const result = staffRegistrationSchema.safeParse(raw);
  if (!result.success) {
    const errors: StaffRegistrationErrors = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof StaffRegistrationValues;
      if (key && !errors[key]) errors[key] = issue.message;
    }
    return { values: null, errors };
  }
  const v = result.data;
  // Store the registrant first, then any named extra guests.
  const names = [v.full_name, ...v.guest_names.filter((n) => n.length > 0)];
  return { values: { ...v, guest_names: names }, errors: null };
}
