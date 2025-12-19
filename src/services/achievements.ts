import api, { fetchData } from "./api";

export async function listAchievements() {
  const res = await fetchData(api.get("/achievements"));
  return (
    (res as { achievements?: Array<{ id: number; title: string }> })
      ?.achievements ?? []
  );
}

export default { listAchievements };
