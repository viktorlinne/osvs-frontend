import api, { fetchData } from "./api";
import { readArrayField, readObjectField, readRecord } from "./parsers/response";

// Editable member history (tjänster + utmärkelser) and the per-member
// change log ("Ändringslogg"). Admin/Editor only on the backend.

export type OfficialEntry = {
  id: number;
  officialId: number;
  title: string;
  /** YYYY-MM-DD */
  appointedAt: string;
  /** YYYY-MM-DD, or null when pågående */
  unappointedAt: string | null;
};

export type AchievementEntry = {
  id: number;
  achievementId: number;
  title: string;
  /** YYYY-MM-DD */
  awardedAt: string;
};

export type ChangeLogEntityType = "official" | "achievement";
export type ChangeLogAction = "create" | "update" | "delete";

export type ChangeLogValue = {
  itemId: number | null;
  title: string | null;
  /** Start date (tjänst) or awarded date (utmärkelse), "YYYY-MM-DD ..." */
  date: string | null;
  /** End date for tjänster; null = pågående or not applicable */
  endDate: string | null;
};

export type ChangeLogEntry = {
  id: number;
  entityType: ChangeLogEntityType;
  action: ChangeLogAction;
  entryId: number;
  oldValue: ChangeLogValue | null;
  newValue: ChangeLogValue | null;
  note: string | null;
  editorId: number | null;
  editorName: string | null;
  createdAt: string;
};

export type MemberHistory = {
  officials: OfficialEntry[];
  achievements: AchievementEntry[];
};

export type OfficialEntryPayload = {
  officialId: number;
  appointedAt: string;
  unappointedAt: string | null;
  datesConfirmed: boolean;
  note?: string | null;
};

export type AchievementEntryPayload = {
  achievementId: number;
  awardedAt: string;
  note?: string | null;
};

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function toNullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function parseOfficialEntry(raw: unknown): OfficialEntry | null {
  const r = readRecord(raw);
  if (!r) return null;
  const id = toNumber(r.id);
  const officialId = toNumber(r.officialId);
  if (id === null || officialId === null) return null;
  return {
    id,
    officialId,
    title: String(r.title ?? ""),
    appointedAt: String(r.appointedAt ?? ""),
    unappointedAt: toNullableString(r.unappointedAt),
  };
}

export function parseAchievementEntry(raw: unknown): AchievementEntry | null {
  const r = readRecord(raw);
  if (!r) return null;
  const id = toNumber(r.id);
  const achievementId = toNumber(r.achievementId);
  if (id === null || achievementId === null) return null;
  return {
    id,
    achievementId,
    title: String(r.title ?? ""),
    awardedAt: String(r.awardedAt ?? ""),
  };
}

function parseChangeLogValue(
  raw: unknown,
  entityType: ChangeLogEntityType,
): ChangeLogValue | null {
  const r = readRecord(raw);
  if (!r) return null;
  return entityType === "official"
    ? {
        itemId: toNumber(r.officialId),
        title: toNullableString(r.title),
        date: toNullableString(r.appointedAt),
        endDate: toNullableString(r.unappointedAt),
      }
    : {
        itemId: toNumber(r.achievementId),
        title: toNullableString(r.title),
        date: toNullableString(r.awardedAt),
        endDate: null,
      };
}

export function parseChangeLogEntry(raw: unknown): ChangeLogEntry | null {
  const r = readRecord(raw);
  if (!r) return null;
  const id = toNumber(r.id);
  const entryId = toNumber(r.entryId);
  if (id === null || entryId === null) return null;
  const entityType: ChangeLogEntityType =
    r.entityType === "achievement" ? "achievement" : "official";
  const action: ChangeLogAction =
    r.action === "create" || r.action === "delete" ? r.action : "update";
  return {
    id,
    entityType,
    action,
    entryId,
    oldValue: parseChangeLogValue(r.oldValue, entityType),
    newValue: parseChangeLogValue(r.newValue, entityType),
    note: toNullableString(r.note),
    editorId: toNumber(r.editorId),
    editorName: toNullableString(r.editorName),
    createdAt: String(r.createdAt ?? ""),
  };
}

function compact<T>(items: Array<T | null>): T[] {
  return items.filter((item): item is T => item !== null);
}

const base = (matrikelnummer: number | string) =>
  `/users/${encodeURIComponent(String(matrikelnummer))}`;

export async function getMemberHistory(
  matrikelnummer: number | string,
): Promise<MemberHistory> {
  const res = await fetchData(api.get(`${base(matrikelnummer)}/history`));
  return {
    officials: compact(readArrayField<unknown>(res, "officials").map(parseOfficialEntry)),
    achievements: compact(
      readArrayField<unknown>(res, "achievements").map(parseAchievementEntry),
    ),
  };
}

export async function getMemberChangeLog(
  matrikelnummer: number | string,
): Promise<ChangeLogEntry[]> {
  const res = await fetchData(api.get(`${base(matrikelnummer)}/change-log`));
  return compact(readArrayField<unknown>(res, "entries").map(parseChangeLogEntry));
}

export async function createOfficialEntry(
  matrikelnummer: number | string,
  payload: OfficialEntryPayload,
): Promise<OfficialEntry | null> {
  const res = await fetchData(
    api.post(`${base(matrikelnummer)}/officials`, payload),
  );
  return parseOfficialEntry(readObjectField(res, "entry"));
}

export async function updateOfficialEntry(
  matrikelnummer: number | string,
  entryId: number,
  payload: OfficialEntryPayload,
): Promise<OfficialEntry | null> {
  const res = await fetchData(
    api.put(`${base(matrikelnummer)}/officials/${entryId}`, payload),
  );
  return parseOfficialEntry(readObjectField(res, "entry"));
}

export async function deleteOfficialEntry(
  matrikelnummer: number | string,
  entryId: number,
  note: string,
): Promise<void> {
  await fetchData(
    api.delete(`${base(matrikelnummer)}/officials/${entryId}`, {
      data: { note },
    }),
  );
}

export async function createAchievementEntry(
  matrikelnummer: number | string,
  payload: AchievementEntryPayload,
): Promise<AchievementEntry | null> {
  const res = await fetchData(
    api.post(`${base(matrikelnummer)}/achievements`, payload),
  );
  return parseAchievementEntry(readObjectField(res, "entry"));
}

export async function updateAchievementEntry(
  matrikelnummer: number | string,
  entryId: number,
  payload: AchievementEntryPayload,
): Promise<AchievementEntry | null> {
  const res = await fetchData(
    api.put(`${base(matrikelnummer)}/achievements/${entryId}`, payload),
  );
  return parseAchievementEntry(readObjectField(res, "entry"));
}

export async function deleteAchievementEntry(
  matrikelnummer: number | string,
  entryId: number,
  note: string,
): Promise<void> {
  await fetchData(
    api.delete(`${base(matrikelnummer)}/achievements/${entryId}`, {
      data: { note },
    }),
  );
}

export default {
  getMemberHistory,
  getMemberChangeLog,
  createOfficialEntry,
  updateOfficialEntry,
  deleteOfficialEntry,
  createAchievementEntry,
  updateAchievementEntry,
  deleteAchievementEntry,
};
