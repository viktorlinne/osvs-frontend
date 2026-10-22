import { Badge } from "@/components/shadcn/badge";
import type { EventAttendanceRow } from "@/types";
import { formatPaidLine } from "./paymentFormat";

type Props = {
  row: EventAttendanceRow;
  /** Admin/Editor: show the "Markera betald" / "Ångra betalning" button. */
  onAction?: (row: EventAttendanceRow) => void;
  disabled?: boolean;
};

/**
 * Payment status for one invitee: a badge, who/when and the latest note as
 * secondary text, and the mark-paid / undo action.
 */
export function PaymentStatusCell({ row, onAction, disabled = false }: Props) {
  const paid = row.paymentStatus === "Paid";
  const name = `${row.firstname} ${row.lastname}`.trim();
  const hasAudit = Boolean(row.paymentPaidAt || row.paymentPaidByName || row.paymentMethod);
  const paidLine =
    paid && hasAudit
      ? formatPaidLine({
          paidAt: row.paymentPaidAt,
          paidByName: row.paymentPaidByName,
          method: row.paymentMethod,
        })
      : null;

  return (
    <div className="flex flex-col items-start gap-1">
      <Badge variant={paid ? "success" : "neutral"}>
        {paid ? (row.paymentMethod === "swish" ? "Betald · Swish" : "Betald") : "Ej betald"}
      </Badge>
      {paidLine ? <span className="text-xs text-neutral-600">{paidLine}</span> : null}
      {row.paymentNote ? (
        <span className="line-clamp-2 text-xs text-neutral-600" title={row.paymentNote}>
          {paid ? "Anteckning" : "Ångrad"}: {row.paymentNote}
        </span>
      ) : null}
      {onAction ? (
        <button
          type="button"
          className="ui-link min-h-[44px] text-left text-xs disabled:opacity-50"
          disabled={disabled}
          aria-label={`${paid ? "Ångra betalning" : "Markera betald"} – ${name}`}
          onClick={() => onAction(row)}
        >
          {paid ? "Ångra betalning" : "Markera betald"}
        </button>
      ) : null}
    </div>
  );
}

export default PaymentStatusCell;
