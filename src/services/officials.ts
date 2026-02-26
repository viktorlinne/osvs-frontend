import api, { fetchData } from "./api";
import type { Official, OfficialHistoryItem } from "../types";

type OfficialHistoryPayload = {
  id?: unknown;
  title?: unknown;
  appointedAt?: unknown;
  unappointedAt?: unknown;
  unAppointedAt?: unknown;
};

export type MemberOfficialsResponse = {
  officials: Official[];
  officialHistory: OfficialHistoryItem[];
};

function parseOfficialHistory(value: unknown): OfficialHistoryItem[] {
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

export async function listOfficials() {
  const res = await fetchData(api.get("/officials"));
  return ((res as { officials?: Official[] })?.officials ?? []) as Official[];
}

export async function setMemberOfficials(
  matrikelnummer: string | number,
  officialIds: number[],
) {
  const res = await fetchData(
    api.put(`/officials/member/${String(matrikelnummer)}`, { officialIds }),
  );
  const payload = res as {
    officials?: Official[];
    officialHistory?: OfficialHistoryItem[];
  };
  return {
    officials: Array.isArray(payload?.officials) ? payload.officials : [],
    officialHistory: parseOfficialHistory(payload?.officialHistory),
  } as MemberOfficialsResponse;
}

export default { listOfficials, setMemberOfficials };
