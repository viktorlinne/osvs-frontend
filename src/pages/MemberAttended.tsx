import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageContainer } from "../components";
import { SkeletonLabel, SkeletonText } from "../components/PageSkeleton";
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

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(date);
}

export const MemberAttended = () => {
  const { matrikelnummer } = useParams<{ matrikelnummer: string }>();
  const [now] = useState(() => Date.now());
  const { run, data, loading, notFound } = useFetch<AttendedEventsResponse>();

  useEffect(() => {
    if (!matrikelnummer) return;
    run(() => getUserAttendedEvents(matrikelnummer)).catch(() => {
      // useFetch handles global errors
    });
  }, [matrikelnummer, run]);

  const events = data?.events ?? [];
  const sinceLastAchievementCount = data?.sinceLastAchievementCount ?? null;
  const totalMeetingsCount = data?.totalMeetingsCount ?? null;
  const meetingsAfterGrade8Count = data?.meetingsAfterGrade8Count ?? null;
  const yearsSinceCreated =
    data?.createdAt
      ? Math.floor(
          (now - new Date(data.createdAt).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000),
        )
      : null;
  const score =
    yearsSinceCreated !== null &&
    totalMeetingsCount !== null &&
    meetingsAfterGrade8Count !== null
      ? yearsSinceCreated + totalMeetingsCount + meetingsAfterGrade8Count
      : null;

  return (
    <PageContainer size="md" className="ui-page">
      <Link to={`/members/${matrikelnummer}`} className="ui-link">
        ← Tillbaka
      </Link>

      <h1 className="ui-section-title mb-6 mt-4">Närvaro</h1>

      {loading ? (
        <div>
          <div className="ui-card mb-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="ui-entry flex items-baseline justify-between gap-4">
                <SkeletonLabel width="w-48" />
                <SkeletonText width="w-10" />
              </div>
            ))}
          </div>
          <div className="ui-card">
            <SkeletonLabel width="w-32" />
            <div className="mt-4">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="ui-entry flex items-baseline justify-between gap-3">
                  <SkeletonText width="w-40" />
                  <SkeletonLabel width="w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : notFound ? (
        <div className="ui-card animate-step-in">
          <p className="text-sm text-neutral-600">Brodern hittades inte.</p>
        </div>
      ) : (
        <div className="animate-step-in">
          <dl className="ui-card mb-4">
            <div className="ui-entry flex items-baseline justify-between gap-4">
              <dt className="ui-label mb-0">Närvaro sedan senaste utmärkelse</dt>
              <dd className="shrink-0 font-semibold text-neutral-900">
                {sinceLastAchievementCount ?? "—"}
              </dd>
            </div>

            {data?.lastAchievementAt ? (
              <div className="ui-entry flex items-baseline justify-between gap-4">
                <dt className="ui-label mb-0">Senaste utmärkelse</dt>
                <dd className="shrink-0 text-sm text-neutral-900">
                  {formatDate(data.lastAchievementAt)}
                </dd>
              </div>
            ) : null}

            <div className="ui-entry flex items-baseline justify-between gap-4">
              <dt className="ui-label mb-0">Totalt deltagna möten</dt>
              <dd className="shrink-0 font-semibold text-neutral-900">
                {totalMeetingsCount ?? "—"}
              </dd>
            </div>

            <div className="ui-entry flex items-baseline justify-between gap-4">
              <dt className="ui-label mb-0">Möten efter grad 8</dt>
              <dd className="shrink-0 font-semibold text-neutral-900">
                {meetingsAfterGrade8Count ?? "—"}
              </dd>
            </div>

            <div className="ui-entry flex items-baseline justify-between gap-4">
              <dt>
                <span className="ui-label mb-0">Poängräknare</span>
                <span className="mt-0.5 block text-xs text-neutral-500">
                  år som broder + möten totalt + möten efter grad 8
                </span>
              </dt>
              <dd className="shrink-0 font-semibold text-neutral-900">
                {score ?? "—"}
              </dd>
            </div>
          </dl>

          <div className="ui-card">
            <h2 className="ui-chapter mb-4">Deltagna möten</h2>
            {events.length === 0 ? (
              <p className="text-sm text-neutral-600">Inga registrerade möten</p>
            ) : (
              <ul>
                {events.map((event) => (
                  <li
                    key={event.id}
                    className="ui-entry flex items-baseline justify-between gap-3"
                  >
                    <Link to={`/events/${event.id}`} className="ui-link text-sm">
                      {event.title}
                    </Link>
                    <span className="shrink-0 text-xs text-neutral-600">
                      {formatEventDate(event.startDate)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
};
