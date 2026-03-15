import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { EventDetailEditForm, EventDetailView } from "../components/events";
import type { EventFormState } from "../components/events/EventDetailEditForm";
import { Button, PageContainer } from "../components";
import { useAuth, useError } from "../context";
import useFetch from "../hooks/useFetch";
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
  linkLodgeEvent,
  listEventAttendances,
  listEventLodges,
  patchEventAttendance,
  setFood,
  setRsvp,
  unlinkLodgeEvent,
  updateEvent,
} from "../services/events";
import type {
  EventMutationResult,
  PatchEventAttendanceResult,
  SetFoodResult,
  SetRsvpResult,
} from "../services/events";
import { listLodges } from "../services/lodges";
import type {
  Event as EventRecord,
  EventAttendanceRow,
  Lodge,
  UpdateEventPayload,
} from "../types";

type AttendanceField = "rsvp" | "bookFood" | "attended" | "paymentPaid";

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
  const { run, data: event } = useFetch<EventRecord | null>();
  const { run: runAction, loading: saving } = useFetch<
    EventMutationResult | SetRsvpResult | SetFoodResult | PatchEventAttendanceResult | void
  >();
  const { run: runLodges, data: lodges } = useFetch<Lodge[]>();
  const { run: runLinked } = useFetch<Lodge[]>();
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
  const [originalLinkedIds, setOriginalLinkedIds] = useState<number[]>([]);
  const [linkedIds, setLinkedIds] = useState<number[]>([]);
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
      runLinked(async () => {
        const linked = await listEventLodges(eventId);
        const parsedIds = linked
          .map((lodge) => Number(lodge.id))
          .filter((value) => Number.isFinite(value));
        setOriginalLinkedIds(parsedIds);
        setLinkedIds(parsedIds);
        return linked;
      }).catch(() => {
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
  }, [event, runAttendances, runFoodFetch, runLinked, runLodges, runRsvpFetch]);

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
        price: form.price ? Number(form.price) : undefined,
        lodgeMeeting: form.lodgeMeeting,
      };

      await runAction(() => updateEvent(id, payload));

      const toAdd = linkedIds.filter(
        (lodgeId) => !originalLinkedIds.includes(lodgeId),
      );
      const toRemove = originalLinkedIds.filter(
        (lodgeId) => !linkedIds.includes(lodgeId),
      );

      if (toAdd.length > 0 || toRemove.length > 0) {
        await runAction(async () => {
          await Promise.all([
            ...toAdd.map((lodgeId) => linkLodgeEvent(eventId, lodgeId)),
            ...toRemove.map((lodgeId) => unlinkLodgeEvent(eventId, lodgeId)),
          ]);
        });
      }

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
        }
        return fetchedEvent;
      });

      navigate(`/events/${id}`);
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
        <Link to=".." relative="path" className="ui-link">
          ← Tillbaka
        </Link>
        {canEdit && !isEditRoute && (
          <Button className="ui-btn-primary">
            <Link to={`/events/${id}/edit`}>Redigera</Link>
          </Button>
        )}
      </div>

      {event ? (
        <div className="ui-card">
          {isEditRoute && canEdit ? (
            <EventDetailEditForm
              form={form}
              setForm={setForm}
              lodges={lodges}
              linkedIds={linkedIds}
              setLinkedIds={setLinkedIds}
              onSave={handleSave}
              onDelete={handleDeleteEvent}
              isAdmin={isAdmin}
              saving={saving}
              errors={formErrors}
              canSubmit={canSave}
              clearServerField={clearServerField}
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
              originalLinkedIds={originalLinkedIds}
              isAdmin={isAdmin}
              attendancesLoading={attendancesLoading}
              attendances={attendances}
              attendanceSavingUid={attendanceSavingUid}
              onAttendanceToggle={handleAttendanceToggle}
              hasStarted={hasStarted}
            />
          )}
        </div>
      ) : (
        <div className="text-neutral-600">Ingen mötesdata</div>
      )}
    </PageContainer>
  );
};
