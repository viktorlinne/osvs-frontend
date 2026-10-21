import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge about the project's custom theme keys so that e.g.
// `rounded-card` and `rounded-md` (or `shadow-card` and `shadow-sm`) are
// recognised as conflicting instead of both being kept.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      rounded: [{ rounded: ["card"] }],
      shadow: [{ shadow: ["card", "card-hover"] }],
    },
  },
});

/** Merge class names, resolving conflicting Tailwind utilities (last wins). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
