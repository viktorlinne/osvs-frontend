import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  PageContainer,
  inputClass,
  labelClass,
  textareaClass,
} from "../components";
import { useAuth, useError } from "../context";
import useFetch from "../hooks/useFetch";
import { getLodge, updateLodge } from "../services/lodges";
import type { Lodge } from "../types";

export const LodgeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { run, data: lodge } = useFetch<Lodge | null>();
  const { run: runAction, loading: saving } = useFetch<unknown>();
  const { setError: setGlobalError, clearError: clearGlobalError } = useError();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isEditRoute = location.pathname.endsWith("/edit");
  const canEdit = Boolean(
    user && (user.roles ?? []).some((r) => ["Admin", "Editor"].includes(r)),
  );

  const [form, setForm] = useState({ name: "", city: "", description: "", email: "" });

  useEffect(() => {
    if (!id) return setGlobalError("Missing lodge id");
    void run(async () => {
      const resp = await getLodge(id);
      const l = (resp as { lodge?: Lodge })?.lodge ?? null;
      return l as Lodge | null;
    }).catch(() => { });
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
    if (!id) return setGlobalError("Missing lodge id");
    if (!canEdit) return setGlobalError("Ingen behörighet");
    clearGlobalError();
    try {
      const payload = {
        name: form.name,
        city: form.city,
        description: form.description || null,
        email: form.email || undefined,
      };
      await runAction(() => updateLodge(id, payload));
      await run(async () => {
        const resp = await getLodge(id);
        const l = (resp as { lodge?: Lodge })?.lodge ?? null;
        return l as Lodge | null;
      });
      navigate(`/lodges/${id}`);
    } catch {
      setGlobalError("Failed to save lodge");
    }
  }

  return (
    <PageContainer size="md" className="ui-page">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Link to=".." relative="path" className="ui-link">
          ← Tillbaka
        </Link>
        {canEdit && !isEditRoute && (
          <Link to={`/lodges/${id}/edit`} className="ui-btn ui-btn-primary ui-btn-sm">
            Redigera
          </Link>
        )}
      </div>

      {lodge ? (
        <div className="ui-card">
          {isEditRoute && canEdit ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className={labelClass}>Namn</label>
                <input
                  id="name"
                  name="name"
                  autoComplete="off"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="city" className={labelClass}>Stad</label>
                <input
                  id="city"
                  name="city"
                  autoComplete="off"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="description" className={labelClass}>Beskrivning</label>
                <textarea
                  id="description"
                  name="description"
                  rows={8}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={textareaClass}
                />
              </div>
              <div>
                <label htmlFor="email" className={labelClass}>E-post</label>
                <input
                  id="email"
                  name="email"
                  autoComplete="off"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-2 py-2 sm:flex-row">
                <button className="ui-btn ui-btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? "Spararâ€¦" : "Spara"}
                </button>
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
                <strong className="text-neutral-900">Historia:</strong> {lodge.description}
              </div>
              <div className="mb-2 text-neutral-700">
                <strong className="text-neutral-900">Kontakt:</strong>{" "}
                <a className="ui-link" href={`mailto:${lodge.email}`}>{lodge.email}</a>
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
