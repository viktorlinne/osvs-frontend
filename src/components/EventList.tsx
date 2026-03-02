import { useEffect, useState } from "react";
import { listUpcomingEvents } from "../services/events";
import type { Event as EventRecord } from "../types";

function formatDateTimeSv(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function EventList() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setFailed(false);
      try {
        const response = await listUpcomingEvents(10);
        const rows = (response as { events?: EventRecord[] })?.events ?? [];
        if (!mounted) return;
        setEvents(Array.isArray(rows) ? rows : []);
      } catch {
        if (!mounted) return;
        setFailed(true);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <p className="text-sm text-neutral-600">Laddar mÃ¶ten...</p>;
  if (failed) {
    return <p className="text-sm text-danger-600">Kunde inte hÃ¤mta kommande mÃ¶ten</p>;
  }
  if (!events.length) {
    return <p className="text-sm text-neutral-600">Inga kommande mÃ¶ten</p>;
  }

  return (
    <ul className="space-y-2">
      {events.map((event) => (
        <li key={event.id} className="border-b border-neutral-200 pb-2">
          <p className="text-sm italic text-neutral-600">
            {formatDateTimeSv(event.startDate)}
          </p>
          <p className="text-neutral-900">{event.title}</p>
        </li>
      ))}
    </ul>
  );
}

export default EventList;
