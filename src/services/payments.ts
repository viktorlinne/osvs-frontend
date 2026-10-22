import api, { fetchData } from "./api";
import type {
  EventAttendanceRow,
  MembershipPayment,
  MembershipPaymentWithUser,
  OutstandingEvent,
  OutstandingEventPayment,
  OutstandingEventPayments,
  OutstandingPeriod,
} from "../types";

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

// ── Event payments (Admin/Editor) ──────────────────────────────────────────

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeOutstandingPayment(raw: unknown): OutstandingEventPayment | null {
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  const uid = Number(rec.uid);
  if (!Number.isFinite(uid)) return null;
  const lodgeName =
    typeof rec.lodgeName === "string" && rec.lodgeName.trim() ? rec.lodgeName.trim() : null;
  return {
    uid,
    firstname: String(rec.firstname ?? ""),
    lastname: String(rec.lastname ?? ""),
    lodgeName,
    amount: toNumber(rec.amount),
    rsvp: rec.rsvp === true,
    attended: rec.attended === true,
  };
}

function normalizeOutstandingEvent(raw: unknown): OutstandingEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  const id = Number(rec.id);
  if (!Number.isFinite(id)) return null;
  const lodges = Array.isArray(rec.lodges)
    ? rec.lodges
        .map((l) => {
          const lodge = (l ?? {}) as Record<string, unknown>;
          const lodgeId = Number(lodge.id);
          return Number.isFinite(lodgeId)
            ? { id: lodgeId, name: String(lodge.name ?? "") }
            : null;
        })
        .filter((l): l is { id: number; name: string } => l !== null)
    : [];
  const payments = Array.isArray(rec.payments)
    ? rec.payments
        .map(normalizeOutstandingPayment)
        .filter((p): p is OutstandingEventPayment => p !== null)
    : [];
  return {
    id,
    title: String(rec.title ?? ""),
    startDate: String(rec.startDate ?? ""),
    price: toNumber(rec.price),
    daysSinceEvent: Math.trunc(toNumber(rec.daysSinceEvent)),
    lodges,
    count: toNumber(rec.count, payments.length),
    amount: toNumber(rec.amount),
    payments,
  };
}

export type GetOutstandingEventPaymentsOpts = {
  period?: OutstandingPeriod;
  lodgeId?: number | null;
  eventId?: number | null;
};

/** Outstanding (unpaid) event payments per event, with totals. */
export async function getOutstandingEventPayments(
  opts: GetOutstandingEventPaymentsOpts = {},
): Promise<OutstandingEventPayments> {
  const params = new URLSearchParams();
  if (opts.period) params.set("period", opts.period);
  if (opts.lodgeId != null) params.set("lodgeId", String(opts.lodgeId));
  if (opts.eventId != null) params.set("eventId", String(opts.eventId));
  const qs = params.toString() ? `?${params.toString()}` : "";

  const res = await fetchData(api.get(`/payments/events/outstanding${qs}`));
  const rec = (res ?? {}) as Record<string, unknown>;
  const totals = (rec.totals ?? {}) as Record<string, unknown>;
  const period = rec.period;

  return {
    period: period === "3m" || period === "all" ? period : "12m",
    fromDate: typeof rec.fromDate === "string" ? rec.fromDate : null,
    totals: {
      events: toNumber(totals.events),
      count: toNumber(totals.count),
      amount: toNumber(totals.amount),
    },
    events: Array.isArray(rec.events)
      ? rec.events
          .map(normalizeOutstandingEvent)
          .filter((e): e is OutstandingEvent => e !== null)
      : [],
  };
}

/**
 * Marks one member's event payment paid (note optional) or reverts it to
 * unpaid (note required by the backend). Returns the updated attendance row.
 */
export async function setEventPaymentStatus(
  eventId: number,
  uid: number,
  paid: boolean,
  note?: string,
): Promise<EventAttendanceRow | null> {
  const trimmed = note?.trim() ?? "";
  const body: { paymentPaid: boolean; paymentNote?: string } = { paymentPaid: paid };
  if (trimmed) body.paymentNote = trimmed;
  const res = await fetchData(
    api.patch(
      `/events/${encodeURIComponent(String(eventId))}/attendances/${encodeURIComponent(String(uid))}`,
      body,
    ),
  );
  const row = (res as { row?: unknown } | null)?.row;
  return row && typeof row === "object" ? (row as EventAttendanceRow) : null;
}

export default {
  getMyMemberships,
  getAllMembershipPayments,
  updateMembershipPaymentStatus,
  getOutstandingEventPayments,
  setEventPaymentStatus,
};
