// Normalises a phone number to E.164. Israeli numbers get +972; anything that
// already starts with + or 00 is treated as international.
export function normalizePhone(input: string): string | null {
  let s = input.trim().replace(/[\s().-]/g, "");
  if (s.startsWith("00")) s = "+" + s.slice(2);
  if (s.startsWith("+")) {
    const digits = s.slice(1);
    if (!/^[1-9][0-9]{6,14}$/.test(digits)) return null;
    return "+" + digits;
  }
  if (!/^[0-9]+$/.test(s)) return null;
  // Israeli local format: 0 + 8 or 9 digits (05x mobile, 0x landline, 07x)
  if (/^0[2-9][0-9]{7,8}$/.test(s)) return "+972" + s.slice(1);
  // Israeli number without the leading 0
  if (/^[5][0-9]{8}$/.test(s)) return "+972" + s;
  return null;
}

// For display and wa.me links.
export function phoneDigits(e164: string): string {
  return e164.replace(/^\+/, "");
}

export function formatPhoneForDisplay(e164: string): string {
  if (e164.startsWith("+972")) {
    const local = "0" + e164.slice(4);
    if (local.length === 10) return `${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`;
    if (local.length === 9) return `${local.slice(0, 2)}-${local.slice(2, 5)}-${local.slice(5)}`;
    return local;
  }
  return e164;
}
