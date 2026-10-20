import { describe, expect, it } from "vitest";
import {
  toAdminUserProfileUpdatePayload,
  toUserProfileUpdatePayload,
} from "./userProfileForm";

const baseValues = {
  firstname: " Sven ",
  lastname: "Svensson",
  mobile: "0700000000",
  city: "Karlskrona",
  accommodationAvailable: false,
};

describe("userProfileForm payloads", () => {
  it("never sends the admin-only flags in the self-service payload", () => {
    const payload = toUserProfileUpdatePayload({
      ...baseValues,
      feeExempt: true,
      standingList: true,
    });

    expect(payload).not.toHaveProperty("feeExempt");
    expect(payload).not.toHaveProperty("standingList");
    expect(payload.firstname).toBe("Sven");
  });

  it("sends both flags as booleans in the admin payload", () => {
    expect(
      toAdminUserProfileUpdatePayload({
        ...baseValues,
        feeExempt: true,
        standingList: false,
      }),
    ).toEqual(
      expect.objectContaining({ feeExempt: true, standingList: false }),
    );

    expect(toAdminUserProfileUpdatePayload(baseValues)).toEqual(
      expect.objectContaining({ feeExempt: false, standingList: false }),
    );
  });
});
