import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useError, useAuth } from "../context";
import { createEvent as createEventSvc } from "../services";
import type { CreateEventPayload, Lodge } from "../types";
import { listLodges } from "../services/lodges";
import LodgeSelection from "../components/LodgeSelection";
import useFetch from "../hooks/useFetch";

export const CreateEvent = () => {
  const navigate = useNavigate();
  const { setError: setGlobalError, clearError: clearGlobalError } = useError();
  const { user } = useAuth();
  const canCreate = Boolean(
    user &&
    (user.roles ?? []).some((r: string) => ["Admin", "Editor"].includes(r)),
  );

  const { run: runLodges, data: lodges } = useFetch<Lodge[]>();
  const { run: runSubmit, loading: saving } = useFetch<unknown>();

  const [form, setForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    price: "",
    lodgeMeeting: false,
  });
  const [selectedLodgeIds, setSelectedLodgeIds] = useState<string[]>([]);
  const foodPreview =
    Number.isFinite(Number(form.price)) && Number(form.price) > 0 ? 1 : 0;
  useEffect(() => {
    void runLodges(() => listLodges()).catch(() => {
      /* swallow; useFetch handles errors */
    });
  }, [runLodges]);

  async function handleCreate(e?: React.FormEvent) {
    e?.preventDefault();
    clearGlobalError();
    if (!canCreate)
      return setGlobalError("Du har inte behörighet att skapa möten");
    if (!form.title) return setGlobalError("Titel är obligatorisk");
    if (!form.description) return setGlobalError("Beskrivning är obligatorisk");
    if (!form.startDate) return setGlobalError("Startdatum är obligatoriskt");
    if (!form.endDate) return setGlobalError("Slutdatum är obligatoriskt");
    try {
      const normalizedLodgeIds = Array.from(
        new Set(
          selectedLodgeIds
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value))
            .map((value) => Math.floor(value))
        )
      );

      const payload: CreateEventPayload = {
        title: form.title,
        description: form.description || null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        price: form.price ? Number(form.price) : undefined,
        lodgeMeeting: form.lodgeMeeting,
        lodgeIds:
          normalizedLodgeIds.length > 0 ? normalizedLodgeIds : undefined,
      };

      const resp = await runSubmit(() => createEventSvc(payload));
      // backend returns { success: true, id } (id is number) or { event: { id } }
      const raw = (resp as Record<string, unknown> | null) ?? null;
      const maybeId = raw
        ? (raw.id ?? (raw.event as Record<string, unknown> | undefined)?.id)
        : null;
      let createdIdNum: number | null = null;
      if (typeof maybeId === "number" && Number.isFinite(maybeId)) {
        createdIdNum = maybeId as number;
      } else if (typeof maybeId === "string" && maybeId.trim() !== "") {
        const n = Number(maybeId);
        if (Number.isFinite(n)) createdIdNum = n;
      }

      if (createdIdNum !== null) {
        const eventId = createdIdNum;
        navigate(`/events/${eventId}`);
      } else {
        navigate(`/events`);
      }
    } catch {
      setGlobalError("Failed to create event");
    }
  }

  return (
    <div className="max-w-3xl w-full mx-auto p-6 min-h-screen">
      <div className="flex items-center justify-between">
        <Link
          to="/events"
          className="text-sm text-green-600 hover:text-green-700 hover:underline"
        >
          ← Tillbaka
        </Link>
      </div>

      <h2 className="text-2xl font-bold mt-4 mb-4">Skapa Möte</h2>

      <form
        onSubmit={handleCreate}
        className="bg-white p-4 rounded-md shadow space-y-4"
      >
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Titel
          </label>
          <input
            id="title"
            name="title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border rounded-md px-3 py-2"
            required
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium mb-1"
          >
            Beskrivning
          </label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border rounded-md px-3 py-2"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium mb-1"
            >
              Startdatum
            </label>
            <input
              id="startDate"
              name="startDate"
              type="datetime-local"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium mb-1">
              Slutdatum
            </label>
            <input
              id="endDate"
              name="endDate"
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium mb-1">
              Pris
            </label>
            <input
              id="price"
              name="price"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="foodPreview" className="block text-sm font-medium mb-1">
              Mat (auto)
            </label>
            <input
              id="foodPreview"
              name="foodPreview"
              value={String(foodPreview)}
              className="w-full border rounded-md px-3 py-2 bg-gray-100"
              readOnly
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

        <LodgeSelection
          lodges={lodges}
          selectedIds={selectedLodgeIds}
          onChange={setSelectedLodgeIds}
          label="Associera loger"
          disabled={saving}
          loading={!lodges}
          name="associateLodges"
        />

        <div className="flex gap-x-4 py-2">
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-sm font-medium text-white px-4 py-2 rounded-md"
            disabled={saving}
          >
            {saving ? "Skapar…" : "Skapa"}
          </button>
          <Link
            to="/events"
            className="bg-gray-100 hover:bg-gray-200 text-sm font-medium transition px-4 py-2 rounded-md border"
          >
            Avbryt
          </Link>
        </div>
      </form>
    </div>
  );
};
