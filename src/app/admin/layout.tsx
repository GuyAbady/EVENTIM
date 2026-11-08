import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { Button } from "@/components/ui/Button";
import { requireStaff } from "@/lib/auth";
import { logout } from "@/app/login/actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  const t = await getTranslations();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <nav className="flex items-center gap-4">
            <Link href="/admin" className="font-semibold">
              {t("app.name")}
            </Link>
            <Link href="/admin" className="text-sm text-muted hover:text-foreground">
              {t("nav.events")}
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <LocaleSwitcher />
            <span className="hidden text-sm text-muted sm:inline" dir="ltr">
              {staff.displayName ?? staff.email}
            </span>
            <form action={logout}>
              <Button variant="ghost" type="submit" className="min-h-9 px-2">
                {t("nav.logout")}
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">{children}</main>
    </div>
  );
}
