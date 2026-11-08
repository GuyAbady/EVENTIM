# מערכת הזמנות לאירועים

מערכת לעסק אחד: יצירת דפי הזמנה דיגיטליים לאירועים, הפצת קישור אחד לכל אירוע, הרשמה עצמית של המוזמנים, מעקב ותזכורות.
האפיון המלא ותכנית העבודה נמצאים ב-[docs/work-plan.md](docs/work-plan.md).

## טכנולוגיה

- Next.js 16 (App Router, TypeScript), Tailwind CSS 4
- Supabase: Postgres, Auth, Storage
- next-intl: עברית (ברירת מחדל, RTL) ואנגלית. השפה נשמרת בעוגייה ולא בכתובת, כך שלכל אירוע יש קישור אחד.
- Vercel לאירוח

## הרצה מקומית

```bash
npm install
cp .env.example .env.local
# מלא את משתני Supabase בקובץ .env.local
npm run dev
```

האתר עולה ב-http://localhost:3000.

## Supabase

סכמת הדאטאבייס נמצאת ב-`supabase/migrations/`. להרצה על פרויקט Supabase:

1. צור פרויקט ב-https://supabase.com/dashboard
2. הרץ את קבצי ה-migration לפי הסדר ב-SQL Editor, או דרך Supabase CLI: `supabase db push`
3. העתק מ-Project Settings > API את ה-URL, ה-publishable key וה-secret key ל-`.env.local`

## הוספת עובד (משתמש למערכת)

1. ב-Supabase Dashboard: Authentication, Users, Add user. הזן אימייל וסיסמה וסמן Auto Confirm.
2. ב-SQL Editor הרץ:

```sql
select public.inv_add_staff('person@example.com', 'שם לתצוגה');
```

בלי השורה הזו המשתמש יוכל להתחבר אבל יקבל "אין הרשאה".

## תזכורות באימייל

- השליחה דרך Gmail עם סיסמת אפליקציה (משתני `GMAIL_USER`, `GMAIL_APP_PASSWORD`). חשבון Gmail רגיל מוגבל לכ-500 מיילים ביום.
- לכל אירוע מגדירים "תזכורת באימייל לפני האירוע" (יום, יומיים, 3 ימים, שבוע, או בלי).
- Cron של Vercel קורא ל-`/api/cron/reminders` פעם ביום ב-07:00 UTC (09:00 בישראל) עם `Authorization: Bearer CRON_SECRET`, ושולח תזכורות שמועדן בתוך 24 השעות הבאות. בתוכנית Hobby של Vercel זו התדירות המקסימלית. אם עוברים לריצה שעתית, יש לעדכן את `vercel.json` ואת `REMINDER_RUN_INTERVAL_HOURS=1`.
- בדף האירוע: "שלח תזכורת לכולם עכשיו", "שלח מייל בדיקה אליי", וכפתור "אימייל" ליד כל נרשם. כל שליחה נרשמת ביומן השליחות.
- `/api/health` מראה אם החיבור ל-Gmail ול-Supabase תקין.

## שליחת הזמנות (שלב 7)

בדף האירוע לוחצים על "שליחת הזמנות" (`/admin/events/[id]/invitations`):

1. **נוסח ההזמנה:** טקסט אחד לכל אירוע עם השדות `{name} {event} {date} {time} {venue} {link}`. משמש ל-SMS ולוואטסאפ, ובאימייל הוא הפסקה הפותחת. מונה התווים מראה כמה הודעות SMS ייחשבו (בעברית עד 70 תווים להודעה).
2. **רשימת מוזמנים:** מדביקים שורות "שם, טלפון, אימייל", אפשר גם עמודות מ-Excel. חובה טלפון או אימייל. כפילויות לפי טלפון או אימייל מדולגות.
3. **שליחה:**
   - אימייל: דרך Gmail (אותם משתנים של התזכורות).
   - SMS: דרך Twilio (`TWILIO_*`). בלי הגדרה, בפיתוח ההודעה רק מודפסת ללוג, ובפרודקשן השליחה נכשלת עם `sms_not_configured`.
   - וואטסאפ: ידני. הכפתור פותח `wa.me` עם הנוסח, והעובד לוחץ "שלח". המערכת רק רושמת שהקישור נפתח.
   - שליחה המונית: עד 40 הודעות בכל לחיצה, רק למי שטרם נרשם וטרם קיבל הזמנה בערוץ הזה.
4. **סטטוס:** מוזמן נחשב "נרשם" כשקיימת הרשמה מאושרת עם אותו טלפון או אימייל.

כל שליחה נרשמת ב-`inv_invitation_log`.

## משתני סביבה

ראה `.env.example`. המשתנים עם `NEXT_PUBLIC_` נחשפים לדפדפן. `SUPABASE_SECRET_KEY` הוא לשרת בלבד.

## מבנה הפרויקט

```
src/app/              נתיבים (App Router)
src/components/       קומפוננטות משותפות
src/i18n/             הגדרות שפה, קריאת locale מעוגייה
src/lib/supabase/     לקוחות Supabase: דפדפן, שרת, admin, proxy
src/proxy.ts          רענון session והגנה על /admin
messages/             קבצי תרגום he.json, en.json
supabase/migrations/  סכמת DB
docs/                 אפיון ותכנית עבודה
.claude/skills/       סקילים של עיצוב ו-React לסשנים של Claude Code
```

## בדיקות קצה לקצה

הבדיקות ב-`tests/` רצות מול שרת חי (מקומי או Vercel):

```bash
BASE_URL=http://localhost:3000 TEST_EVENT_SLUG=<slug-של-אירוע-פעיל> npm run test:e2e
```

בלי `TEST_EVENT_SLUG` רצות רק הבדיקות שלא דורשות אירוע. הבדיקות רצות בדסקטופ ובאמולציית iPhone, ומשאירות הרשמות בדיקה באירוע שנבחר, לכן עדיף אירוע ייעודי לבדיקות.

## פקודות

```bash
npm run dev     # פיתוח
npm run build   # בנייה
npm run start   # הרצת גרסת production
npm run lint    # ESLint
npm run test:e2e  # Playwright (ראה למעלה)
```
