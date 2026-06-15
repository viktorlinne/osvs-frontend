import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AttendedEventsView, PageContainer } from "../components";
import useFetch from "../hooks/useFetch";
import { getMyAttendedEvents } from "../services/users";
import type { AttendedEventsResponse } from "../types";

export const ProfileAttended = () => {
  const [now] = useState(() => Date.now());
  const { run, data, loading, notFound } = useFetch<AttendedEventsResponse>();

  useEffect(() => {
    run(() => getMyAttendedEvents()).catch(() => {
      // useFetch handles global errors
    });
  }, [run]);

  const events = data?.events ?? [];
  const sinceLastAchievementCount = data?.sinceLastAchievementCount ?? null;
  const totalMeetingsCount = data?.totalMeetingsCount ?? null;
  const meetingsAfterGrade8Count = data?.meetingsAfterGrade8Count ?? null;
  const yearsSinceCreated = data?.createdAt
    ? Math.floor((now - new Date(data.createdAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;
  const score =
    yearsSinceCreated !== null &&
    totalMeetingsCount !== null &&
    meetingsAfterGrade8Count !== null
      ? yearsSinceCreated + totalMeetingsCount + meetingsAfterGrade8Count
      : null;

  return (
    <PageContainer size="md" className="ui-page">
      <Link to="/profile" className="ui-link">
        ← Tillbaka
      </Link>

      <h1 className="ui-section-title mb-6 mt-4">Min närvaro</h1>

      <AttendedEventsView
        loading={loading}
        notFound={notFound}
        notFoundMessage="Närvarodata hittades inte."
        events={events}
        sinceLastAchievementCount={sinceLastAchievementCount}
        totalMeetingsCount={totalMeetingsCount}
        meetingsAfterGrade8Count={meetingsAfterGrade8Count}
        score={score}
      />
    </PageContainer>
  );
};
