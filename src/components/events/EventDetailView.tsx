import { Link } from "react-router-dom";
import type { Event as EventRecord, EventAttendanceRow, Lodge } from "../../types";
import { AdminAttendances } from "./AdminAttendances";

type AttendanceField = "rsvp" | "bookFood" | "attended" | "paymentPaid";

type Props = {
  event: EventRecord;
  userCanRsvp: boolean;
  onRsvp: (status: "going" | "not-going") => void | Promise<void>;
  userCanBookFood: boolean;
  onBookFood: (bookFood: boolean) => void | Promise<void>;
  saving: boolean;
  rsvpLoading: boolean;
  rsvpStatus: string | null;
  foodLoading: boolean;
  bookFoodStatus: boolean | null;
  formatDisplayDate: (value?: string) => string;
  lodges: Lodge[] | null | undefined;
  originalLinkedIds: number[];
  isAdmin: boolean;
  attendancesLoading: boolean;
  attendances: EventAttendanceRow[] | null | undefined;
  attendanceSavingUid: number | null;
  onAttendanceToggle: (
    uid: number,
    field: AttendanceField,
    value: boolean,
  ) => void | Promise<void>;
};

export function EventDetailView({
  event,
  userCanRsvp,
  onRsvp,
  userCanBookFood,
  onBookFood,
  saving,
  rsvpLoading,
  rsvpStatus,
  foodLoading,
  bookFoodStatus,
  formatDisplayDate,
  lodges,
  originalLinkedIds,
  isAdmin,
  attendancesLoading,
  attendances,
  attendanceSavingUid,
  onAttendanceToggle,
}: Props) {
  const hasStarted = (() => {
    if (!event?.startDate) return false;
    const start = new Date(event.startDate);
    if (Number.isNaN(start.getTime())) return false;
    return start.getTime() <= Date.now();
  })();
  const canEditRsvpAndBookFood = !hasStarted;
  const canEditAttended = hasStarted;

  return (
    <div>
      {userCanRsvp && (
        <div className="mb-4">
          <div className="flex items-center gap-x-4 mb-2">
            <button
              className={`px-3 py-2 rounded-md text-white ${rsvpStatus === "going" ? "bg-green-600" : "bg-gray-400"}`}
              onClick={() => onRsvp("going")}
              disabled={saving || rsvpLoading}
            >
              Kommer
            </button>
            <button
              className={`px-3 py-2 rounded-md text-white ${rsvpStatus === "not-going" ? "bg-red-600" : "bg-gray-400"}`}
              onClick={() => onRsvp("not-going")}
              disabled={saving || rsvpLoading}
            >
              Kommer inte
            </button>
          </div>
        </div>
      )}

      {event.food && userCanBookFood && (
        <div className="mb-4">
          <div className="flex items-center gap-x-4 mb-2">
            <button
              className={`px-3 py-2 rounded-md text-white ${bookFoodStatus ? "bg-green-600" : "bg-gray-400"}`}
              onClick={() => onBookFood(true)}
              disabled={saving || foodLoading}
            >
              Boka mat
            </button>
            <button
              className={`px-3 py-2 rounded-md text-white ${bookFoodStatus === false ? "bg-red-600" : "bg-gray-400"}`}
              onClick={() => onBookFood(false)}
              disabled={saving || foodLoading}
            >
              Boka inte mat
            </button>
          </div>
        </div>
      )}

      <div className="mb-2">
        <strong>Titel:</strong> {event.title}
      </div>
      <div className="mb-2">
        <strong>Beskrivning:</strong> {event.description}
      </div>
      <div className="mb-2">
        <strong>Startdatum:</strong> {formatDisplayDate(event.startDate)}
      </div>
      <div className="mb-2">
        <strong>Slutdatum:</strong> {formatDisplayDate(event.endDate)}
      </div>
      <div className="mb-2">
        <strong>Pris:</strong> {event.price} kr
      </div>
      <div className="mb-2">
        <strong>Mat:</strong> {event.food ? "Ja" : "Nej"}
      </div>
      <div className="mb-2">
        <strong>Logemote:</strong> {event.lodgeMeeting ? "Ja" : "Nej"}
      </div>

      <div className="mb-2">
        <strong>Associerade loger:</strong>
        {Array.isArray(lodges) && originalLinkedIds.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-x-4 py-2">
            {lodges
              .filter((l) => originalLinkedIds.includes(l.id))
              .map((l) => (
                <Link
                  key={l.id}
                  to={`/lodges/${l.id}`}
                  className="text-sm text-green-600 underline mr-2"
                >
                  {l.name}
                </Link>
              ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500 mt-1">Inga kopplade loger</div>
        )}
      </div>

      <AdminAttendances
        rows={attendances}
        loading={attendancesLoading}
        isAdmin={isAdmin}
        savingUid={attendanceSavingUid}
        canEditRsvpAndBookFood={canEditRsvpAndBookFood}
        canEditAttended={canEditAttended}
        onToggle={onAttendanceToggle}
      />
    </div>
  );
}

export default EventDetailView;
