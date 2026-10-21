import { useState } from "react";
import {
  STEP_LABELS,
  attendanceLabel,
  canGoNext,
  chooseAttendance,
  chooseFood,
  foodLabel,
  getVisibleSteps,
  goBack,
  goNext,
  startRegistrationFlow,
  toRegistrationPayload,
  type RegistrationFlowState,
  type SavedRegistration,
} from "./registrationFlow";
import { SkeletonBlock } from "../PageSkeleton";

type Props = {
  eventHasFood: boolean;
  price: number;
  saved: SavedRegistration | null;
  loading: boolean;
  saving: boolean;
  /** False when registration is closed (event started or too close). */
  canChange: boolean;
  fieldErrors: Record<string, string>;
  /** Saves attendance + food together. Resolves true on success. */
  onConfirm: (payload: { rsvp: boolean; bookFood: boolean }) => Promise<boolean>;
};

function RegistrationSummary({
  rsvp,
  bookFood,
  eventHasFood,
}: {
  rsvp: boolean | null;
  bookFood: boolean;
  eventHasFood: boolean;
}) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
      <dt className="text-neutral-600">Närvaro</dt>
      <dd className="font-medium text-neutral-900">{attendanceLabel(rsvp)}</dd>
      {eventHasFood && (
        <>
          <dt className="text-neutral-600">Mat</dt>
          <dd className="font-medium text-neutral-900">{foodLabel(bookFood)}</dd>
        </>
      )}
    </dl>
  );
}

function PaymentNotice({ price, rsvp }: { price: number; rsvp: boolean | null }) {
  // TODO(OSVS-29 payment): a payment step (Swish QR + callback) will follow
  // confirmation here for events with price > 0. Blocked on open questions;
  // until then only a neutral info text is shown.
  if (!(price > 0) || rsvp !== true) return null;
  return (
    <p className="mt-3 text-xs text-neutral-600">
      Avgift {price} kr. Betalning hanteras separat.
    </p>
  );
}

