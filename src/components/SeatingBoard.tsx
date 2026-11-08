"use client";

import { useMemo, useState, useTransition, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import {
  assignTable,
  createTable,
  createTablesBulk,
  deleteTable,
  updateTable,
  type TableActionResult,
} from "@/app/admin/events/[id]/tables/actions";

export type SeatGuest = { id: string; name: string; guestCount: number; guestNames: string[]; tableId: string | null };
export type SeatTable = { id: string; name: string; capacity: number };

export function SeatingBoard({ eventId, tables, guests }: { eventId: string; tables: SeatTable[]; guests: SeatGuest[] }) {
  const t = useTranslations("tables");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [overTarget, setOverTarget] = useState<string | null>(null);

  const byTable = useMemo(() => {
    const map = new Map<string | null, SeatGuest[]>();
    for (const g of guests) {
      const key = g.tableId && tables.some((x) => x.id === g.tableId) ? g.tableId : null;
      map.set(key, [...(map.get(key) ?? []), g]);
    }
    return map;
  }, [guests, tables]);

  const totalGuests = guests.reduce((s, g) => s + g.guestCount, 0);
  const seated = guests.filter((g) => g.tableId && tables.some((x) => x.id === g.tableId)).reduce((s, g) => s + g.guestCount, 0);

  const run = (action: () => Promise<TableActionResult>) => {
    setError(null);
    startTransition(async () => {
      const r = await action();
      if (!r.ok) setError(t(`errors.${r.error}`));
      router.refresh();
    });
  };

  const onDrop = (target: string | null) => (e: DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/registration") || dragging;
    setOverTarget(null);
    setDragging(null);
    if (!id) return;
    const g = guests.find((x) => x.id === id);
    if (!g || g.tableId === target) return;
    run(() => assignTable(eventId, id, target));
  };
  const allowDrop = (target: string | null) => (e: DragEvent) => {
    e.preventDefault();
    if (overTarget !== target) setOverTarget(target);
  };

  const GuestCard = ({ g }: { g: SeatGuest }) => (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/registration", g.id);
        e.dataTransfer.effectAllowed = "move";
        setDragging(g.id);
      }}
      onDragEnd={() => setDragging(null)}
      className={`flex cursor-grab items-center justify-between gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm shadow-sm active:cursor-grabbing ${dragging === g.id ? "opacity-40" : ""}`}
    >
      <div className="min-w-0">
        <div className="truncate font-medium">{g.name}</div>
        {g.guestNames.length > 1 && <div className="truncate text-xs text-muted">{g.guestNames.slice(1).join(", ")}</div>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs tabular-nums">{g.guestCount}</span>
        <select
          aria-label={t("moveTo")}
          value={g.tableId && tables.some((x) => x.id === g.tableId) ? g.tableId : ""}
          disabled={pending}
          onChange={(e) => run(() => assignTable(eventId, g.id, e.target.value || null))}
          className="max-w-28 rounded-md border border-border bg-white px-1 py-1 text-xs"
        >
          <option value="">{t("noTable")}</option>
          {tables.map((tb) => (
            <option key={tb.id} value={tb.id}>{tb.name}</option>
          ))}
        </select>
      </div>
    </li>
  );

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted">{t("summary", { seated, total: totalGuests, tables: tables.length })}</p>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}

      <AddTableForm eventId={eventId} disabled={pending} run={run} />

      <div className="grid gap-5 lg:grid-cols-[18rem_1fr]">
        <section
          onDragOver={allowDrop(null)}
          onDragLeave={() => setOverTarget(null)}
          onDrop={onDrop(null)}
          className={`flex min-h-40 flex-col gap-2 rounded-xl border-2 border-dashed p-3 transition-colors ${overTarget === null && dragging ? "border-accent bg-accent/5" : "border-border bg-stone-50"}`}
        >
          <h2 className="flex items-center justify-between font-semibold">
            {t("unassigned")}
            <span className="text-sm font-normal text-muted">{(byTable.get(null) ?? []).reduce((s, g) => s + g.guestCount, 0)}</span>
          </h2>
          {(byTable.get(null) ?? []).length === 0 ? (
            <p className="text-sm text-muted">{t("unassignedEmpty")}</p>
          ) : (
            <ul className="flex flex-col gap-2">{(byTable.get(null) ?? []).map((g) => <GuestCard key={g.id} g={g} />)}</ul>
          )}
        </section>

        {tables.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted">{t("noTables")}</p>
        ) : (
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(17rem,1fr))]">
            {tables.map((tb) => {
              const list = byTable.get(tb.id) ?? [];
              const used = list.reduce((s, g) => s + g.guestCount, 0);
              const over = used > tb.capacity;
              return (
                <TableCard
                  key={tb.id}
                  table={tb}
                  used={used}
                  over={over}
                  active={overTarget === tb.id && Boolean(dragging)}
                  onDragOver={allowDrop(tb.id)}
                  onDragLeave={() => setOverTarget(null)}
                  onDrop={onDrop(tb.id)}
                  disabled={pending}
                  onSave={(name, capacity) => run(() => updateTable(eventId, tb.id, { name, capacity }))}
                  onDelete={() => {
                    if (window.confirm(t("deleteConfirm", { name: tb.name }))) run(() => deleteTable(eventId, tb.id));
                  }}
                >
                  {list.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted">{t("dropHere")}</p>
                  ) : (
                    <ul className="flex flex-col gap-2">{list.map((g) => <GuestCard key={g.id} g={g} />)}</ul>
                  )}
                </TableCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function AddTableForm({ eventId, disabled, run }: { eventId: string; disabled: boolean; run: (a: () => Promise<TableActionResult>) => void }) {
  const t = useTranslations("tables");
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("10");
  const [bulkN, setBulkN] = useState("10");
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 sm:flex-row sm:flex-wrap sm:items-end">
      <form
        className="flex flex-1 flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => createTable(eventId, { name, capacity }));
          setName("");
        }}
      >
        <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm">
          {t("tableName")}
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("tableNamePlaceholder")} maxLength={60} required />
        </label>
        <label className="flex w-24 flex-col gap-1 text-sm">
          {t("capacity")}
          <Input type="number" min={1} max={500} dir="ltr" className="text-start" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
        </label>
        <Button type="submit" disabled={disabled}>{t("add")}</Button>
      </form>
      <div className="flex items-end gap-2 border-t border-border pt-3 sm:border-s sm:border-t-0 sm:ps-4 sm:pt-0">
        <label className="flex w-20 flex-col gap-1 text-sm">
          <span className="text-muted">×</span>
          <Input type="number" min={1} max={50} dir="ltr" className="text-start" value={bulkN} onChange={(e) => setBulkN(e.target.value)} aria-label={t("quickAdd", { n: bulkN, capacity })} />
        </label>
        <Button type="button" variant="secondary" disabled={disabled} onClick={() => run(() => createTablesBulk(eventId, Number(bulkN), Number(capacity), t("exportColumn")))}>
          {t("quickAdd", { n: bulkN, capacity })}
        </Button>
      </div>
    </div>
  );
}

