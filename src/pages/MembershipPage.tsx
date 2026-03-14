import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PageContainer } from "../components";
import useFetch from "../hooks/useFetch";
import { getMyMemberships } from "../services/";
import type { MembershipPayment } from "../types";

export const MembershipPage = () => {
  const { run, loading, data: payments } = useFetch<MembershipPayment[]>();

  useEffect(() => {
    void run(() => getMyMemberships())
      .catch(() => {
        /* useFetch handles global error */
      });
  }, [run]);

  const rows = payments ?? [];

  function formatDate(d: string | Date | null | undefined) {
    if (!d) return "";
    const dt = typeof d === "string" ? new Date(d) : d;
    if (!dt || Number.isNaN(dt.getTime())) return String(d).slice(0, 10);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  return (
    <PageContainer size="md" className="ui-page">
      <Link to=".." relative="path" className="ui-link mb-4 inline-flex">
        ← Tillbaka
      </Link>
      <h2 className="ui-page-title mb-4">Medlemskaps Betalningar</h2>

      {!loading && rows.length === 0 && (
        <div className="text-neutral-600">Inga medlemskapsbetalningar hittades.</div>
      )}

      {!loading && rows.length > 0 && (
        <ul className="w-full space-y-2">
          {rows.map((p) => (
            <li key={p.id} className="ui-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-semibold text-neutral-900">År: {p.year}</div>
                <div className="text-neutral-700">Belopp: {p.amount} SEK</div>
                <div className="text-neutral-700">Status: {p.status}</div>
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <div className="text-sm text-neutral-600">{formatDate(p.createdAt)}</div>
                {p.status === "Pending" && (
                  <div className="flex items-center gap-2">
                    <button className="ui-btn ui-btn-primary ui-btn-sm">Betala</button>
                    <span className="relative flex size-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-600 opacity-75"></span>
                      <span className="relative inline-flex size-3 rounded-full bg-primary-600"></span>
                    </span>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
};
