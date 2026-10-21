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
  const homeNumber =
    typeof values.homeNumber === "string" ? values.homeNumber.trim() : "";
  const notes = typeof values.notes === "string" ? values.notes.trim() : "";

  return {
    firstname: String(values.firstname ?? "").trim(),
    lastname: String(values.lastname ?? "").trim(),
    mobile: String(values.mobile ?? "").trim(),
    homeNumber: homeNumber.length > 0 ? homeNumber : null,
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
      values.archive === "Avliden" ||
      values.archive === "Urgången" ||
      values.archive === "Avförd"
        ? values.archive
        : null,
  };
}

/**
 * Payload for Admin/Editor edits of another member (PUT /users/:id). Adds the
 * admin-only flags; never use this for PUT /users/me.
 */
export function toAdminUserProfileUpdatePayload(
  values: Record<string, unknown>,
): UpdateUserProfileBody {
  return {
    ...toUserProfileUpdatePayload(values),
    feeExempt: values.feeExempt === true,
    standingList: values.standingList === true,
  };
}

export function extractMissingFields(error: unknown): string[] | null {
  const fields = getApiFieldErrors(error);
  if (!fields) return null;
  return Object.keys(fields);
}

