import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", false, undefined, "b")).toBe("a b");
  });

  it("lets later Tailwind utilities win", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("knows the custom rounded-card and shadow-card tokens", () => {
    expect(cn("rounded-md shadow-xs", "rounded-card shadow-card")).toBe(
      "rounded-card shadow-card",
    );
  });

  it("tells project colours apart from font sizes", () => {
    expect(cn("text-sm text-neutral-600", "text-primary-800")).toBe(
      "text-sm text-primary-800",
    );
  });

  it("keeps project ui-* component classes untouched", () => {
    expect(cn("ui-btn", "ui-btn-primary", "w-full")).toBe("ui-btn ui-btn-primary w-full");
  });
});
