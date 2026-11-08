import { getTranslations } from "next-intl/server";

export default async function EventNotFound() {
  const t = await getTranslations("invite");
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold">{t("notFoundTitle")}</h1>
      <p className="text-muted">{t("notFoundBody")}</p>
    </main>
  );
}
