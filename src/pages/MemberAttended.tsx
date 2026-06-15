import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AttendedEventsView, PageContainer } from "../components";
import useFetch from "../hooks/useFetch";
import { getUserAttendedEvents } from "../services/users";
import type { AttendedEventsResponse } from "../types";

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
  const yearsSinceCreated = data?.createdAt
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

      <AttendedEventsView
        loading={loading}
        notFound={notFound}
        notFoundMessage="Brodern hittades inte."
        events={events}
        sinceLastAchievementCount={sinceLastAchievementCount}
        totalMeetingsCount={totalMeetingsCount}
        meetingsAfterGrade8Count={meetingsAfterGrade8Count}
        score={score}
        lastAchievementAt={data?.lastAchievementAt}
        sinceLastAchievementLabel="Närvaro sedan senaste utmärkelse"
        emptyEventsMessage="Inga registrerade möten."
      />
    </PageContainer>
  );
};
