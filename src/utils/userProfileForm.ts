import { getApiFieldErrors } from "./apiErrors";

export function toUserProfileUpdatePayload(values: Record<string, unknown>) {
  return {
    firstname: String(values.firstname ?? "").trim(),
    lastname: String(values.lastname ?? "").trim(),
    mobile: String(values.mobile ?? "").trim(),
    city: String(values.city ?? "").trim(),
    dateOfBirth: values.dateOfBirth ? String(values.dateOfBirth) : null,
    address: values.address ? String(values.address) : null,
    zipcode: values.zipcode ? String(values.zipcode) : null,
    work: values.work ?? null,
    notes: values.notes ?? null,
    accommodationAvailable:
      typeof values.accommodationAvailable === "boolean"
        ? values.accommodationAvailable
        : null,
  };
}

export function extractMissingFields(error: unknown): string[] | null {
  const fields = getApiFieldErrors(error);
  if (!fields) return null;
  return Object.keys(fields);
}

