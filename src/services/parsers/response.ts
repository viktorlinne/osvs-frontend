export function readArrayField<T>(source: unknown, key: string): T[] {
  if (typeof source !== "object" || source === null) return [];
  const value = (source as Record<string, unknown>)[key];
  return Array.isArray(value) ? (value as T[]) : [];
}
