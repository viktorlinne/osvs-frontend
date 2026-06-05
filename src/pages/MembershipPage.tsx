import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PageContainer } from "../components";
import useFetch from "../hooks/useFetch";
import { getMyMemberships } from "../services/";
import type { MembershipPayment } from "../types";
import { formatDate, formatAmount } from "../utils/time";

const STATUS_LABELS: Record<MembershipPayment["status"], string> = {
  Pending: "Väntande",
  Paid: "Betald",
};

function LoadingSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-card border border-neutral-200"
      aria-busy="true"
      aria-label="Laddar betalningar"
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="border-b border-neutral-200 px-5 py-4 last:border-b-0"
          aria-hidden="true"
        >
          <div className="mb-3 h-3.5 w-1/4 rounded skeleton-shimmer" />
          <div className="h-4 w-1/2 rounded skeleton-shimmer" />
        </div>
      ))}
    </div>
  );
}

export const MembershipPage = () => {
  const { run, loading, data: payments } = useFetch<MembershipPayment[]>();

  useEffect(() => {
    void run(() => getMyMemberships()).catch(() => {
      /* useFetch handles global error */
    });
  }, [run]);

  const rows = payments ?? [];
  const totalPaid = rows
    .filter((p) => p.status === "Paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPending = rows
    .filter((p) => p.status === "Pending")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <PageContainer size="md" className="ui-page">
      <Link to=".." relative="path" className="ui-link mb-4 inline-flex">
        ← Tillbaka
      </Link>
      <h2 className="ui-page-title mb-6">Betalningshistorik</h2>

      {loading && <LoadingSkeleton />}

      {!loading && rows.length === 0 && (
        <div
          className="my-12 flex flex-col items-center gap-3 text-center"
          aria-live="polite"
        >
          <span className="ui-chapter" aria-hidden="true">
            Inga betalningar
          </span>
          <p className="text-neutral-600">
            Kontakta din loge om du förväntar dig att se betalningar här.
          </p>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className="animate-step-in">
          <dl
            className="mb-6 grid grid-cols-2 gap-6 border-b border-neutral-200 pb-6"
            aria-label="Sammanfattning"
          >
            <div>
              <dt className="ui-label">Totalt betalt</dt>
              <dd className="text-lg font-semibold text-neutral-900">
                {formatAmount(totalPaid)}
              </dd>
            </div>
            {totalPending > 0 && (
              <div>
                <dt className="ui-label text-warning-600">Utestående</dt>
                <dd className="text-lg font-semibold text-warning-700">
                  {formatAmount(totalPending)}
                </dd>
              </div>
            )}
          </dl>

          <ul className="w-full space-y-3">
            {rows.map((p) => (
              <li
                key={p.id}
                className="ui-card flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <dl className="grid grid-cols-3 gap-x-4 gap-y-3">
                  <div>
                    <dt className="ui-label">År</dt>
                    <dd className="text-neutral-900">{p.year}</dd>
                  </div>
                  <div>
                    <dt className="ui-label">Belopp</dt>
                    <dd className="text-neutral-900">{formatAmount(p.amount)}</dd>
                  </div>
                  <div>
                    <dt className="ui-label">Status</dt>
                    <dd
                      className={
                        p.status === "Pending"
                          ? "font-medium text-warning-700"
                          : "text-neutral-900"
                      }
                    >
                      {STATUS_LABELS[p.status] ?? p.status}
                    </dd>
                  </div>
                </dl>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <div>
                    <dt className="ui-label sm:text-right">Registrerad</dt>
                    <dd className="text-xs text-neutral-600">
                      {formatDate(p.createdAt)}
                    </dd>
                  </div>
                  {p.status === "Pending" && (
                    <button
                      type="button"
                      className="ui-btn ui-btn-primary ui-btn-sm"
                      aria-label={`Betala avgift för år ${p.year}`}
                    >
                      Betala
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </PageContainer>
  );
};
