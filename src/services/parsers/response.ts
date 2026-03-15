export function readRecord(source: unknown): Record<string, unknown> | null {
  if (typeof source !== "object" || source === null) return null;
  return source as Record<string, unknown>;
}

export function readArrayField<T>(source: unknown, key: string): T[] {
  const record = readRecord(source);
  const value = record?.[key];
  return Array.isArray(value) ? (value as T[]) : [];
}

export function readObjectField(
  source: unknown,
  key: string,
): Record<string, unknown> | null {
  const record = readRecord(source);
  const value = record?.[key];
  return readRecord(value);
}

export function readNumberField(source: unknown, key: string): number | null {
  const record = readRecord(source);
  const value = record?.[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function readStringField(source: unknown, key: string): string | null {
  const record = readRecord(source);
  const value = record?.[key];
  return typeof value === "string" ? value : null;
}

export function readNullableStringField(
  source: unknown,
  key: string,
): string | null {
  const record = readRecord(source);
  const value = record?.[key];
  if (value == null) return null;
  return typeof value === "string" ? value : null;
}

export function readBooleanField(source: unknown, key: string): boolean | null {
  const record = readRecord(source);
  const value = record?.[key];
  return typeof value === "boolean" ? value : null;
}
