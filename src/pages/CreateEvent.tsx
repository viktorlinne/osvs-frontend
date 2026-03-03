import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LodgeSelection,
  PageContainer,
  inputClass,
  labelClass,
  textareaClass,
} from "../components";
import { useAuth, useError } from "../context";
import useFetch from "../hooks/useFetch";
import { createEvent as createEventSvc } from "../services";
import { listLodges } from "../services/lodges";
import type { CreateEventPayload, Lodge } from "../types";

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
            .map((value) => Math.floor(value)),
        ),
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
        navigate(`/events/${createdIdNum}`);
      } else {
        navigate(`/events`);
      }
    } catch {
      setGlobalError("Failed to create event");
    }
  }

  return (
    <PageContainer size="md" className="ui-page">
      <div className="mb-4 flex items-center justify-between">
        <Link to="/events" className="ui-link">
          ← Tillbaka
        </Link>
      </div>

      <h2 className="ui-page-title mb-4">Skapa Möte</h2>

      <form onSubmit={handleCreate} className="ui-card space-y-4">
        <div>
          <label htmlFor="title" className={labelClass}>
            Titel
          </label>
          <input
            id="title"
            name="title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>
            Beskrivning
          </label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={textareaClass}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="startDate" className={labelClass}>
              Startdatum
            </label>
            <input
              id="startDate"
              name="startDate"
              type="datetime-local"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label htmlFor="endDate" className={labelClass}>
              Slutdatum
            </label>
            <input
              id="endDate"
              name="endDate"
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className={inputClass}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="price" className={labelClass}>
              Pris
            </label>
            <input
              id="price"
              name="price"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="foodPreview" className={labelClass}>
              Mat (auto)
            </label>
            <input
              id="foodPreview"
              name="foodPreview"
              value={String(foodPreview)}
              className={`${inputClass} bg-neutral-100`}
              readOnly
            />
          </div>
          <label htmlFor="lodgeMeeting" className="mt-2 inline-flex items-center gap-2 text-sm text-neutral-700">
            <input
              id="lodgeMeeting"
              type="checkbox"
              checked={form.lodgeMeeting}
              className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus-visible:ring-primary-600"
              onChange={(e) =>
                setForm({ ...form, lodgeMeeting: e.target.checked })
              }
            />
            Logemöte
          </label>
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

        <div className="flex flex-col gap-2 py-2 sm:flex-row">
          <button
            type="submit"
            className="ui-btn ui-btn-primary"
            disabled={saving}
          >
            {saving ? "Skaparâ€¦" : "Skapa"}
          </button>
          <Link to="/events" className="ui-btn ui-btn-secondary">
            Avbryt
          </Link>
        </div>
      </form>
    </PageContainer>
  );
};
