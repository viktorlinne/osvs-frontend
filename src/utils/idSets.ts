/**
 * Ids from an API list field such as `allergies` or `officials`, which may
 * hold objects with an `id` or plain ids. Returns [] for anything else.
 */
export function idsFromField(field: unknown): number[] {
  if (!Array.isArray(field)) return [];
  return field
    .map((item) => {
      if (typeof item === "object" && item !== null && "id" in item) {
        return Number((item as { id?: unknown }).id);
      }
      return Number(item);
    })
    .filter((value) => Number.isFinite(value));
}

/** True when both lists contain the same ids, ignoring order and duplicates. */
export function sameIds(a: readonly number[], b: readonly number[]): boolean {
  const left = new Set(a);
  const right = new Set(b);
  if (left.size !== right.size) return false;
  for (const id of left) if (!right.has(id)) return false;
  return true;
}

/** A selection is changed only when it was touched (non-null) and differs. */
export function selectionChanged(
  selected: readonly number[] | null | undefined,
  initial: readonly number[],
): boolean {
  return Array.isArray(selected) && !sameIds(selected, initial);
}
