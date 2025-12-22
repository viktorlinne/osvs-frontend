import api, { fetchData } from "./api";
import type { Achievement } from "@osvs/types";

export async function listAchievements() {
  const res = await fetchData(api.get("/achievements"));
  return ((res as { achievements?: Achievement[] })?.achievements ??
    []) as Achievement[];
}

export default { listAchievements };
