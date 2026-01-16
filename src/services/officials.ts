import api, { fetchData } from "./api";
import type { Official } from "../types";

export async function listAchievements() {
  const res = await fetchData(api.get("/officials"));
  return ((res as { achievements?: Official[] })?.achievements ??
    []) as Official[];
}

export default { listAchievements };
