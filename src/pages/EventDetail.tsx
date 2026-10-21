import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { EventDetailEditForm, EventDetailView } from "../components/events";
import type { EventFormState } from "../components/events/EventDetailEditForm";
import { NotFoundPanel, PageContainer, useConfirm } from "../components";
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
  getRegistration,
  listEventAttendances,
  patchEventAttendance,
  saveRegistration,
  updateEvent,
} from "../services/events";
import type {
  EventMutationResult,
  EventRegistration,
  PatchEventAttendanceResult,
  SaveEventRegistrationBody,
  SaveEventRegistrationResult,
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
import { SkeletonBlock } from "../components/PageSkeleton";

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

type ActionResult =
  | EventMutationResult
  | SaveEventRegistrationResult
  | PatchEventAttendanceResult
  | void;

function hasAttendanceRowResult(
  value: ActionResult,
): value is PatchEventAttendanceResult {
  return Boolean(value && typeof value === "object" && "row" in value);
}

export const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { run, data: event, loading: eventLoading, notFound: eventNotFound } = useFetch<EventRecord | null>();
  const { run: runAction, loading: saving } = useFetch<ActionResult>();
  const { confirm, confirmDialog } = useConfirm();
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
  const {
    run: runRegistrationFetch,
    data: registration,
    setData: setRegistration,
    loading: registrationLoading,
  } = useFetch<EventRegistration>();
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
  const [registrationErrors, setRegistrationErrors] = useState<
    Record<string, string>
  >({});
  const [attendanceSavingUid, setAttendanceSavingUid] = useState<number | null>(
    null,
  );
  const clientErrors = getEventFormErrors(form);
  const formErrors = { ...serverErrors, ...clientErrors };
  const canSave = Object.keys(clientErrors).length === 0;
  const hasStarted = isEventStartedNowStockholm(event?.startDate);
  const selectedLodgeNumericIds = useMemo(
    () =>
      selectedLodgeIds
        .map((value) => Number(value))
        .filter((id) => Number.isFinite(id) && id > 0),
    [selectedLodgeIds],
  );

  const {
    users,
    lodgeUsers,
    usersLoading,
    userQuery,
    setUserQuery,
  } = useEventAudience({
    enabled: isEditRoute && canEdit,
    selectedLodgeIds: selectedLodgeNumericIds,
  });

  const canRsvp = isMoreThan48HoursFromNowStockholm(event?.startDate);
  const authUserId = Number(user?.matrikelnummer);
  const isUserInvitedToEvent =
    Number.isFinite(authUserId) &&
    Array.isArray(attendances) &&
    attendances.some((row) => Number(row.uid) === authUserId);
  // The registration flow is open while the member may still OSA
  // (existing rule: more than 48 hours before start).
  const canChangeRegistration =
    Boolean(user) && isUserInvitedToEvent && canRsvp;
  const showRegistration = Boolean(user) && isUserInvitedToEvent;
  const eventIdForRegistration = Number(event?.id);

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
      runAttendances(() => listEventAttendances(eventId)).catch(() => {
        // useFetch handles global error presentation
      }),
    ];

    if (isEditRoute && canEdit) {
      // audience users load via useEventAudience
    }

    void Promise.all(requests);
  }, [
    canEdit,
    event,
    isEditRoute,
    runAttendances,
    runGroups,
    runLodges,
  ]);

  // Load the member's own registration once we know they are invited
  // (the endpoint answers 403 for members who are not invited).
  useEffect(() => {
    if (!showRegistration || !Number.isFinite(eventIdForRegistration)) return;
    runRegistrationFetch(() => getRegistration(eventIdForRegistration)).catch(
      () => {
        // useFetch handles global error presentation
      },
    );
  }, [eventIdForRegistration, runRegistrationFetch, showRegistration]);

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

    const confirmed = await confirm({
      title: "Radera mötet?",
      description: event?.title
        ? `”${event.title}” raderas permanent. Det går inte att ångra.`
        : "Mötet raderas permanent. Det går inte att ångra.",
      confirmLabel: "Radera",
    });
    if (!confirmed) return;

    try {
      await runAction(() => deleteEvent(eventId));
      navigate("/events");
    } catch {
      setGlobalError("Misslyckades att radera mötet");
    }
  }

  async function handleConfirmRegistration(
    payload: SaveEventRegistrationBody,
  ): Promise<boolean> {
    if (!event) return false;
    const eventId = Number(event.id);
    if (!Number.isFinite(eventId)) return false;

    setRegistrationErrors({});
    try {
      const response = await runAction(() => saveRegistration(eventId, payload));
      if (response && "registration" in response) {
        setRegistration(response.registration);
      }
      await runAttendances(() => listEventAttendances(eventId)).catch(() => {
        // useFetch handles global error presentation
      });
      return true;
    } catch (error: unknown) {
      const fields = getApiFieldErrors(error);
      if (fields) {
        setRegistrationErrors(fields);
        return false;
      }
      setGlobalError(
        getApiErrorMessage(error) ?? "Misslyckades att spara anmälan",
      );
      return false;
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
      if (uid === authUserId) {
        await runRegistrationFetch(() => getRegistration(eventId)).catch(() => {
          // useFetch handles global error presentation
        });
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
          <SkeletonBlock className="h-8 w-3/5" />
          <SkeletonBlock className="mt-3 h-4 w-44" />
          <div className="mt-4 space-y-2">
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-5/6" />
            <SkeletonBlock className="h-4 w-2/3" />
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
              showRegistration={showRegistration}
              registration={registration}
              registrationLoading={registrationLoading}
              canChangeRegistration={canChangeRegistration}
              registrationErrors={registrationErrors}
              onConfirmRegistration={handleConfirmRegistration}
              saving={saving}
              formatDisplayDate={formatEventDisplayDate}
              lodges={lodges}
              eventLodgeIds={event.lodgeIds ?? []}
              groups={groups}
              eventGroupIds={event.groupIds ?? []}
              isAdmin={isAdmin}
              canManageGroups={canEdit}
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
      {confirmDialog}
    </PageContainer>
  );
};
