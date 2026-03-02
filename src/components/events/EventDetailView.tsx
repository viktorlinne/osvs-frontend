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
  hasStarted: boolean;
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
  hasStarted,
}: Props) {
  const canEditRsvpAndBookFood = !hasStarted;
  const canEditAttended = hasStarted;

  return (
    <div>
      {userCanRsvp && (
        <div className="mb-4">
          <div className="mb-2 flex flex-col gap-2 sm:flex-row">
            <button
              className={`ui-btn ui-btn-sm ${rsvpStatus === "going" ? "ui-btn-primary" : "ui-btn-secondary"}`}
              onClick={() => onRsvp("going")}
              disabled={saving || rsvpLoading}
            >
              Kommer
            </button>
            <button
              className={`ui-btn ui-btn-sm ${rsvpStatus === "not-going" ? "ui-btn-danger" : "ui-btn-secondary"}`}
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
          <div className="mb-2 flex flex-col gap-2 sm:flex-row">
            <button
              className={`ui-btn ui-btn-sm ${bookFoodStatus ? "ui-btn-primary" : "ui-btn-secondary"}`}
              onClick={() => onBookFood(true)}
              disabled={saving || foodLoading}
            >
              Boka mat
            </button>
            <button
              className={`ui-btn ui-btn-sm ${bookFoodStatus === false ? "ui-btn-danger" : "ui-btn-secondary"}`}
              onClick={() => onBookFood(false)}
              disabled={saving || foodLoading}
            >
              Boka inte mat
            </button>
          </div>
        </div>
      )}

      <div className="mb-2 text-neutral-700">
        <strong className="text-neutral-900">Titel:</strong> {event.title}
      </div>
      <div className="mb-2 text-neutral-700">
        <strong className="text-neutral-900">Beskrivning:</strong> {event.description}
      </div>
      <div className="mb-2 text-neutral-700">
        <strong className="text-neutral-900">Startdatum:</strong> {formatDisplayDate(event.startDate)}
      </div>
      <div className="mb-2 text-neutral-700">
        <strong className="text-neutral-900">Slutdatum:</strong> {formatDisplayDate(event.endDate)}
      </div>
      <div className="mb-2 text-neutral-700">
        <strong className="text-neutral-900">Pris:</strong> {event.price} kr
      </div>
      <div className="mb-2 text-neutral-700">
        <strong className="text-neutral-900">Mat:</strong> {event.food ? "Ja" : "Nej"}
      </div>
      <div className="mb-2 text-neutral-700">
        <strong className="text-neutral-900">Logemote:</strong> {event.lodgeMeeting ? "Ja" : "Nej"}
      </div>

      <div className="mb-2 text-neutral-700">
        <strong className="text-neutral-900">Associerade loger:</strong>
        {Array.isArray(lodges) && originalLinkedIds.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-2 py-2">
            {lodges
              .filter((l) => originalLinkedIds.includes(l.id))
              .map((l) => (
                <Link key={l.id} to={`/lodges/${l.id}`} className="ui-link text-sm">
                  {l.name}
                </Link>
              ))}
          </div>
        ) : (
          <div className="mt-1 text-sm text-neutral-600">Inga kopplade loger</div>
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
