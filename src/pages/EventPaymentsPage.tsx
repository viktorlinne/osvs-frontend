import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AsyncState, Button, PageContainer, selectClass } from "@/components";
import { SkeletonLabel, SkeletonText } from "@/components/PageSkeleton";
import { formatAmount, formatDaysSince } from "@/components/payments/paymentFormat";
import {
  useEventPaymentAction,
  type EventPaymentTarget,
} from "@/components/payments/useEventPaymentAction";
import useFetch from "@/hooks/useFetch";
import { listLodges } from "@/services/lodges";
import { getOutstandingEventPayments } from "@/services/payments";
import type {
  Lodge,
  OutstandingEvent,
  OutstandingEventPayments,
  OutstandingPeriod,
} from "@/types";

const DEFAULT_PERIOD: OutstandingPeriod = "12m";

const PERIOD_OPTIONS: Array<{ value: OutstandingPeriod; label: string }> = [
  { value: "3m", label: "Senaste 3 månaderna" },
  { value: "12m", label: "Senaste 12 månaderna" },
  { value: "all", label: "Alla datum" },
];

const headerCell =
  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-neutral-600";

function rowKey(eventId: number, uid: number) {
  return `${eventId}:${uid}`;
}

/** Drops rows marked paid on this page since the last fetch. */
function withoutPaid(
  events: OutstandingEvent[],
  paidKeys: ReadonlySet<string>,
): OutstandingEvent[] {
  if (paidKeys.size === 0) return events;
  const out: OutstandingEvent[] = [];
  for (const event of events) {
    const payments = event.payments.filter((p) => !paidKeys.has(rowKey(event.id, p.uid)));
    if (payments.length === 0) continue;
    if (payments.length === event.payments.length) {
      out.push(event);
      continue;
    }
    const cents = payments.reduce((sum, p) => sum + Math.round(p.amount * 100), 0);
    out.push({ ...event, payments, count: payments.length, amount: cents / 100 });
  }
  return out;
}

function summarize(events: OutstandingEvent[]) {
  let cents = 0;
  let count = 0;
  for (const event of events) {
    for (const p of event.payments) {
      cents += Math.round(p.amount * 100);
      count += 1;
    }
  }
  return { amount: cents / 100, count, events: events.length };
}

/**
 * "Mötesavgifter" (Admin/Editor): unpaid event fees of members who said
 * "kommer" or attended, per event, with totals for the treasurer and the
 * manual "Markera betald" action (until/alongside Swish, see SWISH.md §5).
 */
