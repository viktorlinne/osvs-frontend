import { useEffect, useState } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import { useError, useAuth } from "../context";
import type { Lodge } from "../types";
import { getLodge, updateLodge } from "../services/lodges";

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
    user && (user.roles ?? []).some((r) => ["Admin", "Editor"].includes(r))
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
      })
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
    <div className="max-w-3xl w-full mx-auto p-6 min-h-screen">
      <div className="flex items-center justify-between">
        <Link to=".." relative="path" className="text-sm text-green-600 hover:text-green-700 hover:underline">
          ← Tillbaka
        </Link>
        {canEdit && !isEditRoute && (
          <Link
            to={`/lodges/${id}/edit`}
            className="text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition px-3 py-2 rounded-md"
          >
            Redigera
          </Link>
        )}
      </div>

      {lodge ? (
        <div className="bg-white p-4 rounded-md shadow">
          {isEditRoute && canEdit ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">Namn</label>
                <input
                  id="name"
                  name="name"
                  autoComplete="off"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium mb-1">Stad</label>
                <input
                  id="city"
                  name="city"
                  autoComplete="off"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  Beskrivning
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={8}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">E-post</label>
                <input
                  id="email"
                  name="email"
                  autoComplete="off"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  className="w-full border rounded-md px-3 py-2"
                />
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
                  to=".." relative="path"
                  className="bg-gray-100 hover:bg-gray-200 transition px-4 py-2 rounded-md border"
                >
                  Avbryt
                </Link>
              </div>
            </div>
          ) : (

            <div>
              <div>
                <img
                  className="rounded-full w-28 h-28 md:w-40 md:h-40 object-cover mb-1"
                  src={lodge?.picture ?? undefined}
                  alt={`${lodge?.city}s vapensköld`}
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-4">{lodge.name}</h1>
              </div>
              <div className="mb-2">
                <strong>Stad:</strong> {lodge.city}
              </div>
              <div className="mb-2">
                <strong>Historia:</strong> {lodge.description}
              </div>
              <div className="mb-2">
                <strong>Kontakt:</strong> <a className="text-green-600 hover:text-green-700 hover:underline" href={`mailto:${lodge.email}`}>{lodge.email}</a>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-gray-500">Ingen logedata</div>
      )}
    </div>
  );
};
