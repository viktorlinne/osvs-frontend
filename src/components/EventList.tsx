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

  if (loading) return <p className="text-sm text-gray-500">Laddar möten...</p>;
  if (failed) {
    return <p className="text-sm text-red-600">Kunde inte hämta kommande möten</p>;
  }
  if (!events.length) {
    return <p className="text-sm text-gray-500">Inga kommande möten</p>;
  }

  return (
    <ul className="space-y-2">
      {events.map((event) => (
        <li key={event.id} className="border-b pb-2">
          <p className="italic text-sm text-gray-600">
            {formatDateTimeSv(event.startDate)}
          </p>
          <p>{event.title}</p>
        </li>
      ))}
    </ul>
  );
}

export default EventList;