export const EventPaymentsPage = () => {
  const { run, data: result, loading } = useFetch<OutstandingEventPayments>();
  const { run: runLodges, data: lodges } = useFetch<Lodge[]>();

  const [period, setPeriod] = useState<OutstandingPeriod>(DEFAULT_PERIOD);
  const [lodgeId, setLodgeId] = useState<number | null>(null);
  const [eventId, setEventId] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [filtersError, setFiltersError] = useState(false);
  const [paidKeys, setPaidKeys] = useState<ReadonlySet<string>>(new Set());

  const actionRefs = useRef(new Map<string, HTMLButtonElement>());
  const summaryHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const pendingFocusRef = useRef<string | null>(null);

  const loadLodges = useCallback(() => {
    setFiltersError(false);
    runLodges(() => listLodges()).catch(() => setFiltersError(true));
  }, [runLodges]);

  useEffect(() => {
    loadLodges();
  }, [loadLodges]);

  const doFetch = useCallback(() => {
    setFetchError(false);
    setPaidKeys(new Set());
    return run(() =>
      getOutstandingEventPayments({ period, lodgeId }),
    );
  }, [run, period, lodgeId]);

  useEffect(() => {
    doFetch().catch(() => setFetchError(true));
  }, [doFetch]);

  const allEvents = useMemo(
    () => withoutPaid(result?.events ?? [], paidKeys),
    [result, paidKeys],
  );
  // The chosen event may disappear after a lodge/period change or once it is
  // fully paid; then show all events again.
  const selectedEventId =
    eventId !== null && allEvents.some((e) => e.id === eventId) ? eventId : null;
  const visibleEvents = useMemo(
    () =>
      selectedEventId === null
        ? allEvents
        : allEvents.filter((e) => e.id === selectedEventId),
    [allEvents, selectedEventId],
  );
  const totals = summarize(visibleEvents);

  // Move focus after a row disappears: to the next row's action, else the
  // previous one, else the summary heading.
  useEffect(() => {
    const key = pendingFocusRef.current;
    if (!key) return;
    pendingFocusRef.current = null;
    const target = key === "summary" ? null : actionRefs.current.get(key);
    (target ?? summaryHeadingRef.current)?.focus();
  }, [paidKeys]);

  function neighbourKey(target: EventPaymentTarget): string {
    const keys = visibleEvents.flatMap((e) => e.payments.map((p) => rowKey(e.id, p.uid)));
    const index = keys.indexOf(rowKey(target.eventId, target.uid));
    if (index < 0) return "summary";
    return keys[index + 1] ?? keys[index - 1] ?? "summary";
  }

  const { requestPaymentChange, paymentDialog } = useEventPaymentAction({
    onSaved: (target) => {
      pendingFocusRef.current = neighbourKey(target);
      setPaidKeys((prev) => new Set(prev).add(rowKey(target.eventId, target.uid)));
    },
    onFailed: async () => {
      await doFetch().catch(() => setFetchError(true));
    },
  });

  const hasActiveFilters =
    period !== DEFAULT_PERIOD || lodgeId !== null || selectedEventId !== null;

  function handleClearFilters() {
    setPeriod(DEFAULT_PERIOD);
    setLodgeId(null);
    setEventId(null);
  }

  return (
    <PageContainer size="xl" className="ui-page">
      <div className="mb-6">
        <h1 className="ui-page-title">Mötesavgifter</h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-600">
          Obetalda avgifter för bröder som har anmält sig till eller deltagit i ett
          möte. Markera en avgift som betald när betalningen har stämts av mot banken.
        </p>
      </div>

      <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div>
          <label htmlFor="periodFilter" className="sr-only">
            Period
          </label>
          <select
            id="periodFilter"
            value={period}
            onChange={(e) => setPeriod(e.target.value as OutstandingPeriod)}
            className={selectClass}
          >
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="lodgeFilter" className="sr-only">
            Filtrera efter loge
          </label>
          <select
            id="lodgeFilter"
            value={lodgeId ?? ""}
            onChange={(e) => setLodgeId(e.target.value ? Number(e.target.value) : null)}
            className={selectClass}
          >
            <option value="">Alla loger</option>
            {(lodges ?? []).map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="eventFilter" className="sr-only">
            Filtrera efter möte
          </label>
          <select
            id="eventFilter"
            value={selectedEventId ?? ""}
            onChange={(e) => setEventId(e.target.value ? Number(e.target.value) : null)}
            className={selectClass}
          >
            <option value="">Alla möten</option>
            {allEvents.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} ({e.startDate.slice(0, 10)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            Filter aktiva
          </span>
          <button type="button" onClick={handleClearFilters} className="ui-link text-xs">
            Rensa filter
          </button>
        </div>
      )}

      {filtersError ? (
        <div className="mb-4">
          <AsyncState
            loading={false}
            error
            errorMessage="Logefiltret kunde inte laddas."
            onRetry={loadLodges}
          />
        </div>
      ) : null}

      <AsyncState
        loading={loading}
        error={fetchError}
        errorMessage="Mötesavgifterna kunde inte laddas."
        onRetry={() => {
          void doFetch().catch(() => setFetchError(true));
        }}
        loadingFallback={
          <div className="ui-card divide-y divide-neutral-200" aria-busy="true" aria-label="Laddar mötesavgifter">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <SkeletonText width="w-40" />
                <SkeletonLabel width="w-24" />
                <SkeletonLabel width="w-16" />
              </div>
            ))}
          </div>
        }
      >
        <section aria-labelledby="outstanding-summary" className="ui-card mb-6">
          <h2
            id="outstanding-summary"
            ref={summaryHeadingRef}
            tabIndex={-1}
            className="ui-chapter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
          >
            Totalt utestående
          </h2>
          <p className="mt-1 text-2xl font-semibold text-neutral-900" aria-live="polite" aria-atomic="true">
            {formatAmount(totals.amount)}
            <span className="ml-2 align-middle text-sm font-normal text-neutral-600">
              {totals.count === 1 ? "1 obetald avgift" : `${totals.count} obetalda avgifter`}
              {" · "}
              {totals.events === 1 ? "1 möte" : `${totals.events} möten`}
            </span>
          </p>
        </section>

        {visibleEvents.length === 0 ? (
          <div className="ui-card flex flex-col gap-3 text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {hasActiveFilters
                ? "Inga obetalda avgifter matchar de valda filtren."
                : "Inga obetalda mötesavgifter. Alla som har anmält sig har betalat."}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="ui-btn ui-btn-secondary ui-btn-sm shrink-0"
              >
                Rensa filter
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {visibleEvents.map((event) => {
              const headingId = `event-payments-${event.id}`;
              const lodgeNames = event.lodges.map((l) => l.name).join(", ");
              return (
                <section
                  key={event.id}
                  aria-labelledby={headingId}
                  className="animate-step-in ui-card overflow-hidden p-0"
                >
                  <div className="flex flex-col gap-1 border-b border-neutral-200 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between">
                    <div>
                      <h2 id={headingId} className="text-lg font-semibold text-neutral-900">
                        <Link to={`/events/${event.id}`} className="ui-link">
                          {event.title}
                        </Link>
                      </h2>
                      <p className="text-sm text-neutral-600">
                        {event.startDate.slice(0, 10)} · {formatDaysSince(event.daysSinceEvent)}
                        {lodgeNames ? ` · ${lodgeNames}` : ""}
                      </p>
                    </div>
                    <p className="text-sm text-neutral-700">
                      {event.count === 1 ? "1 obetald" : `${event.count} obetalda`} ·{" "}
                      <strong className="font-semibold">{formatAmount(event.amount)}</strong>
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <caption className="sr-only">Obetalda avgifter för {event.title}</caption>
                      <thead>
                        <tr className="border-b border-neutral-200 bg-neutral-100">
                          <th scope="col" className={headerCell}>Medlem</th>
                          <th scope="col" className={headerCell}>Loge</th>
                          <th scope="col" className={`${headerCell} text-right`}>Belopp</th>
                          <th scope="col" className={`${headerCell} text-right`}>
                            <span className="sr-only">Åtgärd</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {event.payments.map((payment) => {
                          const name = `${payment.firstname} ${payment.lastname}`.trim();
                          const key = rowKey(event.id, payment.uid);
                          return (
                            <tr key={payment.uid} className="hover:bg-neutral-50">
                              <td className="px-4 py-2 font-medium text-neutral-900">
                                {name}
                                {!payment.rsvp && payment.attended ? (
                                  <span className="ml-2 text-xs font-normal text-neutral-600">
                                    (deltog utan anmälan)
                                  </span>
                                ) : null}
                              </td>
                              <td className="px-4 py-2 text-neutral-600">
                                {payment.lodgeName ?? "–"}
                              </td>
                              <td className="px-4 py-2 text-right text-neutral-900">
                                {formatAmount(payment.amount)}
                              </td>
                              <td className="px-4 py-2 text-right">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  ref={(el: HTMLButtonElement | null) => {
                                    if (el) actionRefs.current.set(key, el);
                                    else actionRefs.current.delete(key);
                                  }}
                                  aria-label={`Markera betald – ${name}`}
                                  onClick={() =>
                                    requestPaymentChange({
                                      eventId: event.id,
                                      uid: payment.uid,
                                      memberName: name,
                                      eventTitle: event.title,
                                      amount: payment.amount,
                                      paid: false,
                                    })
                                  }
                                >
                                  Markera betald
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </AsyncState>
      {paymentDialog}
    </PageContainer>
  );
};

export default EventPaymentsPage;