export function EventRegistrationFlow({
  eventHasFood,
  price,
  saved,
  loading,
  saving,
  canChange,
  fieldErrors,
  onConfirm,
}: Props) {
  const [flow, setFlow] = useState<RegistrationFlowState | null>(null);
  const [justConfirmed, setJustConfirmed] = useState(false);

  const savedRsvp = saved?.rsvp ?? null;
  const hasAnswer = savedRsvp !== null;

  // Unanswered members land directly in the flow; answered members (including
  // rows prefilled from Ständiga listan) see their registration and can change it.
  const active: RegistrationFlowState | null = canChange
    ? (flow ?? (hasAnswer ? null : startRegistrationFlow(saved, eventHasFood)))
    : null;

  if (loading) {
    return (
      <div aria-busy="true" aria-label="Laddar anmälan">
        <p className="ui-chapter mb-2">Anmälan</p>
        <SkeletonBlock className="h-9 w-56" />
      </div>
    );
  }

  if (!active) {
    return (
      <section aria-labelledby="registration-heading">
        <p id="registration-heading" className="ui-chapter mb-2">
          Din anmälan
        </p>
        {hasAnswer ? (
          <>
            <p className="mb-2 text-sm text-neutral-700" role="status">
              {justConfirmed
                ? "Din anmälan är bekräftad."
                : "Du är anmäld enligt nedan. Ändra om något inte stämmer."}
            </p>
            <RegistrationSummary
              rsvp={savedRsvp}
              bookFood={Boolean(saved?.bookFood)}
              eventHasFood={eventHasFood}
            />
            <PaymentNotice price={price} rsvp={savedRsvp} />
          </>
        ) : (
          <p className="text-sm text-neutral-600">Du har inte svarat.</p>
        )}
        {canChange ? (
          <button
            type="button"
            className="ui-btn ui-btn-sm ui-btn-secondary mt-3"
            onClick={() => {
              setJustConfirmed(false);
              setFlow(startRegistrationFlow(saved, eventHasFood));
            }}
          >
            Ändra anmälan
          </button>
        ) : (
          <p className="mt-2 text-xs text-neutral-600">
            Anmälan är stängd för det här mötet.
          </p>
        )}
      </section>
    );
  }

  const steps = getVisibleSteps(eventHasFood, active.rsvp);
  const payload = toRegistrationPayload(active, eventHasFood);

  async function handleConfirm() {
    if (!payload) return;
    const ok = await onConfirm(payload);
    if (ok) {
      setJustConfirmed(true);
      setFlow(null);
    }
  }

  return (
    <section aria-labelledby="registration-heading">
      <p id="registration-heading" className="ui-chapter mb-2">
        Anmälan
      </p>

      <ol className="mb-4 flex flex-wrap gap-2 text-xs" aria-label="Steg">
        {steps.map((step, index) => {
          const current = step === active.step;
          return (
            <li
              key={step}
              aria-current={current ? "step" : undefined}
              className={`rounded px-2 py-0.5 ${
                current
                  ? "bg-primary-100 font-semibold text-primary-800"
                  : "text-neutral-600"
              }`}
            >
              {index + 1}. {STEP_LABELS[step]}
            </li>
          );
        })}
      </ol>

      {active.step === "attendance" && (
        <div>
          <p className="mb-2 text-sm text-neutral-700">Kommer du på mötet?</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`ui-btn ui-btn-sm ${active.rsvp === true ? "ui-btn-primary" : "ui-btn-secondary"}`}
              aria-pressed={active.rsvp === true}
              onClick={() => setFlow(chooseAttendance(active, true))}
            >
              Kommer
            </button>
            <button
              type="button"
              className={`ui-btn ui-btn-sm ${active.rsvp === false ? "ui-btn-danger" : "ui-btn-secondary"}`}
              aria-pressed={active.rsvp === false}
              onClick={() => setFlow(chooseAttendance(active, false))}
            >
              Kommer inte
            </button>
          </div>
        </div>
      )}

      {active.step === "food" && (
        <div>
          <p className="mb-2 text-sm text-neutral-700">Äter du på mötet?</p>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-neutral-900">
            <input
              type="checkbox"
              role="switch"
              checked={active.bookFood}
              aria-checked={active.bookFood}
              className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus-visible:ring-primary-600"
              onChange={(e) => setFlow(chooseFood(active, e.target.checked))}
            />
            {foodLabel(active.bookFood)}
          </label>
        </div>
      )}

      {active.step === "confirm" && (
        <div>
          <p className="mb-2 text-sm text-neutral-700">
            Kontrollera dina val och bekräfta.
          </p>
          <RegistrationSummary
            rsvp={active.rsvp}
            bookFood={payload?.bookFood ?? false}
            eventHasFood={eventHasFood}
          />
          {fieldErrors.rsvp && <p className="ui-error">{fieldErrors.rsvp}</p>}
          {fieldErrors.bookFood && (
            <p className="ui-error">{fieldErrors.bookFood}</p>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {active.step !== "attendance" && (
          <button
            type="button"
            className="ui-btn ui-btn-sm ui-btn-secondary"
            onClick={() => setFlow(goBack(active, eventHasFood))}
            disabled={saving}
          >
            Tillbaka
          </button>
        )}
        {active.step === "confirm" ? (
          <button
            type="button"
            className="ui-btn ui-btn-sm ui-btn-primary"
            onClick={() => void handleConfirm()}
            disabled={saving || !payload}
          >
            {saving ? "Sparar…" : "Bekräfta"}
          </button>
        ) : (
          <button
            type="button"
            className="ui-btn ui-btn-sm ui-btn-primary"
            onClick={() => setFlow(goNext(active, eventHasFood))}
            disabled={!canGoNext(active)}
          >
            Nästa
          </button>
        )}
        {hasAnswer && (
          <button
            type="button"
            className="ui-btn ui-btn-sm ui-btn-secondary"
            onClick={() => setFlow(null)}
            disabled={saving}
          >
            Avbryt
          </button>
        )}
      </div>
    </section>
  );
}

export default EventRegistrationFlow;
