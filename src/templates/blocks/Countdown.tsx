"use client";

import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";

function parts(target: number, now: number) {
  const diff = Math.max(0, target - now);
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    done: diff === 0,
  };
}

function subscribeToClock(onChange: () => void) {
  const id = setInterval(onChange, 1000);
  return () => clearInterval(id);
}
function getNowSeconds() {
  return Math.floor(Date.now() / 1000) * 1000;
}

export function Countdown({ dateTime, className = "" }: { dateTime: string; className?: string }) {
  const t = useTranslations("invite.countdown");
  const target = new Date(dateTime).getTime();
  // Server snapshot is null, so nothing renders until hydration and there is
  // no mismatch; the static date line on the page carries the information.
  const now = useSyncExternalStore(subscribeToClock, getNowSeconds, () => null);

  if (now == null) return <div className={`min-h-16 ${className}`} aria-hidden />;
  const p = parts(target, now);
  if (p.done) return <p className={`text-center text-lg ${className}`}>{t("today")}</p>;

  const cells = [
    [p.days, t("days")],
    [p.hours, t("hours")],
    [p.minutes, t("minutes")],
    [p.seconds, t("seconds")],
  ] as const;

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <span className="text-sm uppercase tracking-widest opacity-70">{t("title")}</span>
      <div className="flex gap-3 sm:gap-5">
        {cells.map(([n, label]) => (
          <div key={label} className="flex min-w-14 flex-col items-center">
            <span className="text-3xl font-semibold tabular-nums sm:text-4xl">{String(n).padStart(2, "0")}</span>
            <span className="text-xs opacity-70">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
