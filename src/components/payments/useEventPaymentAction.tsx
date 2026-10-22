import { useCallback, useId, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { errorTextClass, labelClass, textareaClass } from "@/components/ui/formClasses";
import { useError } from "@/context";
import { setEventPaymentStatus } from "@/services/payments";
import type { EventAttendanceRow, EventPaymentMethod } from "@/types";
import { getApiErrorMessage, getApiFieldErrors } from "@/utils/apiErrors";
import { formatAmount } from "./paymentFormat";

export const PAYMENT_NOTE_MAX_LENGTH = 500;

export type EventPaymentTarget = {
  eventId: number;
  uid: number;
  memberName: string;
  eventTitle?: string;
  amount?: number | null;
  /** Current state: true opens "Ångra", false opens "Markera betald". */
  paid: boolean;
  method?: EventPaymentMethod | null;
};

type Options = {
  /** Called after a successful change, with the updated attendance row. */
  onSaved: (target: EventPaymentTarget, row: EventAttendanceRow | null) => void | Promise<void>;
  /** Called after a failed change (e.g. 409), so the caller can reload. */
  onFailed?: (target: EventPaymentTarget) => void | Promise<void>;
};

/**
 * Mark a member's event payment paid, or undo it, through a ConfirmDialog
 * with a note field. The note is optional when marking paid and required when
 * undoing (a correction). Success shows the standard toast; field errors stay
 * inline; other errors close the dialog and use the global banner.
 *
 *   const { requestPaymentChange, paymentDialog } = useEventPaymentAction({ onSaved });
 */
export function useEventPaymentAction({ onSaved, onFailed }: Options): {
  requestPaymentChange: (target: EventPaymentTarget) => void;
  paymentDialog: ReactNode;
} {
  const { setError } = useError();
  const [target, setTarget] = useState<EventPaymentTarget | null>(null);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const noteRef = useRef<HTMLTextAreaElement | null>(null);
  const noteId = useId();
  const noteErrorId = `${noteId}-error`;

  const requestPaymentChange = useCallback((next: EventPaymentTarget) => {
    setNote("");
    setNoteError(null);
    setTarget(next);
  }, []);

  const close = useCallback(() => {
    setTarget(null);
    setNoteError(null);
  }, []);

  async function submit() {
    if (!target || pending) return;
    const trimmed = note.trim();
    const undo = target.paid;
    if (undo && !trimmed) {
      setNoteError("Ange varför betalningen ångras.");
      noteRef.current?.focus();
      return;
    }

    setPending(true);
    try {
      const row = await setEventPaymentStatus(target.eventId, target.uid, !undo, trimmed);
      const done = target;
      close();
      toast.success("Ändringarna har sparats.");
      await onSaved(done, row);
    } catch (error: unknown) {
      const fields = getApiFieldErrors(error);
      if (fields?.paymentNote) {
        setNoteError(fields.paymentNote);
        noteRef.current?.focus();
        return;
      }
      const failed = target;
      close();
      setError(getApiErrorMessage(error) ?? "Kunde inte spara betalningen.");
      await onFailed?.(failed);
    } finally {
      setPending(false);
    }
  }

  const undo = Boolean(target?.paid);
  const name = target?.memberName ?? "";
  const amount = target?.amount != null ? ` (${formatAmount(target.amount)})` : "";
  const eventPart = target?.eventTitle ? ` för ”${target.eventTitle}”` : "";

  let description: string;
  if (!undo) {
    description = `Mötesavgiften${eventPart}${amount} för ”${name}” markeras som betald. Ditt namn och dagens datum sparas.`;
  } else if (target?.method === "swish") {
    description = `Betalningen för ”${name}”${amount} är bekräftad via Swish. Ångra bara om pengarna har betalats tillbaka. Den markeras då som obetald igen.`;
  } else {
    description = `Betalningen för ”${name}”${amount} markeras som obetald igen.`;
  }

  const paymentDialog = (
    <ConfirmDialog
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) close();
      }}
      title={undo ? "Ångra betalningen?" : "Markera betalningen som betald?"}
      description={description}
      confirmLabel={undo ? "Ångra" : "Markera betald"}
      pendingLabel="Sparar…"
      variant={undo ? "danger" : "primary"}
      pending={pending}
      onConfirm={() => void submit()}
    >
      <div className="mt-2">
        <label htmlFor={noteId} className={labelClass}>
          {undo ? "Anledning" : "Anteckning (valfritt)"}
        </label>
        <textarea
          id={noteId}
          ref={noteRef}
          rows={3}
          maxLength={PAYMENT_NOTE_MAX_LENGTH}
          value={note}
          disabled={pending}
          required={undo}
          aria-required={undo || undefined}
          aria-invalid={noteError ? true : undefined}
          aria-describedby={noteError ? noteErrorId : undefined}
          placeholder={undo ? "T.ex. fel medlem markerad" : "T.ex. Swish kontrollerad mot banken"}
          className={textareaClass}
          onChange={(event) => {
            setNote(event.target.value);
            if (noteError) setNoteError(null);
          }}
        />
        {noteError ? (
          <p id={noteErrorId} className={errorTextClass} role="alert">
            {noteError}
          </p>
        ) : null}
      </div>
    </ConfirmDialog>
  );

  return { requestPaymentChange, paymentDialog };
}

export default useEventPaymentAction;
