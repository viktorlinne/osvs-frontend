import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { PageContainer } from "../components";
import useFetch from "../hooks/useFetch";
import { getUserAttendedEvents } from "../services/users";
import type { AttendedEventsResponse } from "../types";

function formatEventDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export const MemberAttended = () => {
  const { matrikelnummer } = useParams<{ matrikelnummer: string }>();
  const { run, data, loading } = useFetch<AttendedEventsResponse>();

  useEffect(() => {
    if (!matrikelnummer) return;
    run(() => getUserAttendedEvents(matrikelnummer)).catch(() => {
      // useFetch handles global errors
    });
  }, [matrikelnummer, run]);

  const events = data?.events ?? [];
  const sinceLastAchievementCount = data?.sinceLastAchievementCount ?? 0;
  const totalMeetingsCount = data?.totalMeetingsCount ?? 0;

  return (
    <PageContainer size="md" className="ui-page">
      <Link to={`/members/${matrikelnummer}`} className="ui-link">
        ← Tillbaka
      </Link>

      <h2 className="ui-page-title mb-4 mt-4">Närvaro</h2>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div className="ui-card">
          <p className="text-sm text-neutral-600">Närvaro sedan senaste utmärkelse</p>
          <p className="mt-1 text-3xl font-bold text-neutral-900">{sinceLastAchievementCount}</p>
        </div>
        <div className="ui-card">
          <p className="text-sm text-neutral-600">Totalt deltagna möten</p>
          <p className="mt-1 text-3xl font-bold text-neutral-900">{totalMeetingsCount}</p>
        </div>
      </div>

      <div className="ui-card">
        <h3 className="mb-3 text-lg font-semibold text-neutral-900">Attenderade möten</h3>

        {loading ? <p className="text-neutral-600">Laddar...</p> : null}

        {!loading && events.length === 0 ? (
          <p className="text-neutral-600">Inga attenderade möten hittades.</p>
        ) : null}

        {!loading && events.length > 0 ? (
          <ul className="space-y-2">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 px-3 py-2"
              >
                <div className="min-w-0">
                  <Link to={`/events/${event.id}`} className="ui-link text-sm">
                    {event.title}
                  </Link>
                  <p className="text-sm text-neutral-600">{formatEventDate(event.startDate)}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </PageContainer>
  );
};
