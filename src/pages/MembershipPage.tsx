import { useEffect, useState } from "react";
import { useError } from "../context";
import { getMyMemberships, createMembershipPayment } from "../services/stripe";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripeForm from "../components/StripeForm";
import type { MembershipPayment } from "../types";

export const MembershipPage = () => {
  const [payments, setPayments] = useState<MembershipPayment[] | null>(null);
  const [loading, setLoading] = useState(false);
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
  }, [setError]);

  // Poll while there are pending payments so webhook-updated status becomes visible
  useEffect(() => {
    if (!payments) return;
    const hasPending = payments.some((p) => p.status === "Pending");
    if (!hasPending) return;

    let mounted = true;
    const id = setInterval(() => {
      if (!mounted) return;
      getMyMemberships()
        .then((res) => setPayments(res as MembershipPayment[]))
        .catch(() => {});
    }, 8000);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [payments]);

  // explicit refresh handler removed — not used in current UI

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

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-6">
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
              <div className="flex items-center gapx-4 py-2">
                <div className="text-sm text-gray-500">
                  {formatDate(p.createdAt)}
                </div>
                {p.status === "Pending" && (
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md"
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
