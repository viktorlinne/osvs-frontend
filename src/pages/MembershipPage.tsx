import { useEffect, useState } from "react";
import { getMyMemberships, createMembershipPayment } from "../services/stripe";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripeForm from "../components/StripeForm";
import type { MembershipPayment } from "../types";

export const MembershipPage = () => {
  const [payments, setPayments] = useState<MembershipPayment[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(
    null
  );

  const stripePromise =
    typeof window !== "undefined" && import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
      ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string)
      : null;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getMyMemberships()
      .then((res) => {
        if (!mounted) return;
        setPayments(res as MembershipPayment[]);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(String(err?.message ?? err));
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Poll while there are pending payments so webhook-updated status becomes visible
  useEffect(() => {
    if (!payments) return;
    const hasPending = payments.some((p) => p.status === "Pending");
    if (!hasPending) return;

    let mounted = true;
    const id = setInterval(() => {
      if (!mounted) return;
      setRefreshing(true);
      getMyMemberships()
        .then((res) => setPayments(res as MembershipPayment[]))
        .catch(() => {})
        .finally(() => mounted && setRefreshing(false));
    }, 8000);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [payments]);

  function handleRefresh() {
    setRefreshing(true);
    getMyMemberships()
      .then((res) => setPayments(res as MembershipPayment[]))
      .catch((err) => setError(String(err?.message ?? err)))
      .finally(() => setRefreshing(false));
  }

  async function handlePay(payment: MembershipPayment) {
    if (checkoutLoading || showCheckout) return;
    setCheckoutLoading(true);
    try {
      const resp = await createMembershipPayment({ year: payment.year });
      const cs =
        ((resp as Record<string, unknown>)["client_secret"] as
          | string
          | undefined) ?? null;
      if (!cs) throw new Error("Missing client_secret from server");
      setClientSecret(cs);
      setSelectedPaymentId(payment.id);
      setShowCheckout(true);
    } catch (err) {
      setError(String(err));
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-6">
      <h2 className="text-2xl font-bold mb-4">Membership Payments</h2>
      {loading && <div>Loading…</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && payments && payments.length === 0 && (
        <div>No membership payments found.</div>
      )}
      {!loading && payments && payments.length > 0 && (
        <ul className="w-full max-w-2xl space-y-2">
          {payments.map((p) => (
            <li
              key={p.id}
              className="border rounded p-3 flex justify-between items-center"
            >
              <div>
                <div className="font-semibold">Year: {p.year}</div>
                <div>
                  Amount: {p.amount} {p.currency}
                </div>
                <div>Status: {p.status}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-500">{p.createdAt}</div>
                {p.status === "Pending" && (
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
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
        <div className="mt-4 w-full max-w-2xl bg-gray-50 p-4 rounded">
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <StripeForm
              onClose={async () => {
                setShowCheckout(false);
                setClientSecret(null);
                setSelectedPaymentId(null);
                // refresh payments
                try {
                  const res = await getMyMemberships();
                  setPayments(res as MembershipPayment[]);
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
