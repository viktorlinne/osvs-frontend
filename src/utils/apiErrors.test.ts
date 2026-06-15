import { describe, expect, it } from "vitest";
import {
  getApiErrorMessage,
  getApiFieldErrors,
  hasApiFieldErrors,
} from "./apiErrors";

describe("apiErrors", () => {
  it("extracts field errors from API error details", () => {
    const error = {
      status: 400,
      message: "Validation failed",
      details: { fields: { email: "Ogiltig e-post" } },
    };

    expect(getApiFieldErrors(error)).toEqual({ email: "Ogiltig e-post" });
    expect(hasApiFieldErrors(error)).toBe(true);
    expect(getApiErrorMessage(error)).toBe("Validation failed");
  });

  it("returns null field errors for plain errors", () => {
    expect(getApiFieldErrors(new Error("boom"))).toBeNull();
    expect(hasApiFieldErrors(new Error("boom"))).toBe(false);
  });
});
