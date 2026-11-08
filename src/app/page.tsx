import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { LaunchVideo } from "@/components/LaunchVideo";
import { buttonLinkClass } from "@/components/ui/Button";

export async function generateMetadata() {
  const t = await getTranslations("app");
  return { title: { absolute: t("name") }, description: t("tagline") };
}

// Public home page: the launch video with a play button, and the way into the system.
export default async function HomePage() {
  const t = await getTranslations();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 sm:py-14">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold tracking-[0.2em] text-muted" dir="ltr">EVENTIM</p>
          <h1 className="text-balance text-3xl font-semibold sm:text-4xl">{t("home.title")}</h1>
          <p className="text-pretty text-lg text-muted">{t("app.tagline")}</p>
        </div>
        <LocaleSwitcher />
      </div>

      <LaunchVideo
        src="/media/eventim-launch.mp4"
        poster="/media/eventim-launch.jpg"
        playLabel={t("home.play")}
        title={t("home.videoTitle")}
      />

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link href="/admin" className={buttonLinkClass("primary") + " min-w-48"}>
          {t("home.enter")}
        </Link>
      </div>
    </main>
  );
}
