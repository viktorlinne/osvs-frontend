import { useCallback, useEffect, useState } from "react";
import { Button, PageContainer, inputClass, selectClass } from "../components";
import { SkeletonLabel, SkeletonText } from "../components/PageSkeleton";
import useFetch from "../hooks/useFetch";
import { listLodges } from "../services/lodges";
import {
  getAllMembershipPayments,
  updateMembershipPaymentStatus,
  type PaginatedMembershipPayments,
} from "../services/payments";
import type { MembershipPaymentWithUser } from "../types";

const PAGE_SIZE = 50;
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);


export const MembershipPaymentsPage = () => {
  const { run, data: result, loading } =
    useFetch<PaginatedMembershipPayments>();
  const { run: runLodges, data: lodges } =
    useFetch<Array<{ id: number; name: string }>>();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [lodgeId, setLodgeId] = useState<number | null>(null);
  const [year, setYear] = useState<number | null>(CURRENT_YEAR);
  const [page, setPage] = useState(1);
  const [toggleError, setToggleError] = useState<string | null>(null);

  useEffect(() => {
    runLodges(() => listLodges()).catch(() => {});
  }, [runLodges]);

  const doFetch = useCallback(
    () =>
      run(() =>
        getAllMembershipPayments({
          name: debouncedQuery || undefined,
          lodgeId,
          year,
          page,
          pageSize: PAGE_SIZE,
        }),
      ),
    [run, debouncedQuery, lodgeId, year, page],
  );

  useEffect(() => {
    doFetch().catch(() => {});
  }, [doFetch]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const [localPayments, setLocalPayments] = useState<MembershipPaymentWithUser[]>([]);

  useEffect(() => {
    setLocalPayments(result?.payments ?? []);
  }, [result]);

  async function handleStatusToggle(id: number, currentStatus: "Pending" | "Paid") {
    const nextStatus = currentStatus === "Paid" ? "Pending" : "Paid";
    setToggleError(null);
    setLocalPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: nextStatus } : p)),
    );
    try {
      await updateMembershipPaymentStatus(id, nextStatus);
    } catch {
      setLocalPayments((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: currentStatus } : p)),
      );
      setToggleError("Kunde inte uppdatera status, försök igen.");
    }
  }

  const total = result?.total ?? 0;
  const totalPages = result?.totalPages ?? 0;
  const currentPageSize = result?.pageSize ?? PAGE_SIZE;
  const from = total === 0 ? 0 : (page - 1) * currentPageSize + 1;
  const to = total === 0 ? 0 : Math.min(page * currentPageSize, total);

  const hasActiveFilters = !!(query || lodgeId || year !== CURRENT_YEAR);

  function handleClearFilters() {
    setQuery("");
    setLodgeId(null);
    setYear(CURRENT_YEAR);
    setPage(1);
  }

  return (
    <PageContainer size="xl" className="ui-page">
      <div className="mb-6">
        <h1 className="ui-page-title">Medlemsavgifter</h1>
      </div>

      <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="relative">
          <label htmlFor="search" className="sr-only">Sök på namn</label>
          <input
            id="search"
            name="search"
            type="search"
            placeholder="Sök på namn..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={inputClass}
          />
        </div>
        <select
          id="lodgeFilter"
          name="lodgeFilter"
          aria-label="Filtrera efter loge"
          value={lodgeId ?? ""}
          onChange={(e) => {
            setLodgeId(e.target.value ? Number(e.target.value) : null);
            setPage(1);
          }}
          className={selectClass}
        >
          <option value="">Alla loger</option>
          {(lodges ?? []).map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <select
          id="yearFilter"
          name="yearFilter"
          aria-label="Filtrera efter år"
          value={year ?? ""}
          onChange={(e) => {
            setYear(e.target.value ? Number(e.target.value) : null);
            setPage(1);
          }}
          className={selectClass}
        >
          <option value="">Alla år</option>
          {YEAR_OPTIONS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-neutral-600">
            Filter aktiva
          </span>
          <button
            type="button"
            onClick={handleClearFilters}
            className="ui-link text-xs"
          >
            Rensa filter
          </button>
        </div>
      )}

      {toggleError && (
        <div
          role="alert"
          className="mb-4 flex items-center justify-between rounded-md border border-danger-600/30 bg-danger-50 px-4 py-2.5 text-sm text-danger-700"
        >
          <span>{toggleError}</span>
          <button
            type="button"
            onClick={() => setToggleError(null)}
            aria-label="Stäng felmeddelande"
            className="ml-4 text-danger-600 hover:text-danger-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-600 focus-visible:ring-offset-2"
          >
            ✕
          </button>
        </div>
      )}

      {!loading && (
        <div
          className={total > 0 ? "mb-4 text-sm text-neutral-600" : "sr-only"}
          aria-live="polite"
          aria-atomic="true"
        >
          {total > 0 ? `Visar ${from}–${to} av ${total} avgifter` : "Inga avgifter hittades."}
        </div>
      )}

      {loading ? (
        <div className="ui-card divide-y divide-neutral-200">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <div className="h-4 w-4 shrink-0 rounded border border-neutral-300 bg-neutral-100" />
              <SkeletonText width="w-36" />
              <SkeletonLabel width="w-24" />
              <SkeletonLabel width="w-16" />
            </div>
          ))}
        </div>
      ) : localPayments.length === 0 ? (
        <div className="ui-card flex flex-col gap-3 text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {hasActiveFilters
              ? "Inga avgifter matchar de valda filtren."
              : "Inga avgifter hittades."}
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
        <div className="animate-step-in ui-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-neutral-600">
                    Betald
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-neutral-600">
                    Namn
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-neutral-600">
                    Loge
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-neutral-600">
                    År
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-neutral-600">
                    Belopp
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {localPayments.map((payment) => (
                  <PaymentRow
                    key={payment.id}
                    payment={payment}
                    onToggle={handleStatusToggle}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-neutral-600">{`Sida ${page} av ${totalPages}`}</div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={loading || page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Föregående
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={loading || page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Nästa
            </Button>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

function PaymentRow({
  payment,
  onToggle,
}: {
  payment: MembershipPaymentWithUser;
  onToggle: (id: number, current: "Pending" | "Paid") => void;
}) {
  const isPaid = payment.status === "Paid";
  return (
    <tr className="hover:bg-neutral-50">
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={isPaid}
          onChange={() => onToggle(payment.id, payment.status)}
          aria-label={`${payment.firstname} ${payment.lastname}, ${payment.year}: ${isPaid ? "Betald" : "Väntande"}`}
          className="h-4 w-4 cursor-pointer rounded border-neutral-300 text-primary-600 focus-visible:ring-primary-600"
        />
      </td>
      <td className="px-4 py-3 font-medium text-neutral-900">
        {payment.firstname} {payment.lastname}
      </td>
      <td className="px-4 py-3 text-neutral-600">
        {payment.lodgeName ?? <span className="text-neutral-400">—</span>}
      </td>
      <td className="px-4 py-3 text-neutral-600">{payment.year}</td>
      <td className="px-4 py-3 text-right text-neutral-600">
        {payment.amount.toLocaleString("sv-SE")} kr
      </td>
    </tr>
  );
}
