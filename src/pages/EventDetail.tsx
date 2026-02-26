import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { EventDetailEditForm, EventDetailView } from "../components/events";
import type { EventFormState } from "../components/events/EventDetailEditForm";
import { useAuth, useError } from "../context";
import useFetch from "../hooks/useFetch";
import { formatEventDisplayDate, toEventDateInputValue } from "./events/dateUtils";
import {
  getEvent,
  getEventStats,
  getRsvp,
  linkLodgeEvent,
  listEventLodges,
  setRsvp,
  unlinkLodgeEvent,
  updateEvent,
} from "../services/events";
import { listLodges } from "../services/lodges";
import type { Event as EventRecord, Lodge } from "../types";

type EventStatsData = {
  stats: { invited: number; answered: number; going: number };
};

export const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const {
    run,
    data: event,
  } = useFetch<EventRecord | null>();
  const { run: runAction, loading: saving } = useFetch<unknown>();
  const { run: runLodges, data: lodges } = useFetch<Lodge[]>();
  const { run: runLinked, data: linkedLodges } = useFetch<Lodge[]>();
  const { run: runRsvpFetch, data: rsvpData, loading: rsvpLoading } =
    useFetch<{ rsvp: string | null }>();
  const { run: runStats, data: statsData, loading: statsLoading } =
    useFetch<EventStatsData>();

  const { setError: setGlobalError, clearError: clearGlobalError } = useError();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isEditRoute = location.pathname.endsWith("/edit");
  const canEdit = Boolean(
    user && (user.roles ?? []).some((r) => ["Admin", "Editor"].includes(r))
  );
  const isAdmin = Boolean(user && (user.roles ?? []).some((r) => r === "Admin"));

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

  const canRsvp = (() => {
    if (!event?.startDate) return false;
    const start = new Date(event.startDate);
    if (Number.isNaN(start.getTime())) return false;
    const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
    return start.getTime() - Date.now() > twoDaysMs;
  })();

  useEffect(() => {
    if (!id) {
      setGlobalError("Missing event id");
      return;
    }

    run(async () => {
      const response = await getEvent(id);
      return (response as { event?: EventRecord })?.event ?? null;
    }).catch(() => {
      // useFetch handles global error presentation
    });
  }, [id, run, setGlobalError]);

  useEffect(() => {
    if (!event) return;

    setForm({
      title: event.title ?? "",
      description: event.description ?? "",
      startDate: toEventDateInputValue(event.startDate),
      endDate: toEventDateInputValue(event.endDate),
      price: event.price != null ? String(event.price) : "",
      lodgeMeeting: Boolean(event.lodgeMeeting),
    });
  }, [event, isEditRoute]);

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
        return Array.isArray(linked) ? linked : [];
      }).catch(() => {
        // useFetch handles global error presentation
      }),
      runRsvpFetch(async () => {
        const response = await getRsvp(eventId);
        return response as { rsvp: string | null };
      }).catch(() => {
        // useFetch handles global error presentation
      }),
    ];

    if (isAdmin) {
      requests.push(
        runStats(async () => {
          const response = await getEventStats(eventId);
          return response as EventStatsData;
        }).catch(() => {
          // useFetch handles global error presentation
        }),
      );
    }

    void Promise.all(requests);
  }, [event, isAdmin, runLinked, runLodges, runRsvpFetch, runStats]);

  useEffect(() => {
    const linked = Array.isArray(linkedLodges) ? linkedLodges : [];
    const parsedIds = linked
      .map((lodge) => Number(lodge.id))
      .filter((value) => Number.isFinite(value));

    setOriginalLinkedIds(parsedIds);
    setLinkedIds(parsedIds);

    if (rsvpData && typeof rsvpData === "object") {
      setRsvpStatus((rsvpData as { rsvp?: string | null }).rsvp ?? null);
    }
  }, [linkedLodges, rsvpData]);

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

      const toAdd = linkedIds.filter((lodgeId) => !originalLinkedIds.includes(lodgeId));
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
        return (response as { event?: EventRecord }).event ?? null;
      });

      navigate(`/events/${id}`);
    } catch {
      setGlobalError("Failed to save event");
    }
  }

  async function handleRsvp(status: "going" | "not-going") {
    if (!event) return;

    const eventId = Number(event.id);
    if (!Number.isFinite(eventId)) return;

    try {
      await runAction(() => setRsvp(eventId, status));
      setRsvpStatus(status);
    } catch {
      setGlobalError("Failed to set RSVP");
    }
  }


  return (
    <div className="max-w-3xl w-full mx-auto p-6 min-h-screen">
      <div className="flex items-center justify-between">
        <Link
          to=".."
          relative="path"
          className="text-sm text-green-600 hover:text-green-700 hover:underline"
        >
          ← Tillbaka
        </Link>
        {canEdit && !isEditRoute && (
          <Link
            to={`/events/${id}/edit`}
            className="text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition px-3 py-2 rounded-md"
          >
            Redigera
          </Link>
        )}
      </div>

      <h2 className="text-2xl font-bold mt-4 mb-4">Möte</h2>

      {event ? (
        <div className="bg-white p-4 rounded-md shadow">
          {isEditRoute && canEdit ? (
            <EventDetailEditForm
              form={form}
              setForm={setForm}
              lodges={lodges}
              linkedIds={linkedIds}
              setLinkedIds={setLinkedIds}
              onSave={handleSave}
              saving={saving}
              cancelTo={`/events/${id}`}
            />
          ) : (
            <EventDetailView
              event={event}
              userCanRsvp={Boolean(user && canRsvp)}
              onRsvp={handleRsvp}
              saving={saving}
              rsvpLoading={rsvpLoading}
              rsvpStatus={rsvpStatus}
              formatDisplayDate={formatEventDisplayDate}
              lodges={lodges}
              originalLinkedIds={originalLinkedIds}
              isAdmin={isAdmin}
              statsLoading={statsLoading}
              statsData={statsData}
            />
          )}
        </div>
      ) : (
        <div className="text-gray-500">Ingen mötesdata</div>
      )}
    </div>
  );
};
