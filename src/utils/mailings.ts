import type {
  MailingCounts,
  MailingRecipientStatus,
  MailingSkipReason,
  MailingSkippedByReason,
  MailingStatus,
} from "../types";

export const MAILING_SUBJECT_MAX_LENGTH = 200;
export const MAILING_BODY_MAX_LENGTH = 20000;

const REASON_ORDER: MailingSkipReason[] = [
  "no_email",
  "placeholder",
  "archived",
  "invalid_email",
  "duplicate",
  "dev_allowlist",
];

function formatReason(reason: MailingSkipReason, count: number): string {
  switch (reason) {
    case "archived":
      return count === 1 ? "1 arkiverad" : `${count} arkiverade`;
    case "no_email":
      return `${count} saknar e-post`;
    case "placeholder":
      return `${count} har bara platshållaradress`;
    case "invalid_email":
      return `${count} har ogiltig e-post`;
    case "duplicate":
      return count === 1 ? "1 dubblett av e-postadress" : `${count} dubbletter av e-postadress`;
    case "dev_allowlist":
      return `${count} ej i MAIL_DEV_ALLOWLIST`;
  }
}

/** "3 saknar e-post, 2 arkiverade" */
export function formatSkippedReasons(skippedByReason: MailingSkippedByReason): string {
  return REASON_ORDER.filter((reason) => (skippedByReason[reason] ?? 0) > 0)
    .map((reason) => formatReason(reason, skippedByReason[reason] ?? 0))
    .join(", ");
}

export function formatRecipientCount(count: number): string {
  return count === 1 ? "1 mottagare" : `${count} mottagare`;
}

/** "Skicka till 12 mottagare?" */
export function formatConfirmQuestion(recipients: number): string {
  return `Skicka till ${formatRecipientCount(recipients)}?`;
}

export function formatPreviewSummary(recipients: number, skipped: number): string {
  if (recipients === 0) return "Ingen i gruppen kan ta emot e-post.";
  const base = `${formatRecipientCount(recipients)} får utskicket.`;
  if (skipped === 0) return base;
  return `${base} ${skipped} hoppas över:`;
}

export const MAILING_STATUS_LABEL: Record<MailingStatus, string> = {
  queued: "I kö",
  sending: "Skickas",
  done: "Klar",
  cancelled: "Avbruten",
};

export type StatusTone = "neutral" | "success" | "warning" | "danger";

export const MAILING_STATUS_TONE: Record<MailingStatus, StatusTone> = {
  queued: "neutral",
  sending: "warning",
  done: "success",
  cancelled: "danger",
};

export const RECIPIENT_STATUS_TONE: Record<MailingRecipientStatus, StatusTone> = {
  pending: "neutral",
  sending: "warning",
  sent: "success",
  failed: "danger",
  skipped: "neutral",
};

export const RECIPIENT_STATUS_LABEL: Record<MailingRecipientStatus, string> = {
  pending: "Väntar",
  sending: "Skickas",
  sent: "Skickad",
  failed: "Misslyckades",
  skipped: "Hoppades över",
};

/** "12 skickade · 3 väntar · 1 misslyckad · 5 hoppades över" (zero parts omitted). */
export function formatMailingCounts(counts: MailingCounts): string {
  const parts: string[] = [];
  parts.push(`${counts.sent} ${counts.sent === 1 ? "skickad" : "skickade"}`);
  if (counts.pending > 0) parts.push(`${counts.pending} väntar`);
  if (counts.failed > 0) {
    parts.push(`${counts.failed} ${counts.failed === 1 ? "misslyckad" : "misslyckade"}`);
  }
  if (counts.skipped > 0) parts.push(`${counts.skipped} hoppades över`);
  return parts.join(" · ");
}

export function isMailingInProgress(status: MailingStatus): boolean {
  return status === "queued" || status === "sending";
}

export function validateMailingSubject(value: string): true | string {
  const trimmed = value.trim();
  if (!trimmed) return "Ämne är obligatoriskt";
  if (trimmed.length > MAILING_SUBJECT_MAX_LENGTH) {
    return `Ämnet får vara högst ${MAILING_SUBJECT_MAX_LENGTH} tecken`;
  }
  if (/[\r\n]/.test(trimmed)) return "Ämnet får inte innehålla radbrytningar";
  return true;
}

export function validateMailingBody(value: string): true | string {
  const trimmed = value.trim();
  if (!trimmed) return "Meddelande är obligatoriskt";
  if (trimmed.length > MAILING_BODY_MAX_LENGTH) {
    return `Meddelandet får vara högst ${MAILING_BODY_MAX_LENGTH} tecken`;
  }
  return true;
}

export function formatMailingDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" });
}
