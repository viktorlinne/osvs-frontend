import { Link } from "react-router-dom";
import type { Event as EventRecord, Lodge } from "../../types";

type EventStats = {
  stats: { invited: number; answered: number; going: number };
};

type Props = {
  event: EventRecord;
  userCanRsvp: boolean;
  onRsvp: (status: "going" | "not-going") => void | Promise<void>;
  saving: boolean;
  rsvpLoading: boolean;
  rsvpStatus: string | null;
  formatDisplayDate: (value?: string) => string;
  lodges: Lodge[] | null | undefined;
  originalLinkedIds: number[];
  isAdmin: boolean;
  statsLoading: boolean;
  statsData: EventStats | null | undefined;
};

export function EventDetailView({
  event,
  userCanRsvp,
  onRsvp,
  saving,
  rsvpLoading,
  rsvpStatus,
  formatDisplayDate,
  lodges,
  originalLinkedIds,
  isAdmin,
  statsLoading,
  statsData,
}: Props) {
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
        <strong>Logemöte:</strong> {event.lodgeMeeting ? "Ja" : "Nej"}
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

      {isAdmin && (
        <div className="mb-2">
          <strong>Statistik:</strong>
          {statsLoading ? (
            <div className="text-sm text-gray-500 mt-1">Läser statistik…</div>
          ) : statsData && statsData.stats ? (
            <div className="mt-1 text-sm text-gray-700">
              <div>Inbjudna: {statsData.stats.invited}</div>
              <div>Besvarat: {statsData.stats.answered}</div>
              <div>Kommer: {statsData.stats.going}</div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 mt-1">
              Ingen statistik tillgänglig
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default EventDetailView;

