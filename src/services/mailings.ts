import api, { fetchData } from "./api";
import type {
  CreatedMailing,
  MailingCounts,
  MailingDetail,
  MailingInput,
  MailingPreview,
  MailingRecipient,
  MailingRecipientStatus,
  MailingSkipReason,
  MailingSkippedByReason,
  MailingStatus,
  MailingSummary,
} from "../types";
import { readArrayField, readObjectField, readRecord } from "./parsers/response";

const MAILING_STATUSES: MailingStatus[] = ["queued", "sending", "done", "cancelled"];
const RECIPIENT_STATUSES: MailingRecipientStatus[] = [
  "pending",
  "sending",
  "sent",
  "failed",
  "skipped",
];
const SKIP_REASONS: MailingSkipReason[] = [
  "archived",
  "no_email",
  "placeholder",
  "invalid_email",
  "duplicate",
  "dev_allowlist",
];

function toCount(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
}

function toNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function toNullableNumber(value: unknown): number | null {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseMailingStatus(value: unknown): MailingStatus {
  return MAILING_STATUSES.includes(value as MailingStatus)
    ? (value as MailingStatus)
    : "queued";
}

function parseSkippedByReason(value: unknown): MailingSkippedByReason {
  const record = readRecord(value);
  const result: MailingSkippedByReason = {};
  if (!record) return result;
  for (const reason of SKIP_REASONS) {
    const count = toCount(record[reason]);
    if (count > 0) result[reason] = count;
  }
  return result;
}

function parseCounts(value: unknown): MailingCounts {
  const record = readRecord(value);
  return {
    sent: toCount(record?.sent),
    pending: toCount(record?.pending),
    failed: toCount(record?.failed),
    skipped: toCount(record?.skipped),
  };
}

export function parseMailingPreview(source: unknown): MailingPreview {
  const preview = readObjectField(source, "preview");
  const dev = readRecord(preview?.devAllowlist);
  return {
    recipients: toCount(preview?.recipients),
    skipped: toCount(preview?.skipped),
    skippedByReason: parseSkippedByReason(preview?.skippedByReason),
    devAllowlist: { active: dev?.active === true, blocked: toCount(dev?.blocked) },
  };
}

export function parseCreatedMailing(source: unknown): CreatedMailing {
  const mailing = readObjectField(source, "mailing");
  const id = Number(mailing?.id);
  if (!mailing || !Number.isFinite(id)) throw new Error("Ogiltigt svar från servern");
  return {
    id,
    status: parseMailingStatus(mailing.status),
    queued: toCount(mailing.queued),
    skipped: toCount(mailing.skipped),
    skippedByReason: parseSkippedByReason(mailing.skippedByReason),
  };
}

function parseSummary(raw: Record<string, unknown> | null): MailingSummary | null {
  if (!raw) return null;
  const id = Number(raw.id);
  if (!Number.isFinite(id)) return null;
  return {
    id,
    groupId: toNullableNumber(raw.groupId),
    groupName: String(raw.groupName ?? ""),
    subject: String(raw.subject ?? ""),
    senderName: toNullableString(raw.senderName),
    senderEmail: toNullableString(raw.senderEmail),
    status: parseMailingStatus(raw.status),
    createdAt: String(raw.createdAt ?? ""),
    counts: parseCounts(raw.counts),
  };
}

export function parseMailings(source: unknown): MailingSummary[] {
  return readArrayField<unknown>(source, "mailings")
    .map((item) => parseSummary(readRecord(item)))
    .filter((item): item is MailingSummary => item !== null);
}

function parseRecipient(value: unknown): MailingRecipient | null {
  const raw = readRecord(value);
  if (!raw) return null;
  const id = Number(raw.id);
  if (!Number.isFinite(id)) return null;
  return {
    id,
    uid: toNullableNumber(raw.uid),
    name: toNullableString(raw.name),
    email: toNullableString(raw.email),
    status: RECIPIENT_STATUSES.includes(raw.status as MailingRecipientStatus)
      ? (raw.status as MailingRecipientStatus)
      : "pending",
    reason: toNullableString(raw.reason),
    attempts: toCount(raw.attempts),
    lastError: toNullableString(raw.lastError),
    sentAt: toNullableString(raw.sentAt),
  };
}

export function parseMailingDetail(source: unknown): MailingDetail {
  const raw = readObjectField(source, "mailing");
  const summary = parseSummary(raw);
  if (!raw || !summary) throw new Error("Ogiltigt svar från servern");
  return {
    ...summary,
    body: String(raw.body ?? ""),
    recipients: readArrayField<unknown>(raw, "recipients")
      .map(parseRecipient)
      .filter((item): item is MailingRecipient => item !== null),
  };
}

export async function getMailingPreview(groupId: number | string): Promise<MailingPreview> {
  return parseMailingPreview(await fetchData(api.get(`/groups/${groupId}/mailings/preview`)));
}

export async function createMailing(
  groupId: number | string,
  payload: MailingInput,
): Promise<CreatedMailing> {
  return parseCreatedMailing(await fetchData(api.post(`/groups/${groupId}/mailings`, payload)));
}

export async function listGroupMailings(groupId: number | string): Promise<MailingSummary[]> {
  return parseMailings(await fetchData(api.get(`/groups/${groupId}/mailings`)));
}

export async function getMailing(id: number | string): Promise<MailingDetail> {
  return parseMailingDetail(await fetchData(api.get(`/mailings/${id}`)));
}

export default {
  getMailingPreview,
  createMailing,
  listGroupMailings,
  getMailing,
};
