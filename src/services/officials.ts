import api, { fetchData } from "./api";
import type { Official } from "../types";

export async function listOfficials() {
  const res = await fetchData(api.get("/officials"));
  return ((res as { officials?: Official[] })?.officials ?? []) as Official[];
}

export default { listOfficials };
