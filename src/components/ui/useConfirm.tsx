import { useCallback, useRef, useState, type ReactNode } from "react";
import { ConfirmDialog, type ConfirmDialogProps } from "./ConfirmDialog";

export type ConfirmOptions = Pick<
  ConfirmDialogProps,
  "title" | "description" | "confirmLabel" | "cancelLabel" | "variant"
>;

/**
 * Promise-based replacement for `window.confirm`:
 *
 *   const { confirm, confirmDialog } = useConfirm();
 *   if (!(await confirm({ title: "Ta bort mötet?" }))) return;
 *   ...
 *   return <>{...}{confirmDialog}</>;
 *
 * Resolves true on confirm, false on Avbryt/Escape.
 */
export function useConfirm(): {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  confirmDialog: ReactNode;
} {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ title: "" });
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const settle = useCallback((value: boolean) => {
    resolveRef.current?.(value);
    resolveRef.current = null;
    setOpen(false);
  }, []);

  const confirm = useCallback((next: ConfirmOptions) => {
    // A second request while one is open cancels the first.
    resolveRef.current?.(false);
    setOptions(next);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const confirmDialog = (
    <ConfirmDialog
      {...options}
      open={open}
      onOpenChange={(next) => {
        if (!next) settle(false);
      }}
      onConfirm={() => settle(true)}
    />
  );

  return { confirm, confirmDialog };
}
