---
name: rtl-hebrew-ui
description: Build and review bilingual Hebrew (RTL) and English (LTR) interfaces in Next.js + Tailwind. Covers dir/lang handling, logical CSS properties, Hebrew fonts, mixed-direction text (numbers, phone numbers, URLs, names), form layout, icons and chevrons that must flip, date and time formatting, and email templates. Use when writing any page, component, form, or email for this project, or when something "looks wrong in Hebrew", text is misaligned, punctuation jumps to the wrong side, or a phone number renders backwards.
---

# RTL and Hebrew UI

Hebrew is the default locale of this project. English is secondary. Every screen is built RTL first and verified in both directions.

## 1. Direction and language at the root

- Set both on `<html>`: `<html lang="he" dir="rtl">` or `<html lang="en" dir="ltr">`. Never set `dir` only on a wrapper div; scrollbars, dialogs, and portals read it from the root.
- Derive `dir` from the locale in the root layout:

```tsx
const dir = locale === "he" ? "rtl" : "ltr";
<html lang={locale} dir={dir}>
```

- Never hardcode `dir="rtl"` inside components. Components inherit direction. The only exceptions are the isolated LTR islands in section 4.

## 2. CSS: logical properties only

Physical properties (`left`, `right`, `ml-`, `pl-`, `text-left`) break in one of the two directions. Use logical ones everywhere.

| Avoid | Use |
|---|---|
| `ml-4` / `mr-4` | `ms-4` / `me-4` |
| `pl-4` / `pr-4` | `ps-4` / `pe-4` |
| `left-0` / `right-0` | `start-0` / `end-0` |
| `text-left` / `text-right` | `text-start` / `text-end` |
| `rounded-l-lg` | `rounded-s-lg` |
| `border-l` | `border-s` |
| `float-left` | `float-start` |

- Tailwind v3.3+ and v4 support all of these. Do not add the `tailwindcss-rtl` plugin; it is not needed.
- Flex and grid flip automatically with `dir`. Do not add `flex-row-reverse` to "fix" RTL. If a row looks reversed in RTL, the markup order is wrong, not the direction.
- `space-x-*` does not flip in Tailwind v3. Use `gap-*` on the flex parent instead.
- Transforms do not flip. A `translate-x-4` slide-in moves the wrong way in RTL. Use `rtl:` and `ltr:` variants: `ltr:translate-x-4 rtl:-translate-x-4`.
- Lint rule: grep the codebase for `\b(ml|mr|pl|pr|left|right|text-left|text-right|rounded-[lr]|border-[lr])-` before every PR. The only allowed hits are inside LTR islands.

## 3. Fonts

- **Project decision: Arial only, everywhere** (admin, invitation templates, emails, share images). Do not add `next/font` or other font families.
- The stack lives in `src/app/globals.css`: `Arial, "Liberation Sans", "Arial Hebrew", Helvetica, sans-serif`. `font-serif` and `font-mono` map to the same stack.
- Arial is not installed on Android or Linux; there the browser uses Liberation Sans (if present) or the system sans-serif. That is expected.
- Share images (`src/lib/og/render.tsx`) need font files, and Arial cannot be bundled under Microsoft's licence, so they use the bundled `LiberationSans-*.ttf` (OFL, metric-compatible with Arial, includes Hebrew).
- Arial has only regular (400) and bold (700). `font-light` and `font-medium` render as regular, `font-black` as bold.

- Hebrew has no italics and no uppercase. Never use `italic` or `uppercase` on Hebrew text. For emphasis use weight or color. `letter-spacing` on Hebrew should stay at 0; tracking looks broken on Hebrew letters.
- Hebrew text usually needs `line-height` 1.5 to 1.7 at body size, slightly more than Latin.
- Templates differ by color, layout and weight, not by font. Verify every template in both languages before adding it to the registry.

## 4. Mixed-direction text: the real source of bugs

Numbers, phone numbers, emails, URLs, English names and brand names inside Hebrew text are LTR runs inside an RTL paragraph. The browser's bidi algorithm gets most cases right and a few predictable ones wrong.

Known failure cases and the fix:

- **Phone numbers** like `050-123-4567` or `+972 50 123 4567`: hyphens and plus signs can jump. Wrap in an LTR island: `<span dir="ltr" className="inline-block">+972 50 123 4567</span>`. Use `unicode-bidi: isolate` (the default for elements with `dir`) so the island does not disturb surrounding text.
- **Emails and URLs**: same. Always `dir="ltr"`.
- **Standalone numbers** like `3 מגיעים`: fine without special handling.
- **Ranges and dates** like `19:00 - 23:00` or `12/05/2026`: wrap in `dir="ltr"` or the separator flips.
- **Punctuation at the end of a line** that contains an English word: e.g. `הזמנה ל-Google Maps.` If the period jumps to the start, the paragraph lost its `dir`. Fix the container, not the period.
- **Trailing parentheses** like `(אופציונלי)` after a Latin word: wrap the whole label in an element with the correct `dir`.
- Use the Unicode marks only as a last resort: `‏` (RLM) and `‎` (LRM). They are invisible and hard to maintain. Prefer `dir` attributes.

