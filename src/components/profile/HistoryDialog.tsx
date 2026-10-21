import { useLayoutEffect, useRef, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";

/**
 * Modal dialog used by the member history editor, built on Radix Dialog
 * (focus trap, Escape, portal, focus return). It is open while mounted.
 * It closes on Escape and on the explicit close button, but NOT on a click
 * outside, so a half-written note is not lost by accident.
 */
export function HistoryDialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  // The dialog is rendered conditionally (no Radix Trigger), so Radix has no
  // trigger to return focus to. Remember what had focus when it mounted
  // (layout effect: before Radix moves focus inside) and restore it on close.
  const returnFocusRef = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }, []);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        onInteractOutside={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const target = returnFocusRef.current;
          if (target?.isConnected) target.focus();
        }}
        onOpenAutoFocus={(event) => {
          // Prefer the first form field over the close/cancel buttons.
          const content = event.currentTarget as HTMLElement | null;
          const first =
            content?.querySelector<HTMLElement>("input, select, textarea") ??
            content?.querySelector<HTMLElement>("button");
          if (first) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export default HistoryDialog;
