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

  const showActionZone = userCanRsvp || showBookFoodButtons;

  return (
    <div>
      {/* ── Header ── */}
      <h1 className="ui-page-title">{event.title}</h1>

      {event.lodgeMeeting && (
        <span className="mt-2 inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-widest bg-primary-100 text-primary-800">
          Logemöte
        </span>
      )}

      <p className="mt-3 text-sm text-neutral-600">
        {formatDisplayDate(event.startDate)} – {formatDisplayDate(event.endDate)}
      </p>

      {/* ── Content ── */}
      {event.description && (
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
          {event.description}
        </p>
      )}

      {event.price > 0 && (
        <dl className="mt-4">
          <dt className="ui-chapter">Avgift</dt>
          <dd className="mt-0.5 text-sm font-medium text-neutral-900">{event.price} kr</dd>
        </dl>
      )}

      {/* ── Actions ── */}
      {showActionZone && (
        <div className="mt-6 border-t border-neutral-200 pt-6 flex flex-col gap-4">
          {userCanRsvp && (
            <div>
              <p className="ui-chapter mb-2">OSA</p>
              <div className="flex flex-wrap gap-2">
                <button
                  className={`ui-btn ui-btn-sm ${rsvpStatus === "going" ? "ui-btn-primary" : "ui-btn-secondary"}`}
                  onClick={() => onRsvp("going")}
                  disabled={saving || rsvpLoading}
                  aria-pressed={rsvpStatus === "going"}
                >
                  Kommer
                </button>
                <button
                  className={`ui-btn ui-btn-sm ${rsvpStatus === "not-going" ? "ui-btn-danger" : "ui-btn-secondary"}`}
                  onClick={() => onRsvp("not-going")}
                  disabled={saving || rsvpLoading}
                  aria-pressed={rsvpStatus === "not-going"}
                >
                  Kommer inte
                </button>
              </div>
              {rsvpStatus && (
                <p className="mt-1.5 text-xs text-neutral-600">
                  Du är OSA: {rsvpStatus === "going" ? "Kommer" : "Kommer inte"}
                </p>
              )}
            </div>
          )}

          {showBookFoodButtons && (
            <div>
              <p className="ui-chapter mb-2">Matbokning</p>
              <div className="flex flex-wrap gap-2">
                <button
                  className={`ui-btn ui-btn-sm ${bookFoodStatus ? "ui-btn-primary" : "ui-btn-secondary"}`}
                  onClick={() => onBookFood(true)}
                  disabled={disableBookFoodButtons}
                  aria-pressed={bookFoodStatus === true}
                >
                  Boka mat
                </button>
                <button
                  className={`ui-btn ui-btn-sm ${bookFoodStatus === false ? "ui-btn-danger" : "ui-btn-secondary"}`}
                  onClick={() => onBookFood(false)}
                  disabled={disableBookFoodButtons}
                  aria-pressed={bookFoodStatus === false}
                >
                  Boka inte mat
                </button>
              </div>
              {bookFoodStatus !== null && (
                <p className="mt-1.5 text-xs text-neutral-600">
                  Matbokning: {bookFoodStatus ? "Bokad" : "Ej bokad"}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Audience ── */}
      <div className="mt-8 flex flex-col gap-6">
        <div>
          <p className="ui-chapter mb-2">Inbjudna loger</p>
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
            <p className="text-sm text-neutral-600">Inga loger inbjudna</p>
          )}
        </div>

        <div>
          <p className="ui-chapter mb-2">Inbjudna grupper</p>
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
            <p className="text-sm text-neutral-600">Inga grupper inbjudna</p>
          )}
        </div>
      </div>

      {/* ── Admin ── */}
      <div className="mt-8">
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
    </div>
  );
}

export default EventDetailView;
