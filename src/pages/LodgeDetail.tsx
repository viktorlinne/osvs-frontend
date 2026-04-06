import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Button,
  PageContainer,
  errorTextClass,
  inputClass,
  labelClass,
  textareaClass,
} from "../components";
import { useAuth, useError } from "../context";
import useFetch from "../hooks/useFetch";
import { getLodge, updateLodge } from "../services/lodges";
import type { LodgeMutationResult } from "../services/lodges";
import type { Lodge } from "../types";
import { getApiErrorMessage, getApiFieldErrors } from "../utils/apiErrors";
import { getLodgeFormErrors } from "../utils/formValidation";

export const LodgeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { run, data: lodge } = useFetch<Lodge | null>();
  const { run: runAction, loading: saving } = useFetch<LodgeMutationResult>();
  const { setError: setGlobalError, clearError: clearGlobalError } = useError();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isEditRoute = location.pathname.endsWith("/edit");
  const canEdit = Boolean(
    user && (user.roles ?? []).some((r) => ["Admin", "Editor"].includes(r)),
  );

  const [form, setForm] = useState({
    name: "",
    city: "",
    description: "",
    email: "",
  });
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const clientErrors = getLodgeFormErrors(form);
  const formErrors = { ...serverErrors, ...clientErrors };
  const canSave = canEdit && Object.keys(clientErrors).length === 0;

  function clearServerField(field: string) {
    setServerErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  useEffect(() => {
    if (!id) return setGlobalError("Saknar loge-id");
    void run(() => getLodge(id)).catch(() => {});
  }, [id, run, setGlobalError]);

  useEffect(() => {
    if (!lodge) return;
    Promise.resolve().then(() =>
      setForm({
        name: lodge.name ?? "",
        city: lodge.city ?? "",
        description: lodge.description ?? "",
        email: lodge.email ?? "",
      }),
    );
  }, [lodge, isEditRoute]);

  async function handleSave() {
    if (!id) return setGlobalError("Saknar loge-id");
    if (!canEdit) return setGlobalError("Ingen behörighet");
    clearGlobalError();
    setServerErrors({});
    if (Object.keys(clientErrors).length > 0) return;
    try {
      const payload = {
        name: form.name.trim(),
        city: form.city.trim(),
        description: form.description || null,
        email: form.email.trim() || undefined,
      };
      await runAction(() => updateLodge(id, payload));
      await run(() => getLodge(id));
      navigate(`/lodges/${id}`);
    } catch (error: unknown) {
      const fields = getApiFieldErrors(error);
      if (fields) {
        setServerErrors(fields);
        return;
      }

      setGlobalError(getApiErrorMessage(error) ?? "Misslyckades att spara logen");
    }
  }

  return (
    <PageContainer size="xl" className="ui-page">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
        <Link to=".." relative="path" className="ui-link">
          ← Tillbaka
        </Link>
        {canEdit && !isEditRoute && (
          <Link to={`/lodges/${id}/edit`} className="ui-btn ui-btn-primary">
            Redigera
          </Link>
        )}
      </div>

      {lodge ? (
        <div className="ui-card">
          {isEditRoute && canEdit ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className={labelClass}>
                  Namn
                </label>
                <input
                  id="name"
                  name="name"
                  autoComplete="off"
                  value={form.name}
                  onChange={(e) => {
                    clearServerField("name");
                    setForm({ ...form, name: e.target.value });
                  }}
                  className={inputClass}
                />
                {formErrors.name ? (
                  <p className={errorTextClass}>{formErrors.name}</p>
                ) : null}
              </div>
              <div>
                <label htmlFor="city" className={labelClass}>
                  Stad
                </label>
                <input
                  id="city"
                  name="city"
                  autoComplete="off"
                  value={form.city}
                  onChange={(e) => {
                    clearServerField("city");
                    setForm({ ...form, city: e.target.value });
                  }}
                  className={inputClass}
                />
                {formErrors.city ? (
                  <p className={errorTextClass}>{formErrors.city}</p>
                ) : null}
              </div>
              <div>
                <label htmlFor="description" className={labelClass}>
                  Beskrivning
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={8}
                  value={form.description}
                  onChange={(e) => {
                    clearServerField("description");
                    setForm({ ...form, description: e.target.value });
                  }}
                  className={textareaClass}
                />
                {formErrors.description ? (
                  <p className={errorTextClass}>{formErrors.description}</p>
                ) : null}
              </div>
              <div>
                <label htmlFor="email" className={labelClass}>
                  E-post
                </label>
                <input
                  id="email"
                  name="email"
                  autoComplete="off"
                  value={form.email}
                  onChange={(e) => {
                    clearServerField("email");
                    setForm({ ...form, email: e.target.value });
                  }}
                  className={inputClass}
                />
                {formErrors.email ? (
                  <p className={errorTextClass}>{formErrors.email}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-2 py-2 sm:flex-row">
                <Button
                  type="button"
                  className="ui-btn-primary"
                  onClick={handleSave}
                  disabled={saving || !canSave}
                >
                  {saving ? "Sparar..." : "Spara"}
                </Button>
                <Link to=".." relative="path" className="ui-btn ui-btn-secondary">
                  Avbryt
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <div>
                <img
                  className="mb-2 h-28 w-28 rounded-full object-cover md:h-40 md:w-40"
                  src={lodge?.picture ?? undefined}
                  alt={`${lodge?.city}s vapensköld`}
                />
              </div>
              <div>
                <h1 className="ui-page-title">{lodge.name}</h1>
              </div>
              <div className="mb-2 text-neutral-700">
                <div className="italic">{lodge.city}</div>
              </div>
              <div className="mb-2 text-neutral-700">
                {lodge.description}
              </div>
              <div className="mb-2 text-neutral-700">
                <a className="ui-link" href={`mailto:${lodge.email}`}>
                  {lodge.email}
                </a>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-neutral-600">Ingen logedata</div>
      )}
    </PageContainer>
  );
};
