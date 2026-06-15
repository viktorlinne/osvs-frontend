import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { EventDetailEditForm, EventDetailView } from "../components/events";
import type { EventFormState } from "../components/events/EventDetailEditForm";
import { NotFoundPanel, PageContainer } from "../components";
import { useAuth, useError } from "../context";
import useFetch from "../hooks/useFetch";
import useEventAudience from "../hooks/useEventAudience";
import {
  isEventStartedNowStockholm,
  isMoreThan48HoursFromNowStockholm,
  formatEventDisplayDate,
  toEventDateInputValue,
} from "./events/dateUtils";
import { getApiErrorMessage, getApiFieldErrors } from "../utils/apiErrors";
import { getEventFormErrors } from "../utils/formValidation";
import {
  deleteEvent,
  getEvent,
  getFood,
  getRsvp,
  listEventAttendances,
  patchEventAttendance,
  setFood,
  setRsvp,
  updateEvent,
} from "../services/events";
import type {
  EventMutationResult,
  PatchEventAttendanceResult,
  SetFoodResult,
  SetRsvpResult,
} from "../services/events";
import { listGroups } from "../services/groups";
import { listLodges } from "../services/lodges";
import type {
  Event as EventRecord,
  EventAttendanceRow,
  Group,
  Lodge,
  UpdateEventPayload,
} from "../types";

import { normalizeNumericIds } from "../utils/normalizeNumericIds";

type AttendanceField = "rsvp" | "bookFood" | "attended" | "paymentPaid";

function normalizeSelection(values?: number[] | null): string[] {
  return Array.from(
    new Set(
      (values ?? [])
        .map((value) => String(value))
        .filter((value) => value.trim().length > 0),
    ),
  );
}

function hasBookFoodResult(
  value:
    | EventMutationResult
    | SetRsvpResult
    | SetFoodResult
    | PatchEventAttendanceResult
    | void,
): value is SetFoodResult {
  return Boolean(value && typeof value === "object" && "bookFood" in value);
}

function hasAttendanceRowResult(
  value:
    | EventMutationResult
    | SetRsvpResult
    | SetFoodResult
    | PatchEventAttendanceResult
    | void,
): value is PatchEventAttendanceResult {
  return Boolean(value && typeof value === "object" && "row" in value);
}

