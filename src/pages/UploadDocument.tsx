import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import { createDocument } from "../services";
import { useError } from "../context";

export const UploadDocument = () => {
  const navigate = useNavigate();
  const { setError, clearError } = useError();
  const { run, loading } = useFetch<{ success?: boolean; id?: number }>();

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearError();

    const normalizedTitle = title.trim();
    if (!normalizedTitle) return setError("Titel är obligatorisk");
    if (!file) return setError("Välj en PDF-fil");

    const formData = new FormData();
    formData.append("title", normalizedTitle);
    formData.append("file", file);

    try {
      await run(() => createDocument(formData));
      navigate("/documents");
    } catch {
      // handled by useFetch
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-6">
      <div className="max-w-3xl w-full mx-auto p-0">
        <Link
          to="/documents"
          className="text-sm text-green-600 hover:text-green-700 hover:underline"
        >
          Tillbaka
        </Link>
        <h2 className="text-2xl font-bold mt-4 mb-4">Lägg till dokument</h2>

        <form onSubmit={onSubmit} className="bg-white p-4 rounded-md shadow">
          <div className="mb-4">
            <label htmlFor="document-title" className="block font-medium mb-1">
              Titel
            </label>
            <input
              id="document-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
              autoComplete="off"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="document-file" className="block font-medium mb-1">
              Fil (PDF)
            </label>
            <input
              id="document-file"
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => {
                const nextFile =
                  e.target.files && e.target.files[0]
                    ? e.target.files[0]
                    : null;
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
