"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { deleteEvent } from "@/app/admin/events/actions";

export function DeleteEventButton({ id, title }: { id: string; title: string }) {
  const t = useTranslations("admin");
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="danger"
      disabled={pending}
      onClick={() => {
        if (window.confirm(t("deleteConfirm", { title }))) {
          startTransition(() => deleteEvent(id));
        }
      }}
    >
      {t("deleteEvent")}
    </Button>
  );
}