export const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { run, data: event, loading: eventLoading, notFound: eventNotFound } = useFetch<EventRecord | null>();
  const { run: runAction, loading: saving } = useFetch<
    EventMutationResult | SetRsvpResult | SetFoodResult | PatchEventAttendanceResult | void
  >();
  const {
    run: runLodges,
    data: lodges,
    loading: lodgesLoading,
  } = useFetch<Lodge[]>();
  const {
    run: runGroups,
    data: groups,
    loading: groupsLoading,
  } = useFetch<Group[]>();
  const { run: runRsvpFetch, loading: rsvpLoading } = useFetch<string | null>();
  const { run: runFoodFetch, loading: foodLoading } = useFetch<boolean | null>();
  const {
    run: runAttendances,
    data: attendances,
    setData: setAttendancesData,
    loading: attendancesLoading,
  } = useFetch<EventAttendanceRow[]>();

  const { setError: setGlobalError, clearError: clearGlobalError } = useError();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isEditRoute = location.pathname.endsWith("/edit");
  const canEdit = Boolean(
    user && (user.roles ?? []).some((r) => ["Admin", "Editor"].includes(r)),
  );
  const isAdmin = Boolean(
    user && (user.roles ?? []).some((r) => r === "Admin"),
  );

  const [form, setForm] = useState<EventFormState>({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    price: "",
    lodgeMeeting: false,
  });
  const [selectedLodgeIds, setSelectedLodgeIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null);
  const [bookFoodStatus, setBookFoodStatus] = useState<boolean | null>(null);
  const [attendanceSavingUid, setAttendanceSavingUid] = useState<number | null>(
    null,
  );
  const clientErrors = getEventFormErrors(form);
  const formErrors = { ...serverErrors, ...clientErrors };
  const canSave = Object.keys(clientErrors).length === 0;
  const hasStarted = isEventStartedNowStockholm(event?.startDate);
  const selectedLodgeId = useMemo(() => {
    const firstValue = selectedLodgeIds[0];
    const parsed = Number(firstValue);
    return Number.isFinite(parsed) ? parsed : null;
  }, [selectedLodgeIds]);

  const {
    users,
    lodgeUsers,
    usersLoading,
    userQuery,
    setUserQuery,
  } = useEventAudience({
    enabled: isEditRoute && canEdit,
    selectedLodgeId,
  });

  const canRsvp = isMoreThan48HoursFromNowStockholm(event?.startDate);
  const authUserId = Number(user?.matrikelnummer);
  const isUserInvitedToEvent =
    Number.isFinite(authUserId) &&
    Array.isArray(attendances) &&
    attendances.some((row) => Number(row.uid) === authUserId);
  const canShowRsvpButtons = Boolean(user) && isUserInvitedToEvent && canRsvp;

  const canBookFood = (() => {
    if (!event?.food || !event?.startDate || rsvpStatus !== "going") {
      return false;
    }
    return !isEventStartedNowStockholm(event.startDate);
  })();

  function clearServerField(field: string) {
    setServerErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  useEffect(() => {
    if (!id) {
      setGlobalError("Saknar mötes-id");
      return;
    }

    run(async () => {
      const fetchedEvent = await getEvent(id);
      if (fetchedEvent) {
        setForm({
          title: fetchedEvent.title ?? "",
          description: fetchedEvent.description ?? "",
          startDate: toEventDateInputValue(fetchedEvent.startDate),
          endDate: toEventDateInputValue(fetchedEvent.endDate),
          price: fetchedEvent.price != null ? String(fetchedEvent.price) : "",
          lodgeMeeting: Boolean(fetchedEvent.lodgeMeeting),
        });
        setSelectedLodgeIds(normalizeSelection(fetchedEvent.lodgeIds));
        setSelectedGroupIds(normalizeSelection(fetchedEvent.groupIds));
        setSelectedUserIds(normalizeSelection(fetchedEvent.userIds));
      }
      return fetchedEvent;
    }).catch(() => {
      // useFetch handles global error presentation
    });
  }, [id, run, setGlobalError]);

  useEffect(() => {
    if (!event) return;

    const eventId = Number(event.id);
    if (!Number.isFinite(eventId)) return;

    const requests: Array<Promise<unknown>> = [
      runLodges(() => listLodges()).catch(() => {
        // useFetch handles global error presentation
      }),
      runGroups(() => listGroups()).catch(() => {
        // useFetch handles global error presentation
      }),
      runRsvpFetch(async () => {
        const status = await getRsvp(eventId);
        setRsvpStatus(status);
        return status;
      }).catch(() => {
        // useFetch handles global error presentation
      }),
      runAttendances(() => listEventAttendances(eventId)).catch(() => {
        // useFetch handles global error presentation
      }),
    ];

    if (isEditRoute && canEdit) {
      // audience users load via useEventAudience
    }

    if (event.food) {
      requests.push(
        runFoodFetch(async () => {
          const bookFood = await getFood(eventId);
          setBookFoodStatus(bookFood);
          return bookFood;
        }).catch(() => {
          // useFetch handles global error presentation
        }),
      );
    } else {
      setBookFoodStatus(null);
    }

    void Promise.all(requests);
  }, [
    canEdit,
    event,
    isEditRoute,
    runAttendances,
    runFoodFetch,
    runGroups,
    runLodges,
    runRsvpFetch,
  ]);

  async function handleSave() {
    if (!id) {
      setGlobalError("Saknar mötes-id");
      return;
    }

    const eventId = Number(id);
    if (!Number.isFinite(eventId)) {
      setGlobalError("Saknar mötes-id");
      return;
    }

    clearGlobalError();
    setServerErrors({});

    if (Object.keys(clientErrors).length > 0) {
      return;
    }

    try {
      const payload: UpdateEventPayload = {
        title: form.title,
        description: form.description,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        price: form.price !== "" && Number.isFinite(Number(form.price)) ? Number(form.price) : undefined,
        lodgeMeeting: form.lodgeMeeting,
        lodgeIds: normalizeNumericIds(selectedLodgeIds),
        groupIds: normalizeNumericIds(selectedGroupIds),
        userIds: normalizeNumericIds(selectedUserIds),
      };

      await runAction(() => updateEvent(id, payload));

      await run(async () => {
        const fetchedEvent = await getEvent(id);
        if (fetchedEvent) {
          setForm({
            title: fetchedEvent.title ?? "",
            description: fetchedEvent.description ?? "",
            startDate: toEventDateInputValue(fetchedEvent.startDate),
            endDate: toEventDateInputValue(fetchedEvent.endDate),
            price: fetchedEvent.price != null ? String(fetchedEvent.price) : "",
            lodgeMeeting: Boolean(fetchedEvent.lodgeMeeting),
          });
          setSelectedLodgeIds(normalizeSelection(fetchedEvent.lodgeIds));
          setSelectedGroupIds(normalizeSelection(fetchedEvent.groupIds));
          setSelectedUserIds(normalizeSelection(fetchedEvent.userIds));
        }
        return fetchedEvent;
      });

      navigate(`/events/${eventId}`);
    } catch (error: unknown) {
      const fields = getApiFieldErrors(error);
      if (fields) {
        setServerErrors(fields);
        return;
      }

      setGlobalError(getApiErrorMessage(error) ?? "Misslyckades att spara mötet");
    }
  }

  async function handleDeleteEvent() {
    if (!id || !isAdmin) return;

    const eventId = Number(id);
    if (!Number.isFinite(eventId)) {
      setGlobalError("Saknar mötes-id");
      return;
    }

    const confirmed = window.confirm(
      "Är du säker på att du vill radera mötet?",
    );
    if (!confirmed) return;

    try {
      await runAction(() => deleteEvent(eventId));
      navigate("/events");
    } catch {
      setGlobalError("Misslyckades att radera mötet");
    }
  }

  async function handleRsvp(status: "going" | "not-going") {
    if (!event) return;

    const eventId = Number(event.id);
    if (!Number.isFinite(eventId)) return;

    try {
      await runAction(() => setRsvp(eventId, status));
      setRsvpStatus(status);
      if (status !== "going") setBookFoodStatus(false);
      await runAttendances(() => listEventAttendances(eventId));
    } catch {
      setGlobalError("Misslyckades att uppdatera osa");
    }
  }

  async function handleBookFood(value: boolean) {
    if (!event) return;
    const eventId = Number(event.id);
    if (!Number.isFinite(eventId)) return;

    try {
      const response = await runAction(() => setFood(eventId, value));
      setBookFoodStatus(
        hasBookFoodResult(response) && typeof response.bookFood === "boolean"
          ? response.bookFood
          : value,
      );
      await runAttendances(() => listEventAttendances(eventId));
    } catch {
      setGlobalError("Misslyckades att uppdatera matbokningen");
    }
  }

  async function handleAttendanceToggle(
    uid: number,
    field: AttendanceField,
    value: boolean,
  ) {
    if (!event || !isAdmin) return;

    const eventId = Number(event.id);
    if (!Number.isFinite(eventId)) return;

    setAttendanceSavingUid(uid);
    setAttendancesData((prev) => {
      if (!Array.isArray(prev)) return prev;
      return prev.map((row) => {
        if (row.uid !== uid) return row;
        const next = { ...row, [field]: value } as EventAttendanceRow;
        if (field === "rsvp" && !value) next.bookFood = false;
        if (field === "paymentPaid") {
          next.paymentStatus = value ? "Paid" : "Pending";
        }
        return next;
      });
    });

    try {
      const payload = { [field]: value } as {
        [K in AttendanceField]?: boolean;
      };
      const response = await runAction(() =>
        patchEventAttendance(eventId, uid, payload),
      );
      const row = hasAttendanceRowResult(response) ? response.row : null;
      if (row) {
        setAttendancesData((prev) => {
          if (!Array.isArray(prev)) return prev;
          return prev.map((item) => (item.uid === uid ? row : item));
        });
      } else {
        await runAttendances(() => listEventAttendances(eventId));
      }
    } catch {
      setGlobalError("Misslyckades att uppdatera närvaron");
      await runAttendances(() => listEventAttendances(eventId)).catch(() => {
        // useFetch handles global error presentation
      });
    } finally {
      setAttendanceSavingUid(null);
    }
  }

  return (
    <PageContainer size="xl" className="ui-page">
      {!isEditRoute && (
        <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to=".." relative="path" className="ui-link">
            ← Tillbaka
          </Link>
          {canEdit && (
            <Link to={`/events/${id}/edit`} className="ui-btn ui-btn-primary">
              Redigera
            </Link>
          )}
        </div>
      )}

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {eventLoading ? "Laddar möte" : event ? "Möte laddat" : "Mötet hittades inte"}
      </p>

      {eventLoading ? (
        <div className="ui-card" aria-busy="true" aria-label="Laddar möte">
          <div className="h-8 w-3/5 rounded skeleton-shimmer" />
          <div className="mt-3 h-4 w-44 rounded skeleton-shimmer" />
          <div className="mt-4 space-y-2">
            <div className="h-4 w-full rounded skeleton-shimmer" />
            <div className="h-4 w-5/6 rounded skeleton-shimmer" />
            <div className="h-4 w-2/3 rounded skeleton-shimmer" />
          </div>
        </div>
      ) : event ? (
        <div className="ui-card animate-step-in">
          {isEditRoute && canEdit ? (
            <EventDetailEditForm
              form={form}
              setForm={setForm}
              lodges={lodges}
              groups={groups}
              users={users}
              lodgeUsers={lodgeUsers}
              selectedLodgeIds={selectedLodgeIds}
              setSelectedLodgeIds={setSelectedLodgeIds}
              selectedGroupIds={selectedGroupIds}
              setSelectedGroupIds={setSelectedGroupIds}
              selectedUserIds={selectedUserIds}
              setSelectedUserIds={setSelectedUserIds}
              onSave={handleSave}
              onDelete={handleDeleteEvent}
              isAdmin={isAdmin}
              saving={saving}
              errors={formErrors}
              canSubmit={canSave}
              clearServerField={clearServerField}
              lodgesLoading={lodgesLoading}
              groupsLoading={groupsLoading}
              usersLoading={usersLoading}
              userSearchQuery={userQuery}
              onUserSearchQueryChange={setUserQuery}
            />
          ) : (
            <EventDetailView
              event={event}
              userCanRsvp={canShowRsvpButtons}
              onRsvp={handleRsvp}
              userCanBookFood={Boolean(user && canBookFood)}
              onBookFood={handleBookFood}
              saving={saving}
              rsvpLoading={rsvpLoading}
              rsvpStatus={rsvpStatus}
              foodLoading={foodLoading}
              bookFoodStatus={bookFoodStatus}
              formatDisplayDate={formatEventDisplayDate}
              lodges={lodges}
              eventLodgeIds={event.lodgeIds ?? []}
              groups={groups}
              eventGroupIds={event.groupIds ?? []}
              isAdmin={isAdmin}
              attendancesLoading={attendancesLoading}
              attendances={attendances}
              attendanceSavingUid={attendanceSavingUid}
              onAttendanceToggle={handleAttendanceToggle}
              hasStarted={hasStarted}
            />
          )}
        </div>
      ) : eventNotFound || !event ? (
        <NotFoundPanel
          title="Mötet hittades inte"
          description="Kontrollera länken eller gå tillbaka till möteslistan."
          backTo="/events"
          backLabel="Till möteslistan"
        />
      ) : null}
    </PageContainer>
  );
};
