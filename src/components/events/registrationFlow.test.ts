import { describe, expect, it } from "vitest";
import {
  canGoNext,
  chooseAttendance,
  chooseFood,
  getVisibleSteps,
  goBack,
  goNext,
  startRegistrationFlow,
  toRegistrationPayload,
} from "./registrationFlow";

describe("registrationFlow", () => {
  it("starts at Närvaro with no choice for an unanswered member", () => {
    const state = startRegistrationFlow({ rsvp: null, bookFood: false }, true);
    expect(state).toEqual({ step: "attendance", rsvp: null, bookFood: false });
    expect(canGoNext(state)).toBe(false);
  });

  it("uses prefilled standing-list values as the starting point", () => {
    const state = startRegistrationFlow({ rsvp: true, bookFood: true }, true);
    expect(state).toEqual({ step: "attendance", rsvp: true, bookFood: true });
    expect(canGoNext(state)).toBe(true);
  });

  it("goes Närvaro -> Mat -> Bekräfta when attending an event with food", () => {
    let state = startRegistrationFlow(null, true);
    state = chooseAttendance(state, true);
    state = goNext(state, true);
    expect(state.step).toBe("food");

    state = chooseFood(state, true);
    state = goNext(state, true);
    expect(state.step).toBe("confirm");
    expect(toRegistrationPayload(state, true)).toEqual({
      rsvp: true,
      bookFood: true,
    });

    expect(goBack(state, true).step).toBe("food");
    expect(goBack(goBack(state, true), true).step).toBe("attendance");
  });

  it("skips Mat and forces Äter inte when not attending", () => {
    let state = startRegistrationFlow({ rsvp: true, bookFood: true }, true);
    state = chooseAttendance(state, false);
    expect(state.bookFood).toBe(false);

    state = goNext(state, true);
    expect(state.step).toBe("confirm");
    expect(getVisibleSteps(true, state.rsvp)).toEqual(["attendance", "confirm"]);
    expect(goBack(state, true).step).toBe("attendance");
    expect(toRegistrationPayload(state, true)).toEqual({
      rsvp: false,
      bookFood: false,
    });
  });

  it("skips Mat for events without food", () => {
    let state = startRegistrationFlow(null, false);
    state = chooseAttendance(state, true);
    state = goNext(state, false);
    expect(state.step).toBe("confirm");
    expect(getVisibleSteps(false, true)).toEqual(["attendance", "confirm"]);
    expect(toRegistrationPayload(state, false)).toEqual({
      rsvp: true,
      bookFood: false,
    });
  });

  it("ignores food choices when not attending", () => {
    const state = chooseFood(
      { step: "food", rsvp: false, bookFood: false },
      true,
    );
    expect(state.bookFood).toBe(false);
  });

  it("does not advance from Närvaro without a choice", () => {
    const state = startRegistrationFlow(null, true);
    expect(goNext(state, true)).toBe(state);
    expect(toRegistrationPayload(state, true)).toBeNull();
  });
});
