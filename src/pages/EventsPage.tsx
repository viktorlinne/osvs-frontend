import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, PageContainer } from "../components";
import { useAuth } from "../context";
import useFetch from "../hooks/useFetch";
import { listEvents, listMyEvents } from "../services";
import type { Event as EventRecord } from "../types";
import { dateKeyFromEventDate } from "./events/dateUtils";

// Start week on Monday
const WEEK_DAYS = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

function formatMonthNameSv(date: Date) {
  const name = new Intl.DateTimeFormat("sv-SE", { month: "long" }).format(date);
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function startOfMonth(year: number, month: number) {
  return new Date(year, month, 1);
}

function endOfMonth(year: number, month: number) {
  return new Date(year, month + 1, 0);
}

function getMonthMatrix(year: number, month: number) {
  const start = startOfMonth(year, month);
  const end = endOfMonth(year, month);

  const matrix: Array<Array<Date | null>> = [];
  let week: Array<Date | null> = [];

  // fill leading nulls (week starts on Monday)
  const startWeekday = (start.getDay() + 6) % 7;
  for (let i = 0; i < startWeekday; i++) week.push(null);

  for (let d = 1; d <= end.getDate(); d++) {
    week.push(new Date(year, month, d));
    if (week.length === 7) {
      matrix.push(week);
      week = [];
    }
  }

  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    matrix.push(week);
  }

  while (matrix.length < 6) matrix.push(Array(7).fill(null));

  return matrix;
}

function formatDateKey(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const EventsPage = () => {
  const today = new Date();
  const [viewDate, setViewDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [eventsByDate, setEventsByDate] = useState<Record<string, EventRecord[]>>({});
  const { run, loading } = useFetch<{ events?: EventRecord[] }>();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthMatrix = useMemo(() => getMonthMatrix(year, month), [year, month]);

  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;
    void run(() =>
      user && Array.isArray(user.roles) && user.roles.includes("Admin")
        ? listEvents()
        : listMyEvents(),
    )
      .then((res: { events?: EventRecord[] } | undefined) => {
        if (!mounted) return;
        const payload = res;
        const arr = payload?.events ?? [];
        const map: Record<string, EventRecord[]> = {};
        for (const ev of arr) {
          const key = dateKeyFromEventDate(ev.startDate);
          if (!key) continue;
          map[key] = map[key] ?? [];
          map[key].push(ev);
        }
        setEventsByDate(map);
      })
      .catch(() => {
        /* useFetch sets global error */
      });

    return () => {
      mounted = false;
    };
  }, [user, run]);

  function prevMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  function nextMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  function jumpToToday() {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  return (
    <PageContainer size="xl" className="ui-page">
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <h2 className="ui-page-title">Möteskalender</h2>

        <div className="flex flex-wrap gap-2">
          <Button onClick={prevMonth} variant="secondary" size="sm" aria-label="Previous month">
            Förra
          </Button>
          <Button onClick={jumpToToday} variant="secondary" size="sm">
            Idag
          </Button>
          <Button onClick={nextMonth} variant="secondary" size="sm" aria-label="Next month">
            Nästa
          </Button>
          {user &&
            (user.roles ?? []).some((r) => ["Admin", "Editor"].includes(r)) && (
              <Link to="/events/create" className="ui-btn ui-btn-primary ui-btn-sm">
                Skapa
              </Link>
            )}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-lg font-medium text-neutral-700 md:text-xl">
          {formatMonthNameSv(viewDate)} {year}
        </p>
      </div>

      {/* Mobile: single column, date-ordered list */}
      <div className="block overflow-hidden rounded-md border border-neutral-200 bg-white sm:hidden">
        {(() => {
          const end = endOfMonth(year, month);
          const daysInMonth = end.getDate();
          const rows: React.ReactElement[] = [];
          for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            const key = formatDateKey(date);
            const evs = eventsByDate[key] ?? [];
            const weekday = WEEK_DAYS[(date.getDay() + 6) % 7];

            rows.push(
              <div key={key} className="flex items-start gap-3 border-b border-neutral-200 p-3 last:border-b-0">
                <div className="w-20 shrink-0 rounded-md bg-neutral-100 p-2 text-center text-sm font-medium">
                  <div className="text-xs text-neutral-600">{weekday}</div>
                  <div className="text-sm font-semibold">{d}</div>
                </div>
                <div className="flex-1">
                  {evs.length === 0 ? (
                    <div className="text-xs text-neutral-600">Inga möten</div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {evs.map((e) => (
                        <Link
                          key={e.id}
                          to={`/events/${e.id}`}
                          className="block truncate rounded-md bg-primary-50 px-2 py-1 text-sm text-primary-800"
                          title={e.title}
                        >
                          {e.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>,
            );
          }
          return rows;
        })()}
      </div>

      {/* Desktop / tablet: month grid */}
      <div className="hidden overflow-hidden rounded-md border border-neutral-200 bg-white sm:grid sm:grid-cols-7 sm:gap-1">
        {WEEK_DAYS.map((wd) => (
          <div
            key={wd}
            className="bg-neutral-100 py-2 text-center text-sm font-medium text-neutral-700"
          >
            {wd}
          </div>
        ))}

        {monthMatrix.map((week, wi) => (
          <React.Fragment key={wi}>
            {week.map((date, di) => {
              const isToday = date
                ? date.getFullYear() === today.getFullYear() &&
                date.getMonth() === today.getMonth() &&
                date.getDate() === today.getDate()
                : false;

              const inMonth = date ? date.getMonth() === month : false;

              return (
                <div
                  key={di}
                  className={`flex min-h-[80px] min-w-0 flex-col border-l border-t border-neutral-200 px-3 py-2 text-sm md:min-h-[100px] md:px-4 lg:min-h-[120px] ${inMonth ? "bg-white text-neutral-700" : "bg-neutral-100 text-neutral-600"}`}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full ${isToday ? "bg-primary-600 text-white" : "text-neutral-700"}`}
                    >
                      {date ? date.getDate() : ""}
                    </div>
                  </div>

                  <div className="mt-4 min-w-0 overflow-hidden text-xs text-neutral-700">
                    {!loading &&
                      date &&
                      (() => {
                        const key = formatDateKey(date);
                        const evs = eventsByDate[key] ?? [];
                        if (evs.length === 0) return null;
                        const first = evs.slice(0, 3);
                        return (
                          <div className="flex flex-col gap-1">
                            {first.map((e: EventRecord) => (
                              <Link
                                key={e.id}
                                to={`/events/${e.id}`}
                                className="block w-full truncate overflow-hidden rounded-md bg-primary-50 px-1 py-0.5 text-xs text-primary-800 transition hover:bg-primary-100"
                                title={e.title}
                              >
                                {e.title}
                              </Link>
                            ))}
                          </div>
                        );
                      })()}
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </PageContainer>
  );
};
