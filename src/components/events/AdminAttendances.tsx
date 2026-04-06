import type { EventAttendanceRow } from "../../types";

type AttendanceField = "rsvp" | "bookFood" | "attended" | "paymentPaid";

type Props = {
  rows: EventAttendanceRow[] | null | undefined;
  loading?: boolean;
  isAdmin?: boolean;
  savingUid?: number | null;
  canEditRsvpAndBookFood?: boolean;
  canEditAttended?: boolean;
  onToggle?: (
    uid: number,
    field: AttendanceField,
    value: boolean,
  ) => void | Promise<void>;
};

export function AdminAttendances({
  rows,
  loading = false,
  isAdmin = false,
  savingUid = null,
  canEditRsvpAndBookFood = true,
  canEditAttended = true,
  onToggle,
}: Props) {
  const canEdit = isAdmin && typeof onToggle === "function";

  return (
    
    <div className="mt-4">
      <strong>Alla inbjudna</strong>
      <div className="rounded-md border border-neutral-200 bg-white p-2 mt-4">
        {loading ? (
          <div className="py-2 text-sm text-neutral-600">Läser deltagare...</div>
        ) : Array.isArray(rows) && rows.length > 0 ? (
          <div className="max-h-80 overflow-y-auto overflow-x-hidden">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-neutral-200 text-left text-neutral-700">
                  <th className="py-2 pr-3 font-medium">Namn</th>
                  <th className="py-2 pr-3 font-medium">RSVP</th>
                  <th className="py-2 pr-3 font-medium">Boka mat</th>
                  <th className="py-2 pr-3 font-medium">Allergier</th>
                  <th className="py-2 pr-3 font-medium">Deltagande</th>
                  <th className="py-2 pr-3 font-medium">Betalning</th>
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
                    <tr key={row.uid} className="border-b border-neutral-200 last:border-b-0">
                      <td className="py-2 pr-3 break-words">
                        {row.firstname} {row.lastname}
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="checkbox"
                          checked={row.rsvp}
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
                          disabled={disableBookFood}
                          className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus-visible:ring-primary-600"
                          onChange={(event) =>
                            onToggle?.(row.uid, "bookFood", event.target.checked)
                          }
                        />
                      </td>
                      <td className="py-2 pr-3 break-words">
                        {Array.isArray(row.allergies) && row.allergies.length > 0
                          ? row.allergies.join(", ")
                          : "-"}
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="checkbox"
                          checked={row.attended}
                          disabled={disableBase || !canEditAttended}
                          className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus-visible:ring-primary-600"
                          onChange={(event) =>
                            onToggle?.(row.uid, "attended", event.target.checked)
                          }
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="checkbox"
                          checked={row.paymentPaid}
                          disabled={disableBase}
                          className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus-visible:ring-primary-600"
                          onChange={(event) =>
                            onToggle?.(
                              row.uid,
                              "paymentPaid",
                              event.target.checked,
                            )
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-2 text-sm text-neutral-600">Inga inbjudna deltagare</div>
        )}
      </div>
    </div>
  );
}

export default AdminAttendances;
