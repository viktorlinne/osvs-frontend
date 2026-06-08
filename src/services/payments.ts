import api, { fetchData } from "./api";
import type { MembershipPayment, MembershipPaymentWithUser } from "../types";

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

type PaginatedPaymentsResponse = {
  payments?: MembershipPaymentWithUser[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
};

function normalizeMembershipPaymentWithUser(
  raw: MembershipPaymentWithUser,
): MembershipPaymentWithUser | null {
  const base = normalizeMembershipPayment(raw as MembershipPayment);
  if (!base) return null;

  const firstname = String(raw?.firstname ?? "").trim();
  const lastname = String(raw?.lastname ?? "").trim();
  if (!firstname && !lastname) return null;

  const lodgeName =
    typeof raw?.lodgeName === "string" && raw.lodgeName.trim().length > 0
      ? raw.lodgeName.trim()
      : null;

  return { ...base, firstname, lastname, lodgeName };
}

export type GetAllMembershipPaymentsOpts = {
  name?: string;
  achievementId?: number | null;
  lodgeId?: number | null;
  officialId?: number | null;
  accommodationAvailable?: boolean;
  year?: number | null;
  page?: number;
  pageSize?: number;
};

export type PaginatedMembershipPayments = {
  payments: MembershipPaymentWithUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getAllMembershipPayments(
  opts: GetAllMembershipPaymentsOpts = {},
): Promise<PaginatedMembershipPayments> {
  const params = new URLSearchParams();
  if (opts.name) params.set("name", opts.name);
  if (opts.achievementId != null) params.set("achievementId", String(opts.achievementId));
  if (opts.lodgeId != null) params.set("lodgeId", String(opts.lodgeId));
  if (opts.officialId != null) params.set("officialId", String(opts.officialId));
  if (opts.accommodationAvailable) params.set("accommodationAvailable", "true");
  if (opts.year != null) params.set("year", String(opts.year));
  if (opts.page != null) params.set("page", String(opts.page));
  if (opts.pageSize != null) params.set("pageSize", String(opts.pageSize));

  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await fetchData(api.get(`/payments/membership/admin${qs}`));
  const raw = res as PaginatedPaymentsResponse;

  const payments = Array.isArray(raw?.payments)
    ? raw.payments
        .map(normalizeMembershipPaymentWithUser)
        .filter((p): p is MembershipPaymentWithUser => p !== null)
    : [];

  return {
    payments,
    total: Number(raw?.total ?? 0) || 0,
    page: Number(raw?.page ?? 1) || 1,
    pageSize: Number(raw?.pageSize ?? 50) || 50,
    totalPages: Number(raw?.totalPages ?? 0) || 0,
  };
}

export async function updateMembershipPaymentStatus(
  id: number,
  status: "Pending" | "Paid",
): Promise<MembershipPayment | null> {
  const res = await fetchData(
    api.patch(`/payments/membership/${encodeURIComponent(String(id))}/status`, { status }),
  );
  const raw = (res as { payment?: MembershipPayment })?.payment;
  if (!raw) return null;
  return normalizeMembershipPayment(raw);
}

export default {
  getMyMemberships,
  getAllMembershipPayments,
  updateMembershipPaymentStatus,
};
