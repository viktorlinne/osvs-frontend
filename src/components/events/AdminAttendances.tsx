import type { EventAttendanceRow } from "../../types";
import { PaymentStatusCell } from "../payments/PaymentStatusCell";

type AttendanceField = "rsvp" | "bookFood" | "attended";

type Props = {
  rows: EventAttendanceRow[] | null | undefined;
  loading?: boolean;
  isAdmin?: boolean;
  /** Admin/Editor only: show the Betalning column. The API omits payment
   *  fields for members, so the column is hidden for them. */
  showPayment?: boolean;
  savingUid?: number | null;
  canEditRsvpAndBookFood?: boolean;
  canEditAttended?: boolean;
  onToggle?: (
    uid: number,
    field: AttendanceField,
    value: boolean,
  ) => void | Promise<void>;
  /** Admin/Editor: open the mark-paid / undo dialog for a row. */
  onPaymentAction?: (row: EventAttendanceRow) => void;
};

export function AdminAttendances({
  rows,
  loading = false,
  isAdmin = false,
  showPayment = false,
  savingUid = null,
  canEditRsvpAndBookFood = true,
  canEditAttended = true,
  onToggle,
  onPaymentAction,
}: Props) {
  const canEdit = isAdmin && typeof onToggle === "function";

  return (
    <div>
      <div className="mb-2">
        <strong>Inbjudna bröder</strong>
      </div>

      <div className="rounded-md border border-neutral-200 bg-white p-2">
        {loading ? (
          <div className="py-2 text-sm text-neutral-600">
            Laddar inbjudna…
          </div>
        ) : Array.isArray(rows) && rows.length > 0 ? (
          <div
            className="max-h-80 overflow-y-auto overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
            // Scrollable region: focusable so keyboard users can scroll it even
            // when every checkbox is disabled (members' read-only view).
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            role="region"
            aria-label="Inbjudna bröder"
          >
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-neutral-200 text-left text-neutral-600">
                  <th className="py-2 pr-3 font-medium">Namn</th>
                  <th className="py-2 pr-3 font-medium">Kommer</th>
                  <th className="py-2 pr-3 font-medium">Boka mat</th>
                  <th className="py-2 pr-3 font-medium">Allergier</th>
                  <th className="py-2 pr-3 font-medium">Deltagande</th>
                  {showPayment && (
                    <th className="py-2 pr-3 font-medium">Betalning</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const rowSaving = savingUid === row.uid;
                  const disableBase = !canEdit || rowSaving;
                  const disableRsvp = disableBase || !canEditRsvpAndBookFood;
                  const disableBookFood =
                    disableBase || !row.rsvp || !canEditRsvpAndBookFood;
                  return (
                    <tr
                      key={row.uid}
                      className="border-b border-neutral-200 last:border-b-0"
                    >
                      <td className="py-2 pr-3 break-words">
                        {row.firstname} {row.lastname}
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="checkbox"
                          checked={row.rsvp}
                          aria-label={`Kommer – ${row.firstname} ${row.lastname}`}
                          disabled={disableRsvp}
                          className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus-visible:ring-primary-600"
                          onChange={(event) =>
                            onToggle?.(row.uid, "rsvp", event.target.checked)
                          }
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="checkbox"
                          checked={row.bookFood}
                          aria-label={`Boka mat – ${row.firstname} ${row.lastname}`}
                          disabled={disableBookFood}
                          className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus-visible:ring-primary-600"
                          onChange={(event) =>
                            onToggle?.(
                              row.uid,
                              "bookFood",
                              event.target.checked,
                            )
                          }
                        />
                      </td>
                      <td className="py-2 pr-3 break-words">
                        {Array.isArray(row.allergies) &&
                        row.allergies.length > 0
                          ? row.allergies.join(", ")
                          : "-"}
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="checkbox"
                          checked={row.attended}
                          aria-label={`Deltagande – ${row.firstname} ${row.lastname}`}
                          disabled={disableBase || !canEditAttended}
                          className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus-visible:ring-primary-600"
                          onChange={(event) =>
                            onToggle?.(
                              row.uid,
                              "attended",
                              event.target.checked,
                            )
                          }
                        />
                      </td>
                      {showPayment && (
                        <td className="py-2 pr-3 align-top">
                          <PaymentStatusCell
                            row={row}
                            onAction={onPaymentAction}
                            disabled={rowSaving}
                          />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-2 text-sm text-neutral-600">
            Inga inbjudna bröder.
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminAttendances;
