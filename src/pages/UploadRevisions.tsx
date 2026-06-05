import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import {
  Button,
  PageContainer,
  PdfFileInput,
  errorTextClass,
  inputClass,
  labelClass,
  selectClass,
} from "../components";
import { useError } from "../context";
import useFetch from "../hooks/useFetch";
import { createRevision, listLodges } from "../services";
import type { Lodge } from "../types";
import { applyApiFieldErrors, getApiErrorMessage } from "../utils/apiErrors";
import {
  buildPdfFormData,
  validatePdfFile,
  validateRequiredTitle,
} from "../utils/pdfUpload";

type UploadRevisionForm = {
  title: string;
  year: string;
  lodgeId: string;
  file?: string;
};

function validateRevisionYear(value: string): true | string {
  const parsedYear = Number(value);
  if (!Number.isInteger(parsedYear) || parsedYear < 1924 || parsedYear > 3000) {
    return "År måste vara ett giltigt år";
  }
  return true;
}

function validateRevisionLodge(value: string): true | string {
  const parsedLodgeId = Number(value);
  if (!Number.isInteger(parsedLodgeId) || parsedLodgeId <= 0) {
    return "Välj en loge";
  }
  return true;
}

export const UploadRevisions = () => {
  const navigate = useNavigate();
  const { setError: setGlobalError, clearError: clearGlobalError } = useError();
  const { run, loading } = useFetch<{ success?: boolean; id?: number }>();
  const { run: runLodges, data: lodges } = useFetch<Lodge[]>();

  const [file, setFile] = useState<File | null>(null);
  const [fileTouched, setFileTouched] = useState(false);
  const {
    register,
    handleSubmit,
    clearErrors,
    setError: setFieldError,
    formState: { errors, isValid },
  } = useForm<UploadRevisionForm>({
    mode: "onChange",
    defaultValues: {
      title: "",
      year: String(new Date().getFullYear()),
      lodgeId: "",
    },
  });
  const fileError = validatePdfFile(file, { required: true });

  useEffect(() => {
    runLodges(async () => {
      const data = await listLodges();
      return Array.isArray(data) ? data : [];
    }).catch(() => {
      // handled by useFetch
    });
  }, [runLodges]);

  async function onSubmit(values: UploadRevisionForm) {
    clearGlobalError();
    clearErrors();

    const nextFileError = validatePdfFile(file, { required: true });
    if (nextFileError) {
      setFieldError("file", {
        type: "manual",
        message: nextFileError,
      });
      return;
    }
    if (!file) return;

    const formData = buildPdfFormData(
      {
        title: values.title.trim(),
        year: values.year,
        lodgeId: values.lodgeId,
      },
      file,
    );

    try {
      await run(() => createRevision(formData));
      navigate("/revisions");
    } catch (error: unknown) {
      if (applyApiFieldErrors(error, setFieldError)) {
        return;
      }

      setGlobalError(getApiErrorMessage(error) ?? "Kunde inte skapa revisionen");
    }
  }

  return (
    <PageContainer size="md" className="ui-page">
      <Link to=".." relative="path" className="ui-link">
        ← Tillbaka
      </Link>
      <h2 className="ui-page-title mb-2 mt-4">Lägg till revision</h2>
      <p className="mb-4 text-sm text-neutral-600">
        Revisionen sparas i logens dokumentarkiv och är tillgänglig för bröder i vald loge.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="ui-card">
        <div className="mb-4">
          <label htmlFor="revision-title" className={labelClass}>
            Titel
          </label>
          <input
            id="revision-title"
            {...register("title", {
              validate: (value) => validateRequiredTitle(value) ?? true,
            })}
            className={inputClass}
            autoComplete="off"
          />
          {errors.title?.message ? (
            <div className={errorTextClass}>{errors.title.message}</div>
          ) : null}
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
            {...register("year", {
              validate: validateRevisionYear,
            })}
            className={inputClass}
          />
          {errors.year?.message ? (
            <div className={errorTextClass}>{errors.year.message}</div>
          ) : null}
        </div>

        <div className="mb-4">
          <label htmlFor="revision-lodge" className={labelClass}>
            Loge
          </label>
          <select
            id="revision-lodge"
            {...register("lodgeId", {
              validate: validateRevisionLodge,
            })}
            className={selectClass}
            disabled={lodges === null}
          >
            {lodges === null ? (
              <option value="">Laddar loger...</option>
            ) : (
              <>
                <option value="">Välj loge</option>
                {lodges.map((lodge) => (
                  <option key={lodge.id} value={String(lodge.id)}>
                    {lodge.name}
                  </option>
                ))}
              </>
            )}
          </select>
          {errors.lodgeId?.message ? (
            <div className={errorTextClass}>{errors.lodgeId.message}</div>
          ) : null}
        </div>

        <div className="mb-4">
          <label htmlFor="revision-file" className={labelClass}>
            Fil (PDF)
          </label>
          <PdfFileInput
            id="revision-file"
            value={file}
            onChange={(f) => {
              clearErrors("file");
              setFileTouched(true);
              setFile(f);
            }}
            error={errors.file?.message ?? (fileTouched ? fileError ?? undefined : undefined)}
          />
        </div>

        <div className="flex flex-col gap-2 py-2 sm:flex-row">
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading || !isValid || Boolean(fileError)}
          >
            {loading ? "Skapar..." : "Skapa"}
          </Button>
          <Link to=".." relative="path" className="ui-btn ui-btn-secondary">
            Avbryt
          </Link>
        </div>
      </form>
    </PageContainer>
  );
};
