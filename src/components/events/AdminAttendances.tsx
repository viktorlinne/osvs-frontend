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
      <label className="block font-medium mb-1">Admin attendances</label>
      <div className="border rounded-md p-2 bg-white max-h-80 overflow-auto">
        {loading ? (
          <div className="text-sm text-gray-500 py-2">Laser deltagare...</div>
        ) : Array.isArray(rows) && rows.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="text-left border-b">
                <th className="py-2 pr-3 font-medium">Namn</th>
                <th className="py-2 pr-3 font-medium">Allergier</th>
                <th className="py-2 pr-3 font-medium">RSVP</th>
                <th className="py-2 pr-3 font-medium">Boka mat</th>
                <th className="py-2 pr-3 font-medium">Attended</th>
                <th className="py-2 pr-3 font-medium">Payment</th>
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
                  <tr key={row.uid} className="border-b last:border-b-0">
                    <td className="py-2 pr-3">
                      {row.firstname} {row.lastname}
                    </td>
                    <td className="py-2 pr-3">
                      {Array.isArray(row.allergies) && row.allergies.length > 0
                        ? row.allergies.join(", ")
                        : "-"}
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="checkbox"
                        checked={row.rsvp}
                        disabled={disableRsvp}
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
                        onChange={(event) =>
                          onToggle?.(row.uid, "bookFood", event.target.checked)
                        }
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="checkbox"
                        checked={row.attended}
                        disabled={disableBase || !canEditAttended}
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
        ) : (
          <div className="text-sm text-gray-500 py-2">Inga inbjudna deltagare</div>
        )}
      </div>
    </div>
  );
}

export default AdminAttendances;
