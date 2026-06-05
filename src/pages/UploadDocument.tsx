import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import {
  Button,
  PageContainer,
  PdfFileInput,
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
  const [fileTouched, setFileTouched] = useState(false);
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
      <h1 className="ui-page-title mb-4 mt-4">Lägg till dokument</h1>

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
            <p className={errorTextClass}>{errors.title.message}</p>
          ) : null}
        </div>

        <div className="mb-4">
          <label htmlFor="document-file" className={labelClass}>
            Fil
          </label>
          <PdfFileInput
            id="document-file"
            value={file}
            onChange={(nextFile) => {
              setFileTouched(true);
              setFile(nextFile);
              clearErrors("file");
            }}
            error={
              errors.file?.message ??
              (fileTouched && fileError ? fileError : undefined)
            }
          />
        </div>

        <Button
          type="submit"
          loading={loading}
          disabled={!isValid || Boolean(fileError)}
        >
          {loading ? "Sparar…" : "Skapa"}
        </Button>
      </form>
    </PageContainer>
  );
};
