export function normalizeSelectionIds(
  input?: Array<string | number> | string | number | null,
): string[] {
  if (input == null) return [];
  const raw = Array.isArray(input) ? input : [input];
  return Array.from(
    new Set(
      raw
        .map((value) => String(value ?? "").trim())
        .filter((value) => value.length > 0),
    ),
  );
}

export function normalizeLodgeIds(
  input?: Array<string | number> | string | number | null,
): string[] {
  return normalizeSelectionIds(input);
}
