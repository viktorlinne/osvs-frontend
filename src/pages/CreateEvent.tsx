import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Button,
  EventAudienceFields,
  PageContainer,
  errorTextClass,
  inputClass,
  labelClass,
  textareaClass,
} from "../components";
import { useAuth, useError } from "../context";
import useFetch from "../hooks/useFetch";
import { createEvent as createEventSvc } from "../services";
import type { CreateEventResult } from "../services/events";
import { listGroups } from "../services/groups";
import { listLodges } from "../services/lodges";
import { listUsers } from "../services/users";
import type { CreateEventPayload, Group, Lodge, PublicUser } from "../types";
import { getApiErrorMessage, getApiFieldErrors } from "../utils/apiErrors";
import { getEventFormErrors } from "../utils/formValidation";

function normalizeNumericIds(values: string[]): number[] {
  return Array.from(
    new Set(
      values
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value))
        .map((value) => Math.floor(value)),
    ),
  );
}

export const CreateEvent = () => {
  const navigate = useNavigate();
  const { setError: setGlobalError, clearError: clearGlobalError } = useError();
  const { user } = useAuth();
  const canCreate = Boolean(
    user &&
      (user.roles ?? []).some((r: string) => ["Admin", "Editor"].includes(r)),
  );

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
    run: runUsers,
    data: users,
    loading: usersLoading,
  } = useFetch<PublicUser[]>();
  const {
    run: runLodgeUsers,
    data: lodgeUsers,
    setData: setLodgeUsers,
  } = useFetch<PublicUser[]>();
  const { run: runSubmit, loading: saving } = useFetch<CreateEventResult>();

  const [form, setForm] = useState({
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
  const foodPreview =
    Number.isFinite(Number(form.price)) && Number(form.price) > 0 ? 1 : 0;
  const clientErrors = getEventFormErrors(form);
  const formErrors = { ...serverErrors, ...clientErrors };
  const canSubmit = canCreate && Object.keys(clientErrors).length === 0;
  const selectedLodgeId = useMemo(() => {
    const firstValue = selectedLodgeIds[0];
    const parsed = Number(firstValue);
    return Number.isFinite(parsed) ? parsed : null;
  }, [selectedLodgeIds]);

  function clearServerField(field: string) {
    setServerErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  useEffect(() => {
    void Promise.all([
      runLodges(() => listLodges()).catch(() => {
        /* useFetch handles errors */
      }),
      runGroups(() => listGroups()).catch(() => {
        /* useFetch handles errors */
      }),
      runUsers(() => listUsers()).catch(() => {
        /* useFetch handles errors */
      }),
    ]);
  }, [runGroups, runLodges, runUsers]);

  useEffect(() => {
    if (!selectedLodgeId) {
      setLodgeUsers([]);
      return;
    }

    runLodgeUsers(() => listUsers({ lodgeId: selectedLodgeId })).catch(() => {
      /* useFetch handles errors */
    });
  }, [runLodgeUsers, selectedLodgeId, setLodgeUsers]);

  async function handleCreate(e?: React.FormEvent) {
    e?.preventDefault();
    clearGlobalError();
    setServerErrors({});

    if (!canCreate) {
      setGlobalError("Du har inte behörighet att skapa möten");
      return;
    }

    if (Object.keys(clientErrors).length > 0) return;

    try {
      const normalizedLodgeIds = normalizeNumericIds(selectedLodgeIds);
      const normalizedGroupIds = normalizeNumericIds(selectedGroupIds);
      const normalizedUserIds = normalizeNumericIds(selectedUserIds);

      const payload: CreateEventPayload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        price: form.price ? Number(form.price) : undefined,
        lodgeMeeting: form.lodgeMeeting,
        lodgeIds: normalizedLodgeIds,
        groupIds: normalizedGroupIds,
        userIds: normalizedUserIds,
      };

      const resp = await runSubmit(() => createEventSvc(payload));
      if (resp.id !== null) {
        navigate(`/events/${resp.id}`);
      } else {
        navigate("/events");
      }
    } catch (error: unknown) {
      const fields = getApiFieldErrors(error);
      if (fields) {
        setServerErrors(fields);
        return;
      }

      setGlobalError(
        getApiErrorMessage(error) ?? "Misslyckades att skapa mötet",
      );
    }
  }

  return (
    <PageContainer size="xl" className="ui-page">
      <div className="mb-4 flex items-center justify-between">
        <Link to=".." relative="path" className="ui-link">
          ← Tillbaka
        </Link>
      </div>

      <h2 className="ui-page-title mb-4">Skapa möte</h2>

      <form onSubmit={handleCreate} className="ui-card space-y-4">
        <div>
          <label htmlFor="title" className={labelClass}>
            Titel
          </label>
          <input
            id="title"
            name="title"
            value={form.title}
            onChange={(e) => {
              clearServerField("title");
              setForm({ ...form, title: e.target.value });
            }}
            className={inputClass}
            required
          />
          {formErrors.title ? (
            <p className={errorTextClass}>{formErrors.title}</p>
          ) : null}
        </div>

        <EventAudienceFields
          lodges={lodges}
          groups={groups}
          users={users}
          lodgeUsers={lodgeUsers}
          selectedLodgeIds={selectedLodgeIds}
          selectedGroupIds={selectedGroupIds}
          selectedUserIds={selectedUserIds}
          onLodgeChange={setSelectedLodgeIds}
          onGroupChange={setSelectedGroupIds}
          onUserChange={setSelectedUserIds}
          clearServerField={clearServerField}
          errors={formErrors}
          disabled={saving}
          lodgesLoading={lodgesLoading}
          groupsLoading={groupsLoading}
          usersLoading={usersLoading}
        />

        <div>
          <label htmlFor="description" className={labelClass}>
            Beskrivning
          </label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={(e) => {
              clearServerField("description");
              setForm({ ...form, description: e.target.value });
            }}
            className={textareaClass}
            required
          />
          {formErrors.description ? (
            <p className={errorTextClass}>{formErrors.description}</p>
          ) : null}
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
              onChange={(e) => {
                clearServerField("startDate");
                setForm({ ...form, startDate: e.target.value });
              }}
              className={inputClass}
              required
            />
            {formErrors.startDate ? (
              <p className={errorTextClass}>{formErrors.startDate}</p>
            ) : null}
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
              onChange={(e) => {
                clearServerField("endDate");
                setForm({ ...form, endDate: e.target.value });
              }}
              className={inputClass}
              required
            />
            {formErrors.endDate ? (
              <p className={errorTextClass}>{formErrors.endDate}</p>
            ) : null}
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
              onChange={(e) => {
                clearServerField("price");
                setForm({ ...form, price: e.target.value });
              }}
              className={inputClass}
            />
            {formErrors.price ? (
              <p className={errorTextClass}>{formErrors.price}</p>
            ) : null}
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
          <label
            htmlFor="lodgeMeeting"
            className="mt-2 inline-flex items-center gap-2 text-sm text-neutral-700"
          >
            <input
              id="lodgeMeeting"
              type="checkbox"
              checked={form.lodgeMeeting}
              className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus-visible:ring-primary-600"
              onChange={(e) => {
                clearServerField("lodgeMeeting");
                setForm({ ...form, lodgeMeeting: e.target.checked });
              }}
            />
            Logemöte
          </label>
        </div>

        <div className="flex flex-col gap-2 py-2 sm:flex-row">
          <Button
            type="submit"
            className="ui-btn-primary"
            disabled={saving || !canSubmit}
          >
            {saving ? "Skapar..." : "Skapa"}
          </Button>
          <Link to=".." relative="path" className="ui-btn ui-btn-secondary">
            Avbryt
          </Link>
        </div>
      </form>
    </PageContainer>
  );
};
