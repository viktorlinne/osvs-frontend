import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import { createRevision, listLodges } from "../services";
import { useError } from "../context";
import type { Lodge } from "../types";

export const UploadRevisions = () => {
  const navigate = useNavigate();
  const { setError, clearError } = useError();
  const { run, loading } = useFetch<{ success?: boolean; id?: number }>();
  const { run: runLodges, data: lodges } = useFetch<Lodge[]>();

  const [title, setTitle] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [lodgeId, setLodgeId] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    runLodges(async () => {
      const data = await listLodges();
      return Array.isArray(data) ? data : [];
    }).catch(() => {
      // handled by useFetch
    });
  }, [runLodges]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearError();

    const normalizedTitle = title.trim();
    const parsedYear = Number(year);
    const parsedLodgeId = Number(lodgeId);

    if (!normalizedTitle) return setError("Titel är obligatorisk");
    if (!Number.isInteger(parsedYear) || parsedYear < 1900 || parsedYear > 3000) {
      return setError("År måste vara ett giltigt år");
    }
    if (!Number.isInteger(parsedLodgeId) || parsedLodgeId <= 0) {
      return setError("Välj en loge");
    }
    if (!file) return setError("Välj en PDF-fil");

    const formData = new FormData();
    formData.append("title", normalizedTitle);
    formData.append("year", String(parsedYear));
    formData.append("lodgeId", String(parsedLodgeId));
    formData.append("file", file);

    try {
      await run(() => createRevision(formData));
      navigate("/revisions");
    } catch {
      // handled by useFetch
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-6">
      <div className="max-w-3xl w-full mx-auto p-0">
        <Link
          to="/revisions"
          className="text-sm text-green-600 hover:text-green-700 hover:underline"
        >
          Tillbaka
        </Link>
        <h2 className="text-2xl font-bold mt-4 mb-4">Lagg till revision</h2>

        <form onSubmit={onSubmit} className="bg-white p-4 rounded-md shadow">
          <div className="mb-4">
            <label htmlFor="revision-title" className="block font-medium mb-1">
              Titel
            </label>
            <input
              id="revision-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
              autoComplete="off"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="revision-year" className="block font-medium mb-1">
              År
            </label>
            <input
              id="revision-year"
              type="number"
              inputMode="numeric"
              min={1900}
              max={3000}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="revision-lodge" className="block font-medium mb-1">
              Loge
            </label>
            <select
              id="revision-lodge"
              value={lodgeId}
              onChange={(e) => setLodgeId(e.target.value)}
              className="w-full border rounded-md px-3 py-2 bg-white"
            >
              <option value="">Valj loge</option>
              {(lodges ?? []).map((lodge) => (
                <option key={lodge.id} value={String(lodge.id)}>
                  {lodge.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="revision-file" className="block font-medium mb-1">
              Fil (PDF)
            </label>
            <input
              id="revision-file"
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => {
                const nextFile = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                setFile(nextFile);
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition px-3 py-2 rounded-md disabled:opacity-60"
          >
            {loading ? "Sparar..." : "Skapa"}
          </button>
        </form>
      </div>
    </div>
  );
};
