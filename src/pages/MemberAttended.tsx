import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
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

  return (
    <div className="max-w-3xl w-full mx-auto p-6 min-h-screen">
      <Link
        to={`/members/${matrikelnummer}`}
        className="text-sm text-green-600 hover:text-green-700 hover:underline"
      >
        ← Tillbaka
      </Link>

      <h2 className="text-2xl font-bold mt-4 mb-4">Närvaro</h2>

      <div className="bg-white p-4 rounded-md shadow mb-4">
        <p className="text-sm text-gray-600">
          Närvaro sedan senaste utmärkelse
        </p>
        <p className="text-3xl font-bold mt-1">{sinceLastAchievementCount}</p>
      </div>

      <div className="bg-white p-4 rounded-md shadow">
        <h3 className="text-lg font-semibold mb-3">Attenderade möten</h3>

        {loading ? <p className="text-gray-500">Laddar...</p> : null}

        {!loading && events.length === 0 ? (
          <p className="text-gray-500">Inga attenderade möten hittades.</p>
        ) : null}

        {!loading && events.length > 0 ? (
          <ul className="space-y-2">
            {events.map((event) => (
              <li
                key={event.id}
                className="border rounded-md px-3 py-2 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <Link
                    to={`/events/${event.id}`}
                    className="font-medium text-green-700 hover:text-green-800 hover:underline"
                  >
                    {event.title}
                  </Link>
                  <p className="text-sm text-gray-600">
                    {formatEventDate(event.startDate)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
};
