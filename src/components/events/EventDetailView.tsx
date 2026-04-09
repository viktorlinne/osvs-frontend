import { Link } from "react-router-dom";
import type {
  Event as EventRecord,
  EventAttendanceRow,
  Group,
  Lodge,
} from "../../types";
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
  eventLodgeIds: number[];
  groups: Group[] | null | undefined;
  eventGroupIds: number[];
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
  eventLodgeIds,
  groups,
  eventGroupIds,
  isAdmin,
  attendancesLoading,
  attendances,
  attendanceSavingUid,
  onAttendanceToggle,
  hasStarted,
}: Props) {
  const canEditRsvpAndBookFood = !hasStarted;
  const canEditAttended = hasStarted;
  const showBookFoodButtons = event.food;
  const disableBookFoodButtons = saving || foodLoading || !userCanBookFood;

  return (
    <div>
        <div className="ui-page-title mb-2">{event.title}</div>
        <div className="text-neutral-600 underline mb-2">
          {event.lodgeMeeting
            ? "Detta är ett logemöte"
            : "Detta är inte ett logemöte"}
      </div>
      <div className="mb-2 text-neutral-600 italic">
        {formatDisplayDate(event.startDate)} -{" "}
        {formatDisplayDate(event.endDate)}
      </div>
      <div className="mb-2 whitespace-pre-line text-neutral-600">
        {event.description}
      </div>
      {(userCanRsvp || showBookFoodButtons) && (
        <div className="flex flex-col gap-2 lg:ml-auto lg:items-start">
          {userCanRsvp && (
            <div className="flex flex-col gap-2 mb-2 sm:flex-row">
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
          )}

          {showBookFoodButtons && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                className={`ui-btn ui-btn-sm ${bookFoodStatus ? "ui-btn-primary" : "ui-btn-secondary"}`}
                onClick={() => onBookFood(true)}
                disabled={disableBookFoodButtons}
              >
                Boka mat
              </button>
              <button
                className={`ui-btn ui-btn-sm ${bookFoodStatus === false ? "ui-btn-danger" : "ui-btn-secondary"}`}
                onClick={() => onBookFood(false)}
                disabled={disableBookFoodButtons}
              >
                Boka inte mat
              </button>
            </div>
          )}
        </div>
      )}
      <div className="mb-2 text-neutral-600"> {event.price > 0 ? `${event.price} kr` : ""}</div>

      <div className="mb-2">
        <strong className="text-neutral-900">Inbjudna loger:</strong>
        {Array.isArray(lodges) && eventLodgeIds.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {lodges
              .filter((l) => eventLodgeIds.includes(l.id))
              .map((l) => (
                <Link
                  key={l.id}
                  to={`/lodges/${l.id}`}
                  className="ui-link text-sm"
                >
                  {l.name}
                </Link>
              ))}
          </div>
        ) : (
          <div className="text-sm text-neutral-600">
            Inga loger inbjudna
          </div>
        )}
      </div>

      <div className="mb-2">
        <strong className="text-neutral-900">Inbjudna grupper:</strong>
        {Array.isArray(groups) && eventGroupIds.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {groups
              .filter((g) => eventGroupIds.includes(g.id))
              .map((g) => (
                <Link
                  key={g.id}
                  to={`/groups/${g.id}`}
                  className="ui-link text-sm"
                >
                  {g.name}
                </Link>
              ))}
          </div>
        ) : (
          <div className="text-sm text-neutral-600">
            Inga grupper inbjudna
          </div>
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
