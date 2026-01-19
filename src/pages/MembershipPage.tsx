import { useEffect } from "react";
import { getMyMemberships } from "../services/";
import useFetch from "../hooks/useFetch";
import type { MembershipPayment } from "../types";
import { Link } from "react-router-dom";
import { Spinner } from "../components";

export const MembershipPage = () => {
  const { run, loading, data: payments, setData: setPayments } = useFetch<MembershipPayment[]>();

  useEffect(() => {
    void run(() => getMyMemberships())
      .then((res) => {
        try {
          setPayments(Array.isArray(res) ? (res as MembershipPayment[]) : []);
        } catch {
          setPayments([]);
        }
      })
      .catch(() => {
        /* useFetch handles global error */
      });
  }, [run, setPayments]);


  function formatDate(d: string | Date | null | undefined) {
    if (!d) return "";
    const dt = typeof d === "string" ? new Date(d) : d;
    if (!dt || Number.isNaN(dt.getTime())) return String(d).slice(0, 10);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Spinner /></div>;

  return (
    <div className="max-w-3xl w-full mx-auto p-6 min-h-screen flex flex-col items-center">
      <Link to=".." relative="path" className="w-full flex justify-start mb-4 text-sm text-green-600 hover:text-green-700 hover:underline">
        ← Tillbaka
      </Link>
      <h2 className="text-2xl font-bold mb-4">Medlemskaps Betalningar</h2>

      {!loading && payments && payments.length === 0 && (
        <div>Inga medlemskapsbetalningar hittades.</div>
      )}
      
      {!loading && payments && payments.length > 0 && (
        <ul className="w-full max-w-2xl space-y-2">
          {payments.map((p) => (
            <li
              key={p.id}
              className="border rounded-md p-3 flex justify-between items-center"
            >
              <div>
                <div className="font-semibold">År: {p.year}</div>
                <div>
                  Belopp: {p.amount} {p.currency}
                </div>
                <div>Status: {p.status}</div>
              </div>
              <div className="flex items-center gap-x-4 py-2">
                <div className="text-sm text-gray-500">
                  {formatDate(p.createdAt)}
                </div>
                {p.status === "Pending" && (
                  <button
                    className="bg-green-600 hover:bg-green-700 transition text-sm font-medium text-white px-3 py-2 rounded-md"
                  >
                    Betala
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
