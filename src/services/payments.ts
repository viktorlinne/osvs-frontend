import api, { fetchData } from "./api";
import type { MembershipPayment } from "../types";

type MembershipPaymentsResponse = {
  payments?: MembershipPayment[];
};

function normalizeMembershipPayment(
  raw: MembershipPayment,
): MembershipPayment | null {
  const id = Number(raw?.id);
  const uid = Number(raw?.uid);
  const amount = Number(raw?.amount);
  const year = Number(raw?.year);
  const status = String(raw?.status ?? "");

  if (
    !Number.isFinite(id) ||
    !Number.isFinite(uid) ||
    !Number.isFinite(amount) ||
    !Number.isFinite(year) ||
    !["Pending", "Paid"].includes(status)
  ) {
    return null;
  }

  return {
    id,
    uid,
    amount,
    year,
    status: status as MembershipPayment["status"],
    createdAt: String(raw?.createdAt ?? ""),
    updatedAt: String(raw?.updatedAt ?? ""),
  };
}

export async function getMyMemberships(year?: number): Promise<MembershipPayment[]> {
  const qs = year ? `?year=${encodeURIComponent(String(year))}` : "";
  const res = await fetchData(api.get(`/payments/membership${qs}`));
  const raw = (res as MembershipPaymentsResponse)?.payments;
  if (!Array.isArray(raw)) return [];

  return raw
    .map(normalizeMembershipPayment)
    .filter((payment): payment is MembershipPayment => payment !== null);
}

export default {
  getMyMemberships,
};
