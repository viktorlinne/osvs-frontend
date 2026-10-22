import type { EventPaymentMethod } from "../../types";

export function formatAmount(amount: number | null | undefined): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "–";
  return `${value.toLocaleString("sv-SE", { maximumFractionDigits: 2 })} kr`;
}

/** "Betald 2026-10-22 av Test Admin" / "Betald via Swish 2026-10-22" / "Betald". */
export function formatPaidLine(payment: {
  paidAt?: string | null;
  paidByName?: string | null;
  method?: EventPaymentMethod | null;
}): string {
  const date = payment.paidAt ? payment.paidAt.slice(0, 10) : "";
  if (payment.method === "swish") {
    return date ? `Betald via Swish ${date}` : "Betald via Swish";
  }
  const parts = ["Betald"];
  if (date) parts.push(date);
  if (payment.paidByName) parts.push(`av ${payment.paidByName}`);
  return parts.join(" ");
}

/** "i dag", "för 1 dag sedan", "för 12 dagar sedan", "om 3 dagar". */
export function formatDaysSince(days: number): string {
  if (days === 0) return "i dag";
  const n = Math.abs(days);
  const unit = n === 1 ? "dag" : "dagar";
  return days > 0 ? `för ${n} ${unit} sedan` : `om ${n} ${unit}`;
}
