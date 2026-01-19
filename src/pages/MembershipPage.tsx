import { useEffect, useState } from "react";
import { useError } from "../context";
import { getMyMemberships, createMembershipPayment } from "../services/stripe";
import useFetch from "../hooks/useFetch";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripeForm from "../components/StripeForm";
import type { MembershipPayment } from "../types";
import { Link } from "react-router-dom";
import { Spinner } from "../components";

export const MembershipPage = () => {
  const { run, loading, data: payments, setData: setPayments } = useFetch<MembershipPayment[]>();
  const { run: runAction } = useFetch<unknown>();
  const { setError } = useError();
  // removed unused `refreshing` state (we use `loading` and `checkoutLoading`)
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  // removed per-payment selection state; not required for simplified flow

  const stripePromise =
    typeof window !== "undefined" && import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
      ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string)
      : null;

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

  // Poll while there are pending payments so webhook-updated status becomes visible
  useEffect(() => {
    if (!payments) return;
    const hasPending = Array.isArray(payments) && payments.some((p) => p.status === "Pending");
    if (!hasPending) return;

    let mounted = true;
    const id = setInterval(() => {
      if (!mounted) return;
      void run(() => getMyMemberships())
        .then((res) => {
          if (!mounted) return;
          try {
            setPayments(Array.isArray(res) ? (res as MembershipPayment[]) : []);
          } catch {
            setPayments([]);
          }
        })
        .catch(() => { });
    }, 8000);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [payments, setPayments, run]);

  // explicit refresh handler removed — not used in current UI

  async function handlePay(payment: MembershipPayment) {
    if (checkoutLoading || showCheckout) return;
    setCheckoutLoading(true);
    try {
      const resp = await runAction(() => createMembershipPayment({ year: payment.year }));
      const cs = ((resp as Record<string, unknown>)["client_secret"] as string | undefined) ?? null;
      if (!cs) throw new Error("Missing client_secret from server");
      setClientSecret(cs);
      setShowCheckout(true);
    } catch (err) {
      setError(String(err));
    } finally {
      setCheckoutLoading(false);
    }
  }

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

      {loading && <div>Laddar…</div>}
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
                    className="bg-green-600 hover:bg-green-700 text-sm font-medium text-white px-3 py-2 rounded-md"
                    onClick={() => void handlePay(p)}
                    disabled={checkoutLoading}
                  >
                    {checkoutLoading ? "Förbereder…" : "Betala"}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {showCheckout && clientSecret && stripePromise && (
        <div className="mt-4 w-full max-w-2xl bg-gray-50 p-4 rounded-md">
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <StripeForm
              onClose={async () => {
                setShowCheckout(false);
                setClientSecret(null);
                // refresh payments
                try {
                  const res = await run(() => getMyMemberships());
                  setPayments(Array.isArray(res) ? (res as MembershipPayment[]) : []);
                } catch {
                  /* ignore */
                }
              }}
            />
          </Elements>
        </div>
      )}
    </div>
  );
};
