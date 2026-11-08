"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { login, type LoginState } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations("auth");
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="flex flex-col gap-4 rounded-xl border border-border bg-white p-6">
      {next && <input type="hidden" name="next" value={next} />}
      <Field label={t("email")} htmlFor="email" required>
        <Input
          id="email"
          name="email"
          type="email"
          dir="ltr"
          className="text-start"
          autoComplete="email"
          required
          autoFocus
          defaultValue={state.email ?? ""}
        />
      </Field>
      <Field label={t("password")} htmlFor="password" required>
        <Input
          id="password"
          name="password"
          type="password"
          dir="ltr"
          className="text-start"
          autoComplete="current-password"
          required
        />
      </Field>
      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {t(state.error)}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
