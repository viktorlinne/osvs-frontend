import api, { fetchData } from "./api";

export async function claimUpload(
  urlOrKey: string
): Promise<{ key: string; publicUrl: string }> {
  return fetchData(api.post(`/uploads/claim`, { url: urlOrKey }));
}

export default { claimUpload };
