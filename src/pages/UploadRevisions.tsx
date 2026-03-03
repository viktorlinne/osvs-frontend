import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  PageContainer,
  inputClass,
  labelClass,
  selectClass,
} from "../components";
import { useError } from "../context";
import useFetch from "../hooks/useFetch";
import { createRevision, listLodges } from "../services";
import type { Lodge } from "../types";
import {
  buildPdfFormData,
  validatePdfFile,
  validateRequiredTitle,
} from "../utils/pdfUpload";

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

    const titleError = validateRequiredTitle(normalizedTitle);
    if (titleError) return setError(titleError);

    if (
      !Number.isInteger(parsedYear) ||
      parsedYear < 1900 ||
      parsedYear > 3000
    ) {
      return setError("År måste vara ett giltigt år");
    }
    if (!Number.isInteger(parsedLodgeId) || parsedLodgeId <= 0) {
      return setError("Välj en loge");
    }

    const fileError = validatePdfFile(file);
    if (fileError) return setError(fileError);
    if (!file) return;

    const formData = buildPdfFormData(
      {
        title: normalizedTitle,
        year: String(parsedYear),
        lodgeId: String(parsedLodgeId),
      },
      file,
    );

    try {
      await run(() => createRevision(formData));
      navigate("/revisions");
    } catch {
      // handled by useFetch
    }
  }

  return (
    <PageContainer size="md" className="ui-page">
      <Link to="/revisions" className="ui-link">
        ← Tillbaka
      </Link>
      <h2 className="ui-page-title mb-4 mt-4">Lägg till revision</h2>

      <form onSubmit={onSubmit} className="ui-card">
        <div className="mb-4">
          <label htmlFor="revision-title" className={labelClass}>
            Titel
          </label>
          <input
            id="revision-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            autoComplete="off"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="revision-year" className={labelClass}>
            År
          </label>
          <input
            id="revision-year"
            type="number"
            inputMode="numeric"
            min={1924}
            max={3000}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="revision-lodge" className={labelClass}>
            Loge
          </label>
          <select
            id="revision-lodge"
            value={lodgeId}
            onChange={(e) => setLodgeId(e.target.value)}
            className={selectClass}
          >
            <option value="">Välj loge</option>
            {(lodges ?? []).map((lodge) => (
              <option key={lodge.id} value={String(lodge.id)}>
                {lodge.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="revision-file" className={labelClass}>
            Fil (PDF)
          </label>
          <input
            id="revision-file"
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
