import { Link } from "react-router-dom";
import { SkeletonLabel, SkeletonText } from "./PageSkeleton";
import type { AttendedEvent } from "../types";
import { formatEventDisplayDate } from "../pages/events/dateUtils";

type AttendedEventsViewProps = {
  loading: boolean;
  notFound: boolean;
  notFoundMessage: string;
  events: AttendedEvent[];
  sinceLastAchievementCount: number | null;
  totalMeetingsCount: number | null;
  meetingsAfterGrade8Count: number | null;
  score: number | null;
  lastAchievementAt?: string | null;
  sinceLastAchievementLabel?: string;
  emptyEventsMessage?: string;
};

export function AttendedEventsView({
  loading,
  notFound,
  notFoundMessage,
  events,
  sinceLastAchievementCount,
  totalMeetingsCount,
  meetingsAfterGrade8Count,
  score,
  lastAchievementAt = null,
  sinceLastAchievementLabel = "Möten sedan senaste utmärkelse",
  emptyEventsMessage = "Inga deltagna möten hittades.",
}: AttendedEventsViewProps) {
  if (loading) {
    return (
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
    );
  }

  if (notFound) {
    return (
      <div className="ui-card animate-step-in">
        <p className="text-sm text-neutral-600">{notFoundMessage}</p>
      </div>
    );
  }

  return (
    <div className="animate-step-in">
      <dl className="ui-card mb-4">
        <div className="ui-entry flex items-baseline justify-between gap-4">
          <dt className="ui-label mb-0">{sinceLastAchievementLabel}</dt>
          <dd className="shrink-0 font-semibold text-neutral-900">
            {sinceLastAchievementCount ?? "—"}
          </dd>
        </div>

        {lastAchievementAt ? (
          <div className="ui-entry flex items-baseline justify-between gap-4">
            <dt className="ui-label mb-0">Senaste utmärkelse</dt>
            <dd className="shrink-0 text-sm text-neutral-900">
              {formatEventDisplayDate(lastAchievementAt)}
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
          <dd className="shrink-0 font-semibold text-neutral-900">{score ?? "—"}</dd>
        </div>
      </dl>

      <div className="ui-card">
        <h2 className="ui-chapter mb-4">Deltagna möten</h2>
        {events.length === 0 ? (
          <p className="text-sm text-neutral-600">{emptyEventsMessage}</p>
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
                  {formatEventDisplayDate(event.startDate)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default AttendedEventsView;
