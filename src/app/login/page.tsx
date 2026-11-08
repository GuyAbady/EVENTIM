import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { LoginForm } from "./LoginForm";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: t("loginTitle") };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const t = await getTranslations();

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{t("app.name")}</p>
          <h1 className="text-2xl font-semibold">{t("auth.loginTitle")}</h1>
          <p className="text-sm text-muted">{t("auth.loginSubtitle")}</p>
        </div>
        <LocaleSwitcher />
      </div>
      <LoginForm next={next} />
    </main>
  );
}
