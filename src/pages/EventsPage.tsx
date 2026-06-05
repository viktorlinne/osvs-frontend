import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, PageContainer } from "../components";
import { useAuth } from "../context";
import useFetch from "../hooks/useFetch";
import { listEvents, listMyEvents } from "../services";
import type { Event as EventRecord } from "../types";
import { dateKeyFromEventDate } from "./events/dateUtils";

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
  return matrix;
}

function formatDateKey(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// startDate is stored as "YYYY-MM-DD HH:MM:SS" Stockholm time
function formatEventTime(startDate: string): string {
  const timePart = startDate.slice(11, 16);
  return timePart.length === 5 ? timePart : "";
}

export const EventsPage = () => {
  const today = new Date();
  const [viewDate, setViewDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [eventsByDate, setEventsByDate] = useState<Record<string, EventRecord[]>>({});
  const [fetchError, setFetchError] = useState(false);
  const { run, loading } = useFetch<{ events?: EventRecord[] }>();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthMatrix = useMemo(() => getMonthMatrix(year, month), [year, month]);
  const { user } = useAuth();
  const canCreate =
    user && (user.roles ?? []).some((r) => ["Admin", "Editor"].includes(r));

  useEffect(() => {
    let mounted = true;
    setFetchError(false);
    void run(() =>
      user && Array.isArray(user.roles) && user.roles.includes("Admin")
        ? listEvents()
        : listMyEvents(),
    )
      .then((res: { events?: EventRecord[] } | undefined) => {
        if (!mounted) return;
        const arr = res?.events ?? [];
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
        if (mounted) setFetchError(true);
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

  const daysWithEvents = useMemo(() => {
    const end = endOfMonth(year, month);
    return Array.from({ length: end.getDate() }, (_, i) => i + 1).filter((d) => {
      const key = formatDateKey(new Date(year, month, d));
      return (eventsByDate[key] ?? []).length > 0;
    });
  }, [year, month, eventsByDate]);

  return (
    <PageContainer size="xl" className="ui-page">
      {/* ── Header ── */}
      <div className="mb-6">
        <span className="ui-chapter mb-1 block">Möteskalender</span>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 md:text-3xl">
            {formatMonthNameSv(viewDate)} {year}
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={prevMonth}
                aria-label="Föregående månad"
              >
                Förra
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={jumpToToday}
                aria-label="Gå till innevarande månad"
              >
                Idag
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={nextMonth}
                aria-label="Nästa månad"
              >
                Nästa
              </Button>
            </div>
            {canCreate && (
              <Link to="/events/create" className="ui-btn ui-btn-sm ui-btn-primary">
                Skapa möte
              </Link>
            )}
          </div>
        </div>
      </div>

      {fetchError && (
        <div className="mb-4 rounded-md border border-danger-600/20 bg-danger-50 px-4 py-3 text-sm text-danger-700" role="alert">
          Kunde inte hämta mötena. Kontrollera din anslutning och försök igen.
        </div>
      )}

      {/* ── Mobile: events-only list ── */}
      <div className="block overflow-hidden rounded-md border border-neutral-200 bg-neutral-50 sm:hidden">
        {loading ? (
          <div className="divide-y divide-neutral-200" aria-busy="true" aria-label="Laddar möten">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex items-start gap-3 p-3">
                <div className="h-[3.25rem] w-14 rounded skeleton-shimmer" />
                <div className="flex-1 pt-1">
                  <div className="h-7 rounded skeleton-shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : daysWithEvents.length === 0 ? (
          <p className="px-4 py-6 text-sm text-neutral-600">
            {!fetchError && "Inga möten den här månaden."}
          </p>
        ) : (
          daysWithEvents.map((d) => {
            const date = new Date(year, month, d);
            const key = formatDateKey(date);
            const evs = eventsByDate[key] ?? [];
            const weekday = WEEK_DAYS[(date.getDay() + 6) % 7];
            const isToday =
              date.getFullYear() === today.getFullYear() &&
              date.getMonth() === today.getMonth() &&
              date.getDate() === today.getDate();
            return (
              <div
                key={key}
                className="flex items-start gap-3 border-b border-neutral-200 p-3 last:border-b-0"
              >
                <div
                  className={`w-14 shrink-0 rounded py-2 text-center ${isToday ? "bg-primary-600 text-white" : "bg-neutral-100 text-neutral-700"}`}
                >
                  <div className="text-xs font-semibold uppercase tracking-widest opacity-70">
                    {weekday}
                  </div>
                  <div className="text-base font-semibold leading-tight">{d}</div>
                </div>
                <div className="flex flex-1 flex-col gap-1.5 pt-1">
                  {evs.map((e) => {
                    const time = formatEventTime(e.startDate);
                    return (
                      <Link
                        key={e.id}
                        to={`/events/${e.id}`}
                        className="block truncate rounded bg-primary-50 px-2 py-1 text-sm text-primary-700 transition-colors duration-150 hover:bg-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-1"
                        aria-label={`${time ? `${time} – ` : ""}${e.title}`}
                        title={e.title}
                      >
                        {time && (
                          <>
                            <span className="font-semibold tabular-nums">{time}</span>
                            <span className="mx-1.5 text-primary-400" aria-hidden="true">·</span>
                          </>
                        )}
                        {e.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Desktop / tablet: month grid ── */}
      <div
        className="hidden overflow-hidden rounded-md border border-neutral-200 sm:grid sm:grid-cols-7"
        aria-busy={loading}
      >
        {WEEK_DAYS.map((wd) => (
          <div
            key={wd}
            className="border-b border-neutral-200 bg-neutral-100 py-2 text-center text-xs font-semibold uppercase tracking-widest text-neutral-600"
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
                  aria-current={isToday ? "date" : undefined}
                  className={`flex min-h-[80px] min-w-0 flex-col border-l border-t border-neutral-200 px-2 py-1.5 md:min-h-[100px] lg:min-h-[120px] ${
                    inMonth ? "bg-neutral-50 text-neutral-700" : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  <div className="flex items-start">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        isToday
                          ? "bg-primary-600 text-white"
                          : inMonth
                          ? "text-neutral-700"
                          : "text-neutral-600"
                      }`}
                    >
                      {date ? date.getDate() : ""}
                    </div>
                  </div>

                  <div className="mt-1 min-w-0 overflow-hidden">
                    {!loading &&
                      date &&
                      (() => {
                        const key = formatDateKey(date);
                        const evs = eventsByDate[key] ?? [];
                        if (evs.length === 0) return null;
                        return (
                          <div className="flex flex-col gap-0.5">
                            {evs.slice(0, 3).map((e: EventRecord) => {
                              const time = formatEventTime(e.startDate);
                              return (
                                <Link
                                  key={e.id}
                                  to={`/events/${e.id}`}
                                  className="block w-full overflow-hidden truncate rounded bg-primary-50 px-1 py-0.5 text-xs text-primary-700 transition-colors duration-150 hover:bg-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-1"
                                  aria-label={`${time ? `${time} – ` : ""}${e.title}`}
                                  title={e.title}
                                >
                                  {time && (
                                    <>
                                      <span className="font-semibold tabular-nums">{time}</span>
                                      <span className="mx-0.5 text-primary-400" aria-hidden="true">·</span>
                                    </>
                                  )}
                                  {e.title}
                                </Link>
                              );
                            })}
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
