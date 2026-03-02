import api, { fetchData } from "./api";
import type { Official, OfficialHistoryItem } from "../types";
import { parseOfficialHistory } from "./parsers/userMetadata";
import { readArrayField } from "./parsers/response";

export type MemberOfficialsResponse = {
  officials: Official[];
  officialHistory: OfficialHistoryItem[];
};

export async function listOfficials() {
  const res = await fetchData(api.get("/officials"));
  return readArrayField<Official>(res, "officials");
}

export async function setMemberOfficials(
  matrikelnummer: string | number,
  officialIds: number[],
) {
  const res = await fetchData(
    api.put(`/officials/member/${String(matrikelnummer)}`, { officialIds }),
  );
  return {
    officials: readArrayField<Official>(res, "officials"),
    officialHistory: parseOfficialHistory(
      (res as { officialHistory?: unknown })?.officialHistory,
    ),
  } as MemberOfficialsResponse;
}

export default { listOfficials, setMemberOfficials };
