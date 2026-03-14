import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import {
  Button,
  PageContainer,
  errorTextClass,
  inputClass,
  labelClass,
} from "../components";
import { useError } from "../context";
import useFetch from "../hooks/useFetch";
import { createDocument } from "../services";
import { applyApiFieldErrors, getApiErrorMessage } from "../utils/apiErrors";
import {
  buildPdfFormData,
  validatePdfFile,
  validateRequiredTitle,
} from "../utils/pdfUpload";

type UploadDocumentForm = {
  title: string;
  file: string;
};

export const UploadDocument = () => {
  const navigate = useNavigate();
  const { setError: setGlobalError, clearError: clearGlobalError } = useError();
  const { run, loading } = useFetch<{ success?: boolean; id?: number }>();

  const [file, setFile] = useState<File | null>(null);
  const {
    register,
    handleSubmit,
    clearErrors,
    setError: setFieldError,
    formState: { errors, isValid },
  } = useForm<UploadDocumentForm>({
    mode: "onChange",
    defaultValues: {
      title: "",
      file: "",
    },
  });
  const fileError = validatePdfFile(file, { required: true });

  async function onSubmit(values: UploadDocumentForm) {
    clearGlobalError();
    clearErrors();

    const normalizedTitle = values.title.trim();
    const nextFileError = validatePdfFile(file, { required: true });
    if (nextFileError) {
      setFieldError("file", {
        type: "manual",
        message: nextFileError,
      });
      return;
    }
    if (!file) return;

    const formData = buildPdfFormData({ title: normalizedTitle }, file);

    try {
      await run(() => createDocument(formData));
      navigate("/documents");
    } catch (error: unknown) {
      if (applyApiFieldErrors(error, setFieldError)) {
        return;
      }

      setGlobalError(getApiErrorMessage(error) ?? "Kunde inte skapa dokumentet");
    }
  }

  return (
    <PageContainer size="md" className="ui-page">
      <Link to=".." relative="path" className="ui-link">
        ← Tillbaka
      </Link>
      <h2 className="ui-page-title mb-4 mt-4">Lägg till dokument</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="ui-card">
        <div className="mb-4">
          <label htmlFor="document-title" className={labelClass}>
            Titel
          </label>
          <input
            id="document-title"
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
          <label htmlFor="document-file" className={labelClass}>
            Fil (PDF)
          </label>
          <input
            id="document-file"
            type="file"
            accept=".pdf,application/pdf"
            className={inputClass}
            onChange={(e) => {
              clearErrors("file");
              const nextFile =
                e.target.files && e.target.files[0] ? e.target.files[0] : null;
              setFile(nextFile);
            }}
          />
          {errors.file?.message ? (
            <div className={errorTextClass}>{errors.file.message}</div>
          ) : fileError ? (
            <div className={errorTextClass}>{fileError}</div>
          ) : null}
        </div>

        <Button
          type="submit"
          disabled={loading || !isValid || Boolean(fileError)}
          className="ui-btn-primary"
        >
          {loading ? "Sparar..." : "Skapa"}
        </Button>
      </form>
    </PageContainer>
  );
};
