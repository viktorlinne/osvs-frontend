import { useLayoutEffect, useRef, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shadcn/alert-dialog";
import { Button } from "./Button";

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  /** Label of the confirming button. Default "Ta bort". */
  confirmLabel?: string;
  /** Label shown while `pending` (e.g. "Tar bort…"). Defaults to confirmLabel. */
  pendingLabel?: string;
  /** Default "Avbryt". */
  cancelLabel?: string;
  /** "danger" for destructive actions (default), "primary" otherwise. */
  variant?: "danger" | "primary";
  /** While true the dialog cannot be dismissed and the confirm button spins. */
  pending?: boolean;
  /**
   * Called when the user confirms. The dialog does NOT close by itself: the
   * caller closes it (onOpenChange(false) / open=false) when done, so it can
   * show `pending` while the request runs.
   */
  onConfirm: () => void;
  /** Optional extra content between the text and the buttons (e.g. a note field). */
  children?: ReactNode;
};

/**
 * Accessible confirmation dialog (Radix AlertDialog): role="alertdialog",
 * focus starts on Avbryt, Escape cancels, no dismissal on outside click,
 * focus returns to the element that opened it.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Ta bort",
  pendingLabel,
  cancelLabel = "Avbryt",
  variant = "danger",
  pending = false,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  // Controlled without a Radix Trigger: remember the opener ourselves so
  // focus can be returned to it when the dialog closes.
  const returnFocusRef = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (open && document.activeElement instanceof HTMLElement) {
      returnFocusRef.current = document.activeElement;
    }
  }, [open]);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (pending && !next) return;
        onOpenChange(next);
      }}
    >
      <AlertDialogContent
        // Without a description, opt out of aria-describedby explicitly.
        {...(description ? {} : { "aria-describedby": undefined })}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const target = returnFocusRef.current;
          if (target?.isConnected) target.focus();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
          <Button type="button" variant={variant} loading={pending} onClick={onConfirm}>
            {pending && pendingLabel ? pendingLabel : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ConfirmDialog;
