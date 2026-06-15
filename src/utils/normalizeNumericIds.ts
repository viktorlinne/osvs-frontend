/** Normalize string selection ids to unique numeric ids. */
export function normalizeNumericIds(values: string[]): number[] {
  return Array.from(
    new Set(
      values
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value))
        .map((value) => Math.floor(value)),
    ),
  );
}

export default normalizeNumericIds;
