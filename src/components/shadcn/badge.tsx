import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/*
 * shadcn/ui Badge adapted to the OSVS register style: small, uppercase,
 * tracked label on a pale tint (not a pill). Status is always carried by the
 * text, never by colour alone.
 */
const badgeVariants = cva(
  "inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold uppercase tracking-widest",
  {
    variants: {
      variant: {
        neutral: "border-neutral-200 bg-neutral-100 text-neutral-700",
        success: "border-primary-200 bg-primary-50 text-primary-800",
        warning: "border-warning-600/30 bg-warning-50 text-warning-700",
        danger: "border-danger-600/30 bg-danger-50 text-danger-700",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge };
