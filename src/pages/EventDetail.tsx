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
  getRsvp,
  setRsvp,
  getEventStats,
} from "../services";

function formatDisplayDate(s?: string) {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return String(s);
  const parts = new Intl.DateTimeFormat("sv-SE", {
    minute: "2-digit",
    hour: "2-digit",
    day: "2-digit",
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
  const minute = String(d.getMinutes()).padStart(2, "0");
  const hour = String(d.getHours()).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const y = d.getFullYear();
  return `${y}-${m}-${day}-${hour}:${minute}`;
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
  const { run: runRsvpFetch, data: rsvpData, loading: rsvpLoading } = useFetch<{ rsvp: string | null }>();
  const { run: runStats, data: statsData, loading: statsLoading } = useFetch<{
    stats: { invited: number; answered: number; going: number };
  }>();
  const { setError: setGlobalError, clearError: clearGlobalError } = useError();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isEditRoute = location.pathname.endsWith("/edit");
  const canEdit = Boolean(
    user && (user.roles ?? []).some((r) => ["Admin", "Editor"].includes(r))
  );
  const isAdmin = Boolean(user && (user.roles ?? []).some((r) => r === "Admin"));

  const [form, setForm] = useState({
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
    if (!event || !event.startDate) return false;
    const start = new Date(event.startDate);
    if (Number.isNaN(start.getTime())) return false;
    const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
    return start.getTime() - Date.now() > twoDaysMs;
  })();

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
    // Only fetch stats for admins to avoid 403 global errors for regular users
    const promises: Promise<unknown>[] = [];
    promises.push(
      runLodges(() => listLodges()).catch(() => {
        /* swallow; useFetch handles errors */
      }),
    );
    promises.push(
      runLinked(async () => {
        const linkedResp = await listEventLodges(event.id as unknown as number);
        const linked = (linkedResp as { lodges?: Lodge[] })?.lodges ?? linkedResp ?? [];
        return Array.isArray(linked) ? linked : [];
      }).catch(() => {
        /* swallow */
      }),
    );
    // fetch current user's RSVP for this event
    promises.push(
      runRsvpFetch(async () => {
        const resp = await getRsvp(event.id as unknown as number);
        return resp as { rsvp: string | null };
      }).catch(() => { }),
    );
    // fetch event stats only if user is admin
    if (isAdmin) {
      promises.push(
        runStats(async () => {
          const resp = await getEventStats(event.id as unknown as number);
          return resp as { stats: { invited: number; answered: number; going: number } };
        }).catch(() => { }),
      );
    }

    void Promise.all(promises);

    // computed at component scope
  }, [event, runLodges, runLinked, runRsvpFetch, runStats, user]);

  useEffect(() => {
    const linked = Array.isArray(linkedLodges) ? linkedLodges : [];
    const linkedIds = linked
      .map((l: Lodge) => Number(l.id))
      .filter((n: number) => Number.isFinite(n));
    Promise.resolve().then(() => {
      setOriginalLinkedIds(linkedIds);
      setLinkedIds(linkedIds);
    });
    if (rsvpData && typeof rsvpData === "object") {
      setRsvpStatus((rsvpData as { rsvp?: string | null })?.rsvp ?? null);
    }
  }, [linkedLodges, rsvpData]);

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
      // Update lodge links: add new ones, remove unchecked ones
      const toAdd = linkedIds.filter((lid) => !originalLinkedIds.includes(lid));
      const toRemove = originalLinkedIds.filter((lid) => !linkedIds.includes(lid));
      if (toAdd.length > 0 || toRemove.length > 0) {
        await runAction(async () => {
          const promises: Promise<unknown>[] = [];
          for (const lid of toAdd) promises.push((await import("../services")).linkLodgeEvent(id as unknown as number, lid));
          for (const lid of toRemove) promises.push((await import("../services")).unlinkLodgeEvent(id as unknown as number, lid));
          await Promise.all(promises);
        });
      }
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

  async function handleRsvp(status: "going" | "not-going") {
    if (!event) return;
    try {
      await runAction(() => setRsvp(event.id as unknown as number, status));
      setRsvpStatus(status);
    } catch {
      setGlobalError("Failed to set RSVP");
    }
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Spinner /></div>;

  return (
    <div className="max-w-3xl w-full mx-auto p-6 min-h-screen">
      <div className="flex items-center justify-between">
        <Link to=".." relative="path" className="text-sm text-green-600 hover:text-green-700 hover:underline">
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
                <label htmlFor="title" className="block text-sm font-medium mb-1">Titel</label>
                <input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Kopplade loger</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto border rounded-md p-2">
                  {Array.isArray(lodges) && lodges.length > 0 ? (
                    lodges.map((l) => (
                      <label key={l.id} className="flex items-center gap-x-2">
                        <input
                          type="checkbox"
                          checked={linkedIds.includes(l.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setLinkedIds((prev) =>
                              checked ? Array.from(new Set([...prev, l.id])) : prev.filter((x) => x !== l.id)
                            );
                          }}
                        />
                        <span className="text-sm">{l.name}</span>
                      </label>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">Inga loger att välja</div>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  Beskrivning
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium mb-1">
                    Startdatum
                  </label>
                  <input
                    type="datetime-local"
                    id="startDate"
                    name="startDate"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium mb-1">
                    Slutdatum
                  </label>
                  <input
                    type="datetime-local"
                    id="endDate"
                    name="endDate"
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
                  <label htmlFor="price" className="block text-sm font-medium mb-1">Pris</label>
                  <input
                    id="price"
                    name="price"
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
              {user && canRsvp && (
                <div className="mb-4">
                  <div className="flex items-center gap-x-4 mb-2">
                    <button
                      className={`px-3 py-2 rounded-md text-white ${rsvpStatus === "going" ? "bg-green-600" : "bg-gray-400"}`}
                      onClick={() => handleRsvp("going")}
                      disabled={saving || rsvpLoading}
                    >
                      Kommer
                    </button>
                    <button
                      className={`px-3 py-2 rounded-md text-white ${rsvpStatus === "not-going" ? "bg-red-600" : "bg-gray-400"}`}
                      onClick={() => handleRsvp("not-going")}
                      disabled={saving || rsvpLoading}
                    >
                      Kommer inte
                    </button>
                  </div>
                </div>
              )}
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
                <strong>Pris:</strong> {event.price} kr
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
              {isAdmin && (
                <div className="mb-2">
                  <strong>Statistik:</strong>
                  {statsLoading ? (
                    <div className="text-sm text-gray-500 mt-1">Läser statistik…</div>
                  ) : statsData && statsData.stats ? (
                    <div className="mt-1 text-sm text-gray-700">
                      <div>Inbjudna: {statsData.stats.invited}</div>
                      <div>Besvarat: {statsData.stats.answered}</div>
                      <div>Kommer: {statsData.stats.going}</div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 mt-1">Ingen statistik tillgänglig</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-gray-500">Ingen mötesdata</div>
      )}
    </div>
  );
};
