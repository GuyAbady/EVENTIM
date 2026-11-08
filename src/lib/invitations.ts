import { normalizePhone } from "@/lib/phone";

// Placeholders the business can use in its invitation text.
export const MESSAGE_PLACEHOLDERS = ["{name}", "{event}", "{date}", "{time}", "{venue}", "{link}"] as const;

export type MessageVars = { name: string; event: string; date: string; time: string; venue: string; link: string };

export function fillMessage(template: string, vars: MessageVars): string {
  return template.replace(/\{(name|event|date|time|venue|link)\}/g, (_, k: keyof MessageVars) => vars[k]);
}

export type ParsedInvitee = { full_name: string; phone: string | null; email: string | null };
export type ParseResult = { rows: ParsedInvitee[]; invalid: string[] };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Parses a pasted guest list: one guest per line, fields separated by comma,
// tab (pasted from Excel / Google Sheets) or semicolon, in any order.
// A field with @ is the email, a field that normalises to a phone is the
// phone, the rest is the name. Lines without name, or with neither phone nor
// email, are returned as invalid. A header line ("שם, טלפון, אימייל") is skipped.
export function parseInviteeList(raw: string): ParseResult {
  const rows: ParsedInvitee[] = [];
  const invalid: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const fields = trimmed.split(/[,\t;]/).map((f) => f.trim()).filter(Boolean);
    let email: string | null = null;
    let phone: string | null = null;
    const nameParts: string[] = [];
    for (const f of fields) {
      if (!email && EMAIL_RE.test(f)) {
        email = f.toLowerCase();
        continue;
      }
      const p: string | null = !phone && /\d{6,}/.test(f.replace(/\D/g, "")) ? normalizePhone(f) : null;
      if (p) {
        phone = p;
        continue;
      }
      nameParts.push(f);
    }
    const full_name = nameParts.join(" ").slice(0, 120);
    if (!full_name || (!phone && !email)) {
      if (!/^(שם|name)([\s,;]|$)/i.test(trimmed)) invalid.push(trimmed);
      continue;
    }
    rows.push({ full_name, phone, email });
  }
  return { rows, invalid };
}
