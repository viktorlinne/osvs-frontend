import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { ApiError, ApiErrorDetails } from "../types/api";
import { isApiError } from "../types/api";

function extractFieldMap(details: ApiErrorDetails | unknown): Record<string, string> {
  if (!details || typeof details !== "object") return {};
  const record = details as Record<string, unknown>;

  if (record.fields && typeof record.fields === "object") {
    return Object.entries(record.fields as Record<string, unknown>).reduce<
      Record<string, string>
    >((acc, [field, value]) => {
      if (typeof value === "string" && field.trim().length > 0) {
        acc[field] = value;
      }
      return acc;
    }, {});
  }

  if (Array.isArray(record.missing)) {
    return record.missing.reduce<Record<string, string>>((acc, item) => {
      if (typeof item === "string" && item.trim().length > 0) {
        acc[item] = "Ogiltigt värde";
        return acc;
      }

      if (!item || typeof item !== "object") return acc;
      const row = item as Record<string, unknown>;
      const field = typeof row.field === "string" ? row.field.trim() : "";
      const message =
        typeof row.message === "string" ? row.message : "Ogiltigt värde";
      if (field) acc[field] = message;
      return acc;
    }, {});
  }

  return {};
}

export function getApiFieldErrors(error: unknown): Record<string, string> | null {
  if (!isApiError(error)) return null;
  const fields = extractFieldMap(error.details);
  return Object.keys(fields).length > 0 ? fields : null;
}

export function hasApiFieldErrors(error: unknown): boolean {
  return Boolean(getApiFieldErrors(error));
}

export function applyApiFieldErrors<TFieldValues extends FieldValues>(
  error: unknown,
  setFieldError: UseFormSetError<TFieldValues>,
): boolean {
  const fields = getApiFieldErrors(error);
  if (!fields) return false;

  for (const [field, message] of Object.entries(fields)) {
    setFieldError(field as Path<TFieldValues>, {
      type: "server",
      message,
    });
  }

  return true;
}

export function getApiErrorMessage(error: unknown): string | null {
  if (!isApiError(error)) return null;
  return typeof error.message === "string" && error.message.trim().length > 0
    ? error.message
    : null;
}

export function toApiError(error: unknown): ApiError | null {
  return isApiError(error) ? error : null;
}
