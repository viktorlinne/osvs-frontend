import api, { fetchData } from "./api";
import type { Official } from "../types";

export async function listOfficials() {
  const res = await fetchData(api.get("/officials"));
  return ((res as { officials?: Official[] })?.officials ?? []) as Official[];
}

export async function setMemberOfficials(id: string | number, officialIds: number[]) {
  const res = await fetchData(
    api.put(`/officials/member/${String(id)}`, { officialIds })
  );
  return (res as { officials?: Official[] })?.officials ?? [];
}

export default { listOfficials, setMemberOfficials };
