import { useEffect, useState } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { Spinner, NotFound } from "../components";
import useFetch from "../hooks/useFetch";
import { useError, useAuth } from "../context";
import type { Lodge } from "@osvs/types";
import { getLodge, updateLodge } from "../services/lodges";

export const LodgeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { run, loading, data: lodge, notFound } = useFetch<Lodge | null>();
  const { setError: setGlobalError, clearError: clearGlobalError } = useError();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isEditRoute = location.pathname.endsWith("/edit");
  const canEdit = Boolean(user && (user.roles ?? []).some((r) => ["Admin", "Editor"].includes(r)));

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", address: "" });

  useEffect(() => {
    if (!id) return setGlobalError("Missing lodge id");
    void run(async () => {
      const resp = await getLodge(id);
      const l = (resp as { lodge?: Lodge })?.lodge ?? null;
      return l as Lodge | null;
    }).catch(() => {});
  }, [id, run, setGlobalError]);

  useEffect(() => {
    if (!lodge) return;
    setForm({ name: lodge.name ?? "", description: lodge.description ?? "", address: lodge.address ?? "" });
  }, [lodge, isEditRoute]);

  async function handleSave() {
    if (!id) return setGlobalError("Missing lodge id");
    if (!canEdit) return setGlobalError("Ingen behörighet");
    clearGlobalError();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        description: form.description || null,
        address: form.address || null,
      };
      await updateLodge(id, payload);
      await run(async () => {
        const resp = await getLodge(id);
        const l = (resp as { lodge?: Lodge })?.lodge ?? null;
        return l as Lodge | null;
      });
      navigate(`/lodges/${id}`);
    } catch {
      setGlobalError("Failed to save lodge");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;
  if (notFound) return <NotFound />;

  return (
    <div className="max-w-3xl w-full mx-auto p-6 min-h-screen">
      <div className="flex items-center justify-between">
        <Link to="/lodges" className="text-sm text-green-600 underline">← Tillbaka till loger</Link>
        {canEdit && !isEditRoute && (
          <Link to={`/lodges/${id}/edit`} className="text-sm text-white bg-green-600 hover:bg-green-700 transition px-3 py-1 rounded">Edit</Link>
        )}
      </div>

      <h2 className="text-2xl font-bold mt-4 mb-4">Loge</h2>

      {lodge ? (
        <div className="bg-white p-4 rounded shadow">
          {isEditRoute && canEdit ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Namn</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Beskrivning</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Adress</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div className="flex gap-2">
                <button className="bg-green-600 hover:bg-green-700 transition text-white px-4 py-2 rounded" onClick={handleSave} disabled={saving}>{saving ? "Sparar…" : "Spara"}</button>
                <Link to={`/lodges/${id}`} className="px-4 py-2 rounded border">Avbryt</Link>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-2"><strong>Namn:</strong> {lodge.name}</div>
              <div className="mb-2"><strong>Beskrivning:</strong> {lodge.description ?? ""}</div>
              <div className="mb-2"><strong>Adress:</strong> {lodge.address ?? ""}</div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-gray-500">Ingen logedata</div>
      )}
    </div>
  );
}
