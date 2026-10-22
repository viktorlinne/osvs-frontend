import { describe, expect, it } from "vitest";
import {
  formatRegistrationClosesAt,
  isRegistrationOpenStockholm,
} from "./dateUtils";

describe("isRegistrationOpenStockholm", () => {
  it("is open until 21:00 Stockholm on a winter-time Sunday", () => {
    const closesAt = "2026-11-08 21:00:00";
    expect(
      isRegistrationOpenStockholm(closesAt, new Date("2026-11-08T19:59:59Z")),
    ).toBe(true);
    expect(
      isRegistrationOpenStockholm(closesAt, new Date("2026-11-08T20:00:00Z")),
    ).toBe(false);
  });

  it("is open until 21:00 Stockholm on the spring DST Sunday", () => {
    const closesAt = "2026-03-29 21:00:00";
    expect(
      isRegistrationOpenStockholm(closesAt, new Date("2026-03-29T18:59:59Z")),
    ).toBe(true);
    expect(
      isRegistrationOpenStockholm(closesAt, new Date("2026-03-29T19:00:00Z")),
    ).toBe(false);
  });

  it("is open until 21:00 Stockholm on the autumn DST Sunday", () => {
    const closesAt = "2026-10-25 21:00:00";
    expect(
      isRegistrationOpenStockholm(closesAt, new Date("2026-10-25T19:59:59Z")),
    ).toBe(true);
    expect(
      isRegistrationOpenStockholm(closesAt, new Date("2026-10-25T20:00:00Z")),
    ).toBe(false);
  });

  it("treats a missing cutoff as closed", () => {
    expect(isRegistrationOpenStockholm(undefined)).toBe(false);
    expect(isRegistrationOpenStockholm(null)).toBe(false);
  });
});

describe("formatRegistrationClosesAt", () => {
  it("formats the cutoff in Swedish", () => {
    expect(formatRegistrationClosesAt("2026-11-08 21:00:00")).toBe(
      "söndag 8 november kl. 21:00",
    );
  });

  it("returns an empty string for a missing value", () => {
    expect(formatRegistrationClosesAt(null)).toBe("");
  });
});
