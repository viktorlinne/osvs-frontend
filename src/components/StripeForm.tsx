import React, { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useError } from "../context";

export default function StripeForm({ onClose }: { onClose: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const { setError: setGlobalError } = useError();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {},
        redirect: "if_required",
      });
      if (result.error) {
        setGlobalError(result.error.message ?? "Betalning misslyckades");
      } else {
        onClose();
      }
    } catch (err) {
      setGlobalError(String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!stripe || submitting}
          className="bg-green-600 hover:bg-green-700 transition text-white px-4 py-2 rounded"
        >
          {submitting ? "Betalar…" : "Betala"}
        </button>
        <button type="button" onClick={onClose} className="bg-gray-100 hover:bg-gray-200 transition px-4 py-2 border rounded">
          Avbryt
        </button>
      </div>
    </form>
  );
}
