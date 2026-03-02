import type { Allergy, OfficialHistoryItem } from "../../types";

type AllergyPayload = { id?: unknown; title?: unknown };
type OfficialHistoryPayload = {
  id?: unknown;
  title?: unknown;
  appointedAt?: unknown;
  unappointedAt?: unknown;
  unAppointedAt?: unknown;
};

export function parseAllergies(value: unknown): Allergy[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => entry as AllergyPayload)
    .map((entry) => ({
      id: Number(entry.id),
      title: String(entry.title ?? ""),
    }))
    .filter((entry) => Number.isFinite(entry.id) && entry.title.length > 0);
}

export function parseOfficialHistory(value: unknown): OfficialHistoryItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => entry as OfficialHistoryPayload)
    .map((entry) => ({
      id: Number(entry.id),
      title: String(entry.title ?? ""),
      appointedAt: String(entry.appointedAt ?? ""),
      unappointedAt: String(entry.unappointedAt ?? entry.unAppointedAt ?? ""),
    }))
    .filter(
      (entry) =>
        Number.isFinite(entry.id) &&
        entry.title.length > 0 &&
        entry.appointedAt.length > 0 &&
        entry.unappointedAt.length > 0,
    );
}
