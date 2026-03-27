import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageContainer } from "../components";
import useFetch from "../hooks/useFetch";
import { getMyAttendedEvents } from "../services/users";
import type { AttendedEventsResponse } from "../types";
import { formatEventDisplayDate } from "./events/dateUtils";

export const ProfileAttended = () => {
  const [now] = useState(() => Date.now());
  const { run, data, loading } = useFetch<AttendedEventsResponse>();

  useEffect(() => {
    run(() => getMyAttendedEvents()).catch(() => {
      // useFetch handles global errors
    });
  }, [run]);

  const events = data?.events ?? [];
  const sinceLastAchievementCount = data?.sinceLastAchievementCount ?? 0;
  const totalMeetingsCount = data?.totalMeetingsCount ?? 0;
  const meetingsAfterGrade8Count = data?.meetingsAfterGrade8Count ?? 0;
  const yearsSinceCreated = data?.createdAt
    ? Math.floor((now - new Date(data.createdAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 0;
  const score = yearsSinceCreated + totalMeetingsCount + meetingsAfterGrade8Count;

  return (
    <PageContainer size="md" className="ui-page">
      <Link to="/profile" className="ui-link">
        ← Tillbaka
      </Link>

      <h2 className="ui-page-title mb-4 mt-4">Min närvaro</h2>

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <div className="ui-card">
          <p className="text-sm text-neutral-600">Möten sedan senaste utmärkelse</p>
          <p className="mt-1 text-3xl font-bold text-neutral-900">{sinceLastAchievementCount}</p>
        </div>
        <div className="ui-card">
          <p className="text-sm text-neutral-600">Totalt deltagna möten</p>
          <p className="mt-1 text-3xl font-bold text-neutral-900">{totalMeetingsCount}</p>
        </div>
        <div className="ui-card">
          <p className="text-sm text-neutral-600">Poängräknare</p>
          <p className="mt-1 text-3xl font-bold text-neutral-900">{score}</p>
        </div>
      </div>

      <div className="ui-card">
        <h3 className="mb-3 text-lg font-semibold text-neutral-900">Möten deltagna</h3>

        {loading ? <p className="text-neutral-600">Laddar...</p> : null}

        {!loading && events.length === 0 ? (
          <p className="text-neutral-600">Inga detagna möten hittades.</p>
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
                  <p className="text-sm text-neutral-600">{formatEventDisplayDate(event.startDate)}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </PageContainer>
  );
};
