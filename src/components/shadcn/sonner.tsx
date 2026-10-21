import type { CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/*
 * shadcn/ui Toaster (sonner) themed with the OSVS palette: white card on
 * parchment, neutral-200 border, EB Garamond, rounded-card. Sonner itself
 * honours prefers-reduced-motion and renders toasts in an aria-live region.
 */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      closeButton
      containerAriaLabel="Aviseringar"
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#1c1610",
          "--normal-border": "#e3dcd2",
          "--border-radius": "0.5rem",
          fontFamily: '"EB Garamond", Georgia, serif',
        } as CSSProperties
      }
      // A little longer than sonner's 4s default; toasts also pause on
      // hover/focus and can be reached with Alt+T.
      duration={6000}
      toastOptions={{
        closeButtonAriaLabel: "Stäng avisering",
        classNames: {
          toast: "shadow-card text-sm",
          icon: "text-primary-600",
          title: "text-sm font-semibold",
          description: "text-sm text-neutral-600",
          closeButton: "!border-neutral-200 !bg-white !text-neutral-600 hover:!bg-neutral-100",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
