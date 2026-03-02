import api, { fetchData } from "./api";
import type { Achievement } from "../types";
import { readArrayField } from "./parsers/response";

export async function listAchievements() {
  const res = await fetchData(api.get("/achievements"));
  return readArrayField<Achievement>(res, "achievements");
}

export default { listAchievements };
