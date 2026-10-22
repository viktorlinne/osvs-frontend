import { Link } from "react-router-dom";
import type {
  Event as EventRecord,
  EventAttendanceRow,
  Group,
  Lodge,
} from "../../types";
import type {
  EventRegistration,
  SaveEventRegistrationBody,
} from "../../services/events";
import { AdminAttendances } from "./AdminAttendances";
import { EventRegistrationFlow } from "./EventRegistrationFlow";

type AttendanceField = "rsvp" | "bookFood" | "attended" | "paymentPaid";

type Props = {
  event: EventRecord;
  showRegistration: boolean;
  registration: EventRegistration | null;
  registrationLoading: boolean;
  canChangeRegistration: boolean;
  registrationErrors: Record<string, string>;
  onConfirmRegistration: (payload: SaveEventRegistrationBody) => Promise<boolean>;
  saving: boolean;
  formatDisplayDate: (value?: string) => string;
  lodges: Lodge[] | null | undefined;
  eventLodgeIds: number[];
  groups: Group[] | null | undefined;
  eventGroupIds: number[];
  isAdmin: boolean;
  /** Admin/Editor: may open groups (/admin/groups/:id). */
  canManageGroups?: boolean;
  /** Admin/Editor: see invitees' payment status (members never get it). */
  canViewPayments?: boolean;
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
  showRegistration,
  registration,
  registrationLoading,
  canChangeRegistration,
  registrationErrors,
  onConfirmRegistration,
  saving,
  formatDisplayDate,
  lodges,
  eventLodgeIds,
  groups,
  eventGroupIds,
  isAdmin,
  canManageGroups = false,
  canViewPayments = false,
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

      {/* ── Anmälan (Närvaro -> Mat -> Bekräfta) ── */}
      {showRegistration && (
        <div className="mt-6 border-t border-neutral-200 pt-6">
          <EventRegistrationFlow
            eventHasFood={Boolean(event.food)}
            price={Number(event.price) || 0}
            saved={registration}
            loading={registrationLoading && !registration}
            saving={saving}
            canChange={canChangeRegistration}
            fieldErrors={registrationErrors}
            onConfirm={onConfirmRegistration}
          />
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
                .map((g) =>
                  canManageGroups ? (
                    <Link
                      key={g.id}
                      to={`/admin/groups/${g.id}`}
                      className="ui-link text-sm"
                    >
                      {g.name}
                    </Link>
                  ) : (
                    <span key={g.id} className="text-sm text-neutral-900">
                      {g.name}
                    </span>
                  ),
                )}
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
          showPayment={canViewPayments}
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
