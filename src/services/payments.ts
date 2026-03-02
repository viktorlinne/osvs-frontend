import api, { fetchData } from "./api";

export async function getMyMemberships(year?: number) {
  const qs = year ? `?year=${encodeURIComponent(String(year))}` : "";
  return fetchData(api.get(`/payments/membership${qs}`));
}

export default {
  getMyMemberships,
};
