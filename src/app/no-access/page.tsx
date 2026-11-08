import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/Button";

export default async function NoAccessPage() {
  const t = await getTranslations();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-12 text-center">
      <h1 className="text-2xl font-semibold">{t("auth.noAccessTitle")}</h1>
      <p className="text-muted">
        {t("auth.noAccessBody", { email: user?.email ?? "" })}
      </p>
      <form action={logout}>
        <Button variant="secondary" type="submit">{t("nav.logout")}</Button>
      </form>
    </main>
  );
}
