"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "@icons/index";
import { useLocalization } from "@i18n/client";
import type { DatePickerProps, ViewMode } from "@shared-types/ui/datePicker";

const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const toISO = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const toDisplay = (iso: string) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
};

function monthGrid(view: Date) {
  const y = view.getFullYear();
  const m = view.getMonth();
  const first = new Date(y, m, 1);
  const offset = (first.getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  const cells: Array<{ d: Date; inMonth: boolean }> = [];

  for (let i = 0; i < offset; i++) {
    cells.push({ d: new Date(y, m, 1 - (offset - i)), inMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ d: new Date(y, m, day), inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].d;
    cells.push({
      d: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
      inMonth: false,
    });
  }
  return cells;
}

function startOfDecade(year: number) {
  return Math.floor(year / 10) * 10;
}

function decadeYears(baseYear: number) {
  const start = startOfDecade(baseYear);
  return Array.from({ length: 12 }, (_, i) => start - 1 + i);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function DatePicker(props: DatePickerProps) {
  const { startLabel, endLabel, dates, className = "" } = props;
  const { msgs } = useLocalization();

  const WEEKDAYS = useMemo(
    () => [dates.mon, dates.tues, dates.wed, dates.thur, dates.fri, dates.sat, dates.sun],
    [dates],
  );

  const MONTHS = useMemo(
    () => [
      dates.january,
      dates.february,
      dates.march,
      dates.april,
      dates.may,
      dates.june,
      dates.july,
      dates.august,
      dates.september,
      dates.october,
      dates.november,
      dates.december,
    ],
    [dates],
  );

  const isControlled = "startValue" in props;

  const start = isControlled ? props.startValue : (props.watch("datum_zaciatku") as string) || "";
  const end = isControlled ? props.endValue : (props.watch("datum_konca") as string) || "";

  const [open, setOpen] = useState<"start" | "end" | null>(null);
  const [mode, setMode] = useState<ViewMode>("day");

  const [view, setView] = useState(() => {
    const base = start ? new Date(start) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    setMode("day");

    const iso = open === "start" ? start : end;
    if (!iso) return;

    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) setView(new Date(d.getFullYear(), d.getMonth(), 1));
  }, [open, start, end]);

  const cells = useMemo(() => monthGrid(view), [view]);

  const selectedDate = useMemo(() => {
    const iso = open === "start" ? start : open === "end" ? end : "";
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [open, start, end]);

  const goPrev = () => {
    setView((d) => {
      if (mode === "day") return new Date(d.getFullYear(), d.getMonth() - 1, 1);
      if (mode === "month") return new Date(d.getFullYear() - 1, d.getMonth(), 1);
      return new Date(d.getFullYear() - 10, d.getMonth(), 1);
    });
  };

  const goNext = () => {
    setView((d) => {
      if (mode === "day") return new Date(d.getFullYear(), d.getMonth() + 1, 1);
      if (mode === "month") return new Date(d.getFullYear() + 1, d.getMonth(), 1);
      return new Date(d.getFullYear() + 10, d.getMonth(), 1);
    });
  };

  const setField = (field: "datum_zaciatku" | "datum_konca", value: string) => {
    if (isControlled) {
      props.onChange(field, value);
    } else {
      props.setValue(field, value as any, { shouldDirty: true });
    }
  };

  const select = (iso: string) => {
    if (!open) return;
    setField(open === "start" ? "datum_zaciatku" : "datum_konca", iso);
    setOpen(null);
  };

  const setToday = () => select(toISO(new Date()));

  const headerLabel = useMemo(() => {
    if (mode === "day") return `${MONTHS[view.getMonth()]} ${view.getFullYear()}`;
    if (mode === "month") return `${view.getFullYear()}`;
    const s = startOfDecade(view.getFullYear());
    return `${s} – ${s + 9}`;
  }, [mode, view, MONTHS]);

  const toggleMode = () => setMode((m) => (m === "day" ? "month" : m === "month" ? "year" : "day"));

  return (
    <div ref={wrapRef} className={`relative grid grid-cols-2 gap-4 ${className}`}>
      {/* START */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">{startLabel}</label>
        {!isControlled && <input type="hidden" {...props.register("datum_zaciatku" as any)} />}

        <button
          type="button"
          onClick={() => {
            setMode("day");
            setOpen((v) => (v === "start" ? null : "start"));
          }}
          className="w-full"
        >
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Icon name="calendar-days" className="h-4 w-4 text-gray-500" />
            </div>
            <input
              readOnly
              value={toDisplay(start)}
              placeholder="dd.mm.rrrr"
              className="w-full cursor-pointer rounded-lg border border-primary-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </button>
      </div>

      {/* END */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">{endLabel}</label>
        {!isControlled && <input type="hidden" {...props.register("datum_konca" as any)} />}

        <button
          type="button"
          onClick={() => {
            setMode("day");
            setOpen((v) => (v === "end" ? null : "end"));
          }}
          className="w-full"
        >
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Icon name="calendar-days" className="h-4 w-4 text-gray-500" />
            </div>
            <input
              readOnly
              value={toDisplay(end)}
              placeholder="dd.mm.rrrr"
              className="w-full cursor-pointer rounded-lg border border-primary-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </button>
      </div>

      {/* POPOVER */}
      {open && (
        <div
          className={`absolute z-50 mt-2 w-[320px] rounded-xl border border-primary-100 bg-white p-3 shadow-xl ${
            open === "start" ? "left-0" : "right-0"
          }`}
        >
          {/* HEADER */}
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={goPrev}
              className="rounded-md border border-primary-200 px-2 py-1 hover:bg-primary-50"
              aria-label="Späť"
            >
              <Icon name="chevron-left" className="h-4 w-4 text-primary-700" />
            </button>

            <button
              type="button"
              onClick={toggleMode}
              className="rounded-md px-2 py-1 text-sm font-semibold text-ink-900 hover:bg-primary-50"
              aria-label="Zmeniť pohľad"
            >
              {headerLabel}
            </button>

            <button
              type="button"
              onClick={goNext}
              className="rounded-md border border-primary-200 px-2 py-1 hover:bg-primary-50"
              aria-label="Ďalej"
            >
              <Icon name="chevron-right" className="h-4 w-4 text-primary-700" />
            </button>
          </div>

          {/* BODY */}
          {mode === "day" && (
            <>
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-gray-500">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="py-1">
                    {w}
                  </div>
                ))}
              </div>

              <div className="mt-1 grid grid-cols-7 gap-1">
                {cells.map(({ d, inMonth }, i) => {
                  const selected = selectedDate ? isSameDay(selectedDate, d) : false;
                  const today = isSameDay(new Date(), d);

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => select(toISO(d))}
                      className={[
                        "h-9 rounded-lg text-sm transition",
                        inMonth
                          ? "text-gray-900 hover:bg-primary-50"
                          : "text-gray-400 hover:bg-gray-50",
                        selected ? "bg-primary-600 text-white hover:bg-primary-700" : "",
                        !selected && today ? "ring-1 ring-primary-300" : "",
                      ].join(" ")}
                    >
                      {d.getDate()}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {mode === "month" && (
            <div className="grid grid-cols-3 gap-2">
              {MONTHS.map((m, idx) => {
                const selected =
                  selectedDate &&
                  selectedDate.getFullYear() === view.getFullYear() &&
                  selectedDate.getMonth() === idx;

                return (
                  <button
                    key={`${m}-${idx}`}
                    type="button"
                    onClick={() => {
                      setView(new Date(view.getFullYear(), idx, 1));
                      setMode("day");
                    }}
                    className={[
                      "rounded-lg border px-2 py-2 text-sm transition",
                      selected
                        ? "border-primary-600 bg-primary-600 text-white"
                        : "border-primary-200 text-ink-900 hover:bg-primary-50",
                    ].join(" ")}
                  >
                    {m.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          )}

          {mode === "year" && (
            <div className="grid grid-cols-3 gap-2">
              {decadeYears(view.getFullYear()).map((y, idx) => {
                const inDecade = idx !== 0 && idx !== 11;
                const selected = selectedDate && selectedDate.getFullYear() === y;

                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setView(new Date(y, view.getMonth(), 1));
                      setMode("month");
                    }}
                    className={[
                      "rounded-lg border px-2 py-2 text-sm transition",
                      inDecade ? "border-primary-200" : "border-gray-200 text-gray-400",
                      selected
                        ? "border-primary-600 bg-primary-600 text-white"
                        : "hover:bg-primary-50 text-ink-900",
                    ].join(" ")}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          )}

          {/* FOOTER */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={setToday}
              className="rounded-md border border-primary-200 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50"
            >
              {msgs.common.today}
            </button>

            <button
              type="button"
              onClick={() => setOpen(null)}
              className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
            >
              {msgs.common.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