function TableCard({
  table, used, over, active, children, disabled, onSave, onDelete, onDragOver, onDragLeave, onDrop,
}: {
  table: SeatTable; used: number; over: boolean; active: boolean; children: React.ReactNode; disabled: boolean;
  onSave: (name: string, capacity: string) => void; onDelete: () => void;
  onDragOver: (e: DragEvent) => void; onDragLeave: () => void; onDrop: (e: DragEvent) => void;
}) {
  const t = useTranslations("tables");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(table.name);
  const [capacity, setCapacity] = useState(String(table.capacity));
  const pct = Math.min(100, Math.round((used / table.capacity) * 100));
  return (
    <section
      data-table={table.id}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`flex flex-col gap-2 rounded-xl border-2 bg-white p-3 transition-colors ${active ? "border-accent bg-accent/5" : over ? "border-red-300" : "border-border"}`}
    >
      {editing ? (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onSave(name, capacity);
            setEditing(false);
          }}
        >
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className="min-w-0 flex-1" required />
          <Input type="number" min={1} max={500} dir="ltr" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="w-20 text-start" />
          <Button type="submit" className="min-h-9 px-3" disabled={disabled}>{t("save")}</Button>
          <Button type="button" variant="ghost" className="min-h-9 px-3" onClick={() => setEditing(false)}>{t("cancel")}</Button>
        </form>
      ) : (
        <header className="flex flex-col gap-0.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 break-words font-semibold">{table.name}</h3>
            <div className="flex shrink-0 items-center">
              <Button type="button" variant="ghost" className="min-h-8 px-2 text-xs" onClick={() => setEditing(true)}>{t("rename")}</Button>
              <Button type="button" variant="ghost" className="min-h-8 px-2 text-xs text-red-700" disabled={disabled} onClick={onDelete} aria-label={t("delete")}>×</Button>
            </div>
          </div>
          <span className={`text-sm tabular-nums ${over ? "font-semibold text-red-700" : "text-muted"}`} dir="ltr">{t("occupancy", { used, capacity: table.capacity })}</span>
        </header>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100" aria-hidden>
        <div className={`h-full ${over ? "bg-red-500" : "bg-accent"}`} style={{ width: `${pct}%` }} />
      </div>
      {over && <p className="text-xs text-red-700">{t("overCapacity")}</p>}
      {children}
    </section>
  );
}
