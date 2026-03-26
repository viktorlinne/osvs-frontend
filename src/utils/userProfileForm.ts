import type { UpdateUserProfileBody } from "../types";
import { getApiFieldErrors } from "./apiErrors";

export function toUserProfileUpdatePayload(
  values: Record<string, unknown>,
): UpdateUserProfileBody {
  const dateOfBirth =
    typeof values.dateOfBirth === "string" ? values.dateOfBirth.trim() : "";
  const address = typeof values.address === "string" ? values.address.trim() : "";
  const zipcode = typeof values.zipcode === "string" ? values.zipcode.trim() : "";
  const work = typeof values.work === "string" ? values.work.trim() : "";
  const notes = typeof values.notes === "string" ? values.notes.trim() : "";

  return {
    firstname: String(values.firstname ?? "").trim(),
    lastname: String(values.lastname ?? "").trim(),
    mobile: String(values.mobile ?? "").trim(),
    city: String(values.city ?? "").trim(),
    dateOfBirth: dateOfBirth.length > 0 ? dateOfBirth : undefined,
    address: address.length > 0 ? address : undefined,
    zipcode: zipcode.length > 0 ? zipcode : undefined,
    work: work.length > 0 ? work : null,
    notes: notes.length > 0 ? notes : null,
    accommodationAvailable:
      typeof values.accommodationAvailable === "boolean"
        ? values.accommodationAvailable
        : null,
    archive:
      values.archive === "Avliden" || values.archive === "Urgången"
        ? values.archive
        : null,
  };
}

export function extractMissingFields(error: unknown): string[] | null {
  const fields = getApiFieldErrors(error);
  if (!fields) return null;
  return Object.keys(fields);
}

