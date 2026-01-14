import { useEffect, useState } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { Spinner } from "../components";
import useFetch from "../hooks/useFetch";
import { useError, useAuth } from "../context";
import type { Event as EventRecord, Lodge } from "../types";
import {
  getEvent,
  updateEvent,
  listEventLodges,
  listLodges,
} from "../services";

function formatDisplayDate(s?: string) {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return String(s);
  const parts = new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).formatToParts(d);
  return parts
    .map((p) =>
      p.type === "month"
        ? p.value.charAt(0).toUpperCase() + p.value.slice(1)
        : p.value
    )
    .join("");
}

function toDateInputValue(s?: string) {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return String(s).slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const {
    run,
    loading,
    data: event,
  } = useFetch<EventRecord | null>();
  const { run: runAction, loading: saving } = useFetch<unknown>();
  const { run: runLodges, data: lodges } = useFetch<Lodge[]>();
  const { run: runLinked, data: linkedLodges } = useFetch<Lodge[]>();
  const { setError: setGlobalError, clearError: clearGlobalError } = useError();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isEditRoute = location.pathname.endsWith("/edit");
  const canEdit = Boolean(
    user && (user.roles ?? []).some((r) => ["Admin", "Editor"].includes(r))
  );

  const [form, setForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    price: "",
    lodgeMeeting: false,
  });
  const [originalLinkedIds, setOriginalLinkedIds] = useState<number[]>([]);

  useEffect(() => {
    if (!id) return setGlobalError("Missing event id");
    run(async () => {
      const resp = await getEvent(id);
      // service returns { event }
      const ev = (resp as { event?: EventRecord })?.event ?? null;
      return ev as EventRecord | null;
    }).catch(() => {
      /* ignore - useFetch sets global error */
    });
  }, [id, run, setGlobalError]);

  // initialize form whenever the event changes or when entering edit mode
  useEffect(() => {
    if (!event) return;
    Promise.resolve().then(() =>
      setForm({
        title: event.title ?? "",
        description: event.description ?? "",
        startDate: toDateInputValue(event.startDate),
        endDate: toDateInputValue(event.endDate),
        price: event.price != null ? String(event.price) : "",
        lodgeMeeting: Boolean(event.lodgeMeeting),
      })
    );
  }, [event, isEditRoute]);

  // load lodges and which are linked to this event when editing
  useEffect(() => {
    if (!event) return;
    void Promise.all([
      runLodges(() => listLodges()).catch(() => {
        /* swallow; useFetch handles errors */
      }),
      runLinked(async () => {
        const linkedResp = await listEventLodges(event.id as unknown as number);
        const linked = (linkedResp as { lodges?: Lodge[] })?.lodges ?? linkedResp ?? [];
        return Array.isArray(linked) ? linked : [];
      }).catch(() => {
        /* swallow */
      }),
    ]);
  }, [event, runLodges, runLinked]);

  useEffect(() => {
    const linked = Array.isArray(linkedLodges) ? linkedLodges : [];
    const linkedIds = linked
      .map((l: Lodge) => Number(l.id))
      .filter((n: number) => Number.isFinite(n));
    Promise.resolve().then(() => setOriginalLinkedIds(linkedIds));
  }, [linkedLodges]);

  async function handleSave() {
    if (!id) return setGlobalError("Missing event id");
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
      // Lodges are no longer edited here; only update event data
      // re-fetch and navigate back to view
      await run(async () => {
        const resp = await getEvent(id);
        return (resp as { event?: EventRecord })?.event ?? null;
      });
      navigate(`/events/${id}`);
    } catch {
      setGlobalError("Failed to save event");
    }
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Spinner /></div>;

  return (
    <div className="max-w-3xl w-full mx-auto p-6 min-h-screen">
      <div className="flex items-center justify-between">
        <Link to=".." relative="path" className="text-sm text-green-600 underline">
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
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titel</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Beskrivning
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Startdatum
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Slutdatum
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm({ ...form, endDate: e.target.value })
                    }
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Pris</label>
                  <input
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
                <div className="flex items-center gap-x-4 py-2">
                  <input
                    id="lodgeMeeting"
                    type="checkbox"
                    checked={form.lodgeMeeting}
                    onChange={(e) =>
                      setForm({ ...form, lodgeMeeting: e.target.checked })
                    }
                  />
                  <label htmlFor="lodgeMeeting" className="text-sm">
                    Logemöte
                  </label>
                </div>
              </div>

              <div className="flex gap-x-4 py-2">
                <button
                  className="bg-green-600 hover:bg-green-700 text-sm font-medium transition text-white px-4 py-2 rounded-md"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Sparar…" : "Spara"}
                </button>
                <Link
                  to={`/events/${id}`}
                  className="bg-gray-100 hover:bg-gray-200 transition px-4 py-2 rounded-md border"
                >
                  Avbryt
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-2">
                <strong>Titel:</strong> {event.title}
              </div>
              <div className="mb-2">
                <strong>Beskrivning:</strong> {event.description}
              </div>
              <div className="mb-2">
                <strong>Startdatum:</strong>{" "}
                {formatDisplayDate(event.startDate)}
              </div>
              <div className="mb-2">
                <strong>Slutdatum:</strong> {formatDisplayDate(event.endDate)}
              </div>
              <div className="mb-2">
                <strong>Logemöte:</strong> {event.lodgeMeeting ? "Ja" : "Nej"}
              </div>
              <div className="mb-2">
                <strong>Associerade loger:</strong>
                {Array.isArray(lodges) && originalLinkedIds.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-x-4 py-2">
                    {lodges
                      .filter((l) => originalLinkedIds.includes(l.id))
                      .map((l) => (
                        <Link
                          key={l.id}
                          to={`/lodges/${l.id}`}
                          className="text-sm text-green-600 underline mr-2"
                        >
                          {l.name}
                        </Link>
                      ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 mt-1">
                    Inga kopplade loger
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-gray-500">Ingen mötesdata</div>
      )}
    </div>
  );
};
