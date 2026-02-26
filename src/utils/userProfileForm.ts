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
  const err = error as { status?: number; details?: unknown };
  if (!(err?.status === 400 && err.details && typeof err.details === "object")) {
    return null;
  }
  const rec = err.details as Record<string, unknown>;
  const missing = Array.isArray(rec.missing) ? rec.missing : undefined;
  if (!missing) return null;
  return missing.filter((v): v is string => typeof v === "string");
}

