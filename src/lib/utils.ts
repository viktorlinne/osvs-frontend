import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge about the project's custom theme keys (`--radius-card`,
// `--shadow-card*` in src/styles/index.css) so that e.g. `rounded-card` and
// `rounded-md` (or `shadow-card` and `shadow-xs`) are recognised as
// conflicting instead of both being kept.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ["card"],
      shadow: ["card", "card-hover"],
    },
  },
});

/** Merge class names, resolving conflicting Tailwind utilities (last wins). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