Inputs:

- Phone, email, URL, and numeric inputs are always `dir="ltr"` with `text-start`, even in the Hebrew UI. A phone typed into an RTL input looks reversed as it is typed.
- Name and notes inputs inherit direction (RTL in Hebrew). Add `dir="auto"` on free-text fields that may receive either language, such as guest names.
- Placeholder text follows the input's `dir`. A Hebrew placeholder in an LTR phone input is acceptable; it is better to show a Latin example like `050-000-0000`.

## 5. Icons, chevrons, and motion

Flip only icons that carry directional meaning:

- Flip: back and forward arrows, chevrons in breadcrumbs and "next" buttons, "send" arrows, progress indicators, undo and redo.
- Do not flip: clocks, phones, checkmarks, play buttons, logos, map pins, calendar icons, WhatsApp and brand icons, question marks.
- Implement with `rtl:-scale-x-100` on the icon, or import the mirrored icon from the icon set.
- Slide-in and slide-out animations use logical start and end, see section 2. A drawer that opens from the "start" edge opens from the right in Hebrew.
- Toasts and floating buttons anchor to the logical end: `end-4 bottom-4`.

## 6. Forms and layout

- Labels sit above inputs, not beside them. This avoids every alignment issue between the two directions.
- Required marks (`*`) go after the label text in both directions; the bidi algorithm places them correctly when the label element has the right `dir`.
- Checkbox and radio: the control sits at the logical start, label at the logical end. Native inputs inside a flex row with `gap` do this automatically.
- Error messages align `text-start`.
- Buttons: primary action at the logical end of a button row. In Hebrew that is visually on the left. Do not "fix" this; it matches the reading order.
- Tables: header text `text-start`. Numeric columns `text-end` with `tabular-nums`. Phone and email columns are LTR islands inside `text-start` cells.

## 7. Dates, times, and numbers

- Use `Intl.DateTimeFormat` with the active locale. Hebrew dates: `new Intl.DateTimeFormat("he-IL", { dateStyle: "full", timeStyle: "short" })` gives `יום שישי, 12 במאי 2026 בשעה 19:00`.
- Keep Western digits (0-9) in both locales. Do not use Hebrew numerals in the UI.
- Day of week matters in Hebrew invitations; always show it.
- Countdown: labels are nouns in both plural forms where Hebrew needs them (`יום` / `ימים`, `שעה` / `שעות`). Use the i18n library's plural rules, not string concatenation.
- Currency: `Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" })` gives `‏50 ₪`. The output already contains a bidi mark; do not add another.

## 8. i18n wiring (next-intl)

- Messages live in `messages/he.json` and `messages/en.json`. Every user-visible string goes through `t()`. No hardcoded Hebrew or English in components.
- Keys are English, lowercase, dot-separated by screen: `event.form.title`, `rsvp.guestCount`.
- Hebrew is the source of truth. Write the Hebrew string first, then the English.
- Hebrew strings in JSON should not include Unicode bidi marks; handle direction in markup.
- Gendered phrasing: default to plural or gender-neutral Hebrew where natural (`מוזמנים`, `נרשמת` becomes `נרשמתם` or `ההרשמה נקלטה`). Avoid second-person singular where it forces a gender.

## 9. Email templates

- Email clients have poor logical-property support. In email HTML, set `dir="rtl"` on `<html>`, `<body>`, and every `<table>` and `<td>`, and use explicit `align="right"` for Hebrew and `align="left"` for English. This is the one place where physical properties are correct.
- Use web-safe fonts with Hebrew coverage (Arial, Tahoma) with the chosen Google font as the first choice; many clients will not load web fonts.
- Phone numbers and links in emails: `<span dir="ltr">` as in the web UI.

## 10. Verification checklist

Run this on every new screen and template, in both locales:

1. Switch `lang`/`dir` at the root and reload. Layout mirrors; nothing overlaps.
2. Enter a phone number, an email, a mixed Hebrew and English name, and an English-only name. All read correctly as typed and in the table.
3. Enter a 40-character Hebrew name and a 40-character English name. No overflow, no mid-word breaks. (Use the `break-ui` skill for the full worst-case pass.)
4. Check every arrow and chevron: directional ones flipped, symbolic ones not.
5. Check the date line: day of week, date, and time in the right order for the locale, with the time range not reversed.
6. Grep for physical Tailwind classes (section 2). Zero hits outside LTR islands.
7. Open on a phone in Hebrew. Form fields do not zoom on focus (font-size at least 16px), nothing is hidden behind the keyboard, buttons are reachable by thumb.
8. Screenshot the invitation page in both locales side by side and compare visually.
