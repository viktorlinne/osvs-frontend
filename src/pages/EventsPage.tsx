import React, { useEffect, useMemo, useState } from "react";
import { listMyEvents, listEvents } from "../services";
import { useAuth } from "../context";
import { useError } from "../context";
import type { Event as EventRecord, ApiError } from "../types";
import axios from "axios";
import { isApiError } from "../types/api";
import { Link } from "react-router-dom";
import { Spinner } from "../components";

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
  const startWeekday = (start.getDay() + 6) % 7; // map Sunday=0 -> 6, Monday=1 -> 0, ...
  for (let i = 0; i < startWeekday; i++) week.push(null);

  for (let d = 1; d <= end.getDate(); d++) {
    week.push(new Date(year, month, d));
    if (week.length === 7) {
      matrix.push(week);
      week = [];
    }
  }

  // trailing nulls
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    matrix.push(week);
  }

  // ensure 6 weeks (for consistent height)
  while (matrix.length < 6) matrix.push(Array(7).fill(null));

  return matrix;
}

function formatDateKey(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dateKeyFromString(s?: string) {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return formatDateKey(d);
}

export const EventsPage = () => {
  const today = new Date();
  const [viewDate, setViewDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [eventsByDate, setEventsByDate] = useState<
    Record<string, EventRecord[]>
  >({});
  const [loading, setLoading] = useState<boolean>(false);
  const { setError, clearError } = useError();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthMatrix = useMemo(() => getMonthMatrix(year, month), [year, month]);

  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;
    async function fetchEvents() {
      setLoading(true);
      clearError();
      try {
        const isAdmin = Boolean(
          user && Array.isArray(user.roles) && user.roles.includes("Admin")
        );
        const res: unknown = await (isAdmin ? listEvents() : listMyEvents());
        if (!mounted) return;
        const payload = res as { events?: EventRecord[] } | undefined;
        const arr = payload?.events ?? [];
        const map: Record<string, EventRecord[]> = {};
        for (const ev of arr) {
          const key = dateKeyFromString(ev.startDate);
          if (!key) continue;
          map[key] = map[key] ?? [];
          map[key].push(ev);
        }
        setEventsByDate(map);
      } catch (err: unknown) {
        if (!mounted) return;
        if (axios.isAxiosError(err) && err.response) {
          const raw = err.response.data as ApiError | undefined;
          setError(raw?.message ?? String(err));
        } else if (isApiError(err)) {
          setError(err.message ?? String(err));
        } else if (err instanceof Error) {
          setError(err.message ?? String(err));
        } else {
          setError(String(err ?? "Request failed"));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void fetchEvents();

    return () => {
      mounted = false;
    };
  }, [user, setError, clearError]);

  function prevMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  function nextMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  function jumpToToday() {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Spinner /></div>;

  return (
    <div className="p-6 w-full xl:max-w-[1100px] mx-auto min-h-screen">
      <div className="flex flex-col sm:flex-row gap-y-2 sm:gap-y-0 sm:gap-x-4 py-2 mb-4">
        <div className="flex items-center justify-between w-full ">
          <h2 className="text-2xl font-bold mb-4">Möteskalender</h2>
          <div className="flex flex-col sm:flex-row gap-y-2 sm:gap-y-0 sm:gap-x-2">
            <button
              onClick={prevMonth}
              className="transition px-3 py-2 rounded-md text-sm font-medium bg-gray-100 hover:bg-gray-200"
              aria-label="Previous month"
            >
              Förra
            </button>
            <button
              onClick={jumpToToday}
              className="transition px-3 py-2 rounded-md text-sm font-medium bg-gray-100 hover:bg-gray-200"
            >
              Hoppa till idag
            </button>
            <button
              onClick={nextMonth}
              className="transition px-3 py-2 rounded-md text-sm font-medium bg-gray-100 hover:bg-gray-200"
              aria-label="Next month"
            >
              Nästa
            </button>
            {user &&
              (user.roles ?? []).some((r) =>
                ["Admin", "Editor"].includes(r)
              ) && (
                <Link
                  to="/events/create"
                  className="flex text-white bg-green-600 hover:bg-green-700 text-sm font-medium transtion px-3 py-2 rounded-md"
                >
                  Skapa Möte
                </Link>
              )}
          </div>
        </div>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xl font-medium">
          {formatMonthNameSv(viewDate)} {year}
        </p>
      </div>
      {/* Mobile: single column, date-ordered list */}
      <div className="block sm:hidden border rounded-md overflow-hidden">
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
              <div key={key} className="flex items-start border-b last:border-b-0 p-3 gap-3">
                <div className="w-20 min-w-[5rem] bg-gray-50 p-2 rounded text-sm font-medium text-center">
                  <div className="text-xs text-gray-500">{weekday}</div>
                  <div className="text-sm font-semibold">{d}</div>
                </div>
                <div className="flex-1">
                  {evs.length === 0 ? (
                    <div className="text-xs text-gray-400">Ingen möten</div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {evs.map((e) => (
                        <Link
                          key={e.id}
                          to={`/events/${e.id}`}
                          className="block truncate text-sm bg-green-50 text-green-800 px-2 py-1 rounded-md"
                          title={e.title}
                        >
                          {e.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          }
          return rows;
        })()}
      </div>

      {/* Desktop / tablet: month grid */}
      <div className="hidden sm:grid grid-cols-7 gap-1 border rounded-md-lg overflow-hidden">
        {WEEK_DAYS.map((wd) => (
          <div
            key={wd}
            className="bg-gray-50 text-center py-2 text-sm font-medium"
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
                  className={`min-h-[80px] md:min-h-[100px] lg:min-h-[120px] px-4 py-2 text-sm border-t border-l bg-white min-w-0 ${inMonth ? "" : "bg-gray-50 text-gray-400"
                    }`}
                  style={{ display: "flex", flexDirection: "column" }}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-green-600 text-white" : "text-gray-700"
                        }`}
                    >
                      {date ? date.getDate() : ""}
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-gray-600 min-w-0 overflow-hidden">
                    {loading && <div className="text-gray-400">Laddar…</div>}
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
                                className="block w-full truncate rounded-md px-1 py-0.5 text-xs bg-green-50 text-green-800 hover:bg-green-100 transition overflow-hidden"
                                title={e.title}
                              >
                                {e.title}
                              </Link>
                            ))}
                            {evs.length > 3 && (
                              <div className="text-xs text-gray-500">
                                +{evs.length - 3} fler...
                              </div>
                            )}
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
    </div>
  );
};
