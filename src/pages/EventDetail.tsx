import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { EventDetailEditForm, EventDetailView } from "../components/events";
import type { EventFormState } from "../components/events/EventDetailEditForm";
import { PageContainer } from "../components";
import { useAuth, useError } from "../context";
import useFetch from "../hooks/useFetch";
import {
  isEventStartedNowStockholm,
  isMoreThan48HoursFromNowStockholm,
  formatEventDisplayDate,
  toEventDateInputValue,
} from "./events/dateUtils";
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
import { listLodges } from "../services/lodges";
import type { Event as EventRecord, EventAttendanceRow, Lodge } from "../types";

type AttendanceField = "rsvp" | "bookFood" | "attended" | "paymentPaid";

export const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { run, data: event } = useFetch<EventRecord | null>();
  const { run: runAction, loading: saving } = useFetch<unknown>();
  const { run: runLodges, data: lodges } = useFetch<Lodge[]>();
  const { run: runLinked } = useFetch<Lodge[]>();
  const { run: runRsvpFetch, loading: rsvpLoading } = useFetch<{
    rsvp: string | null;
  }>();
  const { run: runFoodFetch, loading: foodLoading } = useFetch<{
    bookFood: boolean | null;
  }>();
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
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null);
  const [bookFoodStatus, setBookFoodStatus] = useState<boolean | null>(null);
  const [attendanceSavingUid, setAttendanceSavingUid] = useState<number | null>(
    null,
  );
  const hasStarted = isEventStartedNowStockholm(event?.startDate);

  const canRsvp = isMoreThan48HoursFromNowStockholm(event?.startDate);

  const canBookFood = (() => {
    if (!event?.food || !event?.startDate || rsvpStatus !== "going") {
      return false;
    }
    return !isEventStartedNowStockholm(event.startDate);
  })();

  useEffect(() => {
    if (!id) {
      setGlobalError("Missing event id");
      return;
    }

    run(async () => {
      const response = await getEvent(id);
      const fetchedEvent = (response as { event?: EventRecord })?.event ?? null;
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

    const requests: Promise<unknown>[] = [
      runLodges(() => listLodges()).catch(() => {
        // useFetch handles global error presentation
      }),
      runLinked(async () => {
        const linkedResp = await listEventLodges(eventId);
        const linked =
          (linkedResp as { lodges?: Lodge[] })?.lodges ?? linkedResp ?? [];
        const linkedArray = Array.isArray(linked) ? linked : [];
        const parsedIds = linkedArray
          .map((lodge) => Number(lodge.id))
          .filter((value) => Number.isFinite(value));
        setOriginalLinkedIds(parsedIds);
        setLinkedIds(parsedIds);
        return linkedArray;
      }).catch(() => {
        // useFetch handles global error presentation
      }),
      runRsvpFetch(async () => {
        const response = await getRsvp(eventId);
        const payload = response as { rsvp: string | null };
        setRsvpStatus(payload.rsvp ?? null);
        return payload;
      }).catch(() => {
        // useFetch handles global error presentation
      }),
      runAttendances(async () => {
        const response = await listEventAttendances(eventId);
        const rows =
          (response as { attendances?: EventAttendanceRow[] })?.attendances ??
          [];
        return Array.isArray(rows) ? rows : [];
      }).catch(() => {
        // useFetch handles global error presentation
      }),
    ];

    if (event.food) {
      requests.push(
        runFoodFetch(async () => {
          const response = await getFood(eventId);
          const payload = response as { bookFood: boolean | null };
          setBookFoodStatus(payload.bookFood ?? null);
          return payload;
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
      setGlobalError("Missing event id");
      return;
    }

    const eventId = Number(id);
    if (!Number.isFinite(eventId)) {
      setGlobalError("Missing event id");
      return;
    }

    clearGlobalError();

    try {
      const payload: Record<string, unknown> = {
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
        const response = await getEvent(id);
        const fetchedEvent =
          (response as { event?: EventRecord }).event ?? null;
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
    } catch {
      setGlobalError("Failed to save event");
    }
  }

  async function handleDeleteEvent() {
    if (!id || !isAdmin) return;

    const eventId = Number(id);
    if (!Number.isFinite(eventId)) {
      setGlobalError("Missing event id");
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
      await runAttendances(async () => {
        const response = await listEventAttendances(eventId);
        const rows =
          (response as { attendances?: EventAttendanceRow[] })?.attendances ??
          [];
        return Array.isArray(rows) ? rows : [];
      });
    } catch {
      setGlobalError("Failed to set RSVP");
    }
  }

  async function handleBookFood(value: boolean) {
    if (!event) return;
    const eventId = Number(event.id);
    if (!Number.isFinite(eventId)) return;

    try {
      const response = await runAction(() => setFood(eventId, value));
      const payload = response as { bookFood?: boolean };
      setBookFoodStatus(
        typeof payload.bookFood === "boolean" ? payload.bookFood : value,
      );
      await runAttendances(async () => {
        const rowsResp = await listEventAttendances(eventId);
        const rows =
          (rowsResp as { attendances?: EventAttendanceRow[] })?.attendances ??
          [];
        return Array.isArray(rows) ? rows : [];
      });
    } catch {
      setGlobalError("Failed to set food booking");
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
      const row = (response as { row?: EventAttendanceRow })?.row;
      if (row) {
        setAttendancesData((prev) => {
          if (!Array.isArray(prev)) return prev;
          return prev.map((item) => (item.uid === uid ? row : item));
        });
      } else {
        await runAttendances(async () => {
          const rowsResp = await listEventAttendances(eventId);
          const rows =
            (rowsResp as { attendances?: EventAttendanceRow[] })?.attendances ??
            [];
          return Array.isArray(rows) ? rows : [];
        });
      }
    } catch {
      setGlobalError("Failed to update attendance");
      await runAttendances(async () => {
        const rowsResp = await listEventAttendances(eventId);
        const rows =
          (rowsResp as { attendances?: EventAttendanceRow[] })?.attendances ??
          [];
        return Array.isArray(rows) ? rows : [];
      }).catch(() => {
        // useFetch handles global error presentation
      });
    } finally {
      setAttendanceSavingUid(null);
    }
  }

  return (
    <PageContainer size="md" className="ui-page">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to=".."
          relative="path"
          className="ui-link"
        >
          ← Tillbaka
        </Link>
        {canEdit && !isEditRoute && (
          <Link
            to={`/events/${id}/edit`}
            className="ui-btn ui-btn-primary ui-btn-sm"
          >
            Redigera
          </Link>
        )}
      </div>

      <h2 className="ui-page-title mb-4 mt-4">Möte</h2>

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
              cancelTo={`/events/${id}`}
            />
          ) : (
            <EventDetailView
              event={event}
              userCanRsvp={Boolean(user && canRsvp)}
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



