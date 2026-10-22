import { useEffect, useState } from "react";
import { Link, useBlocker, useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
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
import { SkeletonBlock } from "../components/PageSkeleton";

export const LodgeDetail = () => {
  const emptyForm = { name: "", city: "", description: "", email: "" };
  const { id } = useParams<{ id: string }>();
  const { run, data: lodge, loading, notFound } = useFetch<Lodge | null>();
  const { run: runAction, loading: saving } = useFetch<LodgeMutationResult>();
  const { setError: setGlobalError, clearError: clearGlobalError } = useError();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isEditRoute = location.pathname.endsWith("/edit");
  // PUT /lodges/:id is Admin-only in the backend; Editors only got 403s.
  const canEdit = Boolean(user && (user.roles ?? []).includes("Admin"));

  const [form, setForm] = useState(emptyForm);
  const [initialForm, setInitialForm] = useState(emptyForm);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const clientErrors = getLodgeFormErrors(form);
  const formErrors = { ...serverErrors, ...clientErrors };
  const canSave = canEdit && Object.keys(clientErrors).length === 0;
  const isDirty = isEditRoute && JSON.stringify(form) !== JSON.stringify(initialForm);

  const blocker = useBlocker(isDirty);

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
    void run(() => getLodge(id)).catch(() => {
      /* useFetch sets global error; notFound handled via notFound flag */
    });
  }, [id, run, setGlobalError]);

  useEffect(() => {
    if (!lodge) return;
    Promise.resolve().then(() => {
      const next = {
        name: lodge.name ?? "",
        city: lodge.city ?? "",
        description: lodge.description ?? "",
        email: lodge.email ?? "",
      };
      setInitialForm(next);
      setForm(next);
    });
  }, [lodge]);

  useEffect(() => {
    if (!lodge?.name) return;
    document.title = `${lodge.name} — OSVS`;
    return () => {
      document.title = "OSVS";
    };
  }, [lodge?.name]);

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
      toast.success("Ändringarna har sparats.");
      navigate(`/lodges/${id}`);
    } catch (error: unknown) {
      const fields = getApiFieldErrors(error);
      if (fields) {
        setServerErrors(fields);
        return;
      }

      setGlobalError(getApiErrorMessage(error) ?? "Kunde inte spara logen.");
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

      {blocker.state === "blocked" && (
        <div className="mb-4 rounded-md border border-warning-600/30 bg-warning-50 px-4 py-3 text-sm">
          <p className="mb-3 text-neutral-700">Du har osparade ändringar. Vill du lämna ändå?</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="ui-btn ui-btn-secondary"
              onClick={() => blocker.reset?.()}
            >
              Stanna kvar
            </button>
            <button
              type="button"
              className="ui-btn"
              onClick={() => blocker.proceed?.()}
            >
              Lämna utan att spara
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="ui-card">
          <div className="space-y-4">
            <SkeletonBlock className="h-28 w-28 rounded-lg md:h-40 md:w-40" />
            <SkeletonBlock className="h-6 w-48" />
            <SkeletonBlock className="h-4 w-24" />
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      ) : notFound ? (
        <div className="ui-card flex flex-col items-center gap-3 py-10 text-center">
          <h1 className="ui-page-title">Logen hittades inte</h1>
          <p className="text-neutral-600 text-sm">
            Kontrollera länken eller gå tillbaka till logelistan.
          </p>
          <Link to="/lodges" className="ui-btn ui-btn-primary mt-2">
            Till logelistan
          </Link>
        </div>
      ) : lodge ? (
        <div className="ui-card animate-step-in">
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
                  {saving ? "Sparar…" : "Spara"}
                </Button>
                <button
                  type="button"
                  className="ui-btn ui-btn-secondary"
                  onClick={() => {
                    setForm(initialForm);
                    navigate("..", { relative: "path" });
                  }}
                >
                  Avbryt
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {lodge.picture ? (
                <img
                  className="h-28 w-28 rounded-lg object-cover md:h-40 md:w-40"
                  src={lodge.picture}
                  alt={lodge.city ? `${lodge.city}s vapensköld` : "Vapensköld"}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : null}
              <h1 className="ui-page-title">{lodge.name}</h1>
              {lodge.city && (
                <div>
                  <p className={labelClass}>Stad</p>
                  <p className="text-neutral-600">{lodge.city}</p>
                </div>
              )}
              {lodge.description && (
                <div>
                  <p className={labelClass}>Beskrivning</p>
                  <p className="text-neutral-600 whitespace-pre-line">{lodge.description}</p>
                </div>
              )}
              {lodge.email && (
                <div>
                  <p className={labelClass}>E-post</p>
                  <a className="ui-link" href={`mailto:${lodge.email}`}>
                    {lodge.email}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}
    </PageContainer>
  );
};
