import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  PageContainer,
  inputClass,
  labelClass,
} from "../components";
import { useError } from "../context";
import useFetch from "../hooks/useFetch";
import { createDocument } from "../services";
import {
  buildPdfFormData,
  validatePdfFile,
  validateRequiredTitle,
} from "../utils/pdfUpload";

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
    const titleError = validateRequiredTitle(normalizedTitle);
    if (titleError) return setError(titleError);

    const fileError = validatePdfFile(file);
    if (fileError) return setError(fileError);
    if (!file) return;

    const formData = buildPdfFormData({ title: normalizedTitle }, file);

    try {
      await run(() => createDocument(formData));
      navigate("/documents");
    } catch {
      // handled by useFetch
    }
  }

  return (
    <PageContainer size="md" className="ui-page">
      <Link to="/documents" className="ui-link">
        ← Tillbaka
      </Link>
      <h2 className="ui-page-title mb-4 mt-4">Lägg till dokument</h2>

      <form onSubmit={onSubmit} className="ui-card">
        <div className="mb-4">
          <label htmlFor="document-title" className={labelClass}>
            Titel
          </label>
          <input
            id="document-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            autoComplete="off"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="document-file" className={labelClass}>
            Fil (PDF)
          </label>
          <input
            id="document-file"
            type="file"
            accept=".pdf,application/pdf"
            className={inputClass}
            onChange={(e) => {
              const nextFile =
                e.target.files && e.target.files[0]
                  ? e.target.files[0]
                  : null;
              setFile(nextFile);
            }}
          />
        </div>

        <button type="submit" disabled={loading} className="ui-btn ui-btn-primary">
          {loading ? "Sparar..." : "Skapa"}
        </button>
      </form>
    </PageContainer>
  );
};
