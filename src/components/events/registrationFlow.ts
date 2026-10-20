// Pure step logic for the member event registration flow
// (Närvaro -> Mat -> Bekräfta). Kept free of React so it can be unit tested.

export type RegistrationStep = "attendance" | "food" | "confirm";

export type RegistrationDraft = {
  /** `null` until the member has chosen kommer / kommer inte. */
  rsvp: boolean | null;
  bookFood: boolean;
};

export type RegistrationFlowState = RegistrationDraft & {
  step: RegistrationStep;
};

export type SavedRegistration = {
  /** `null` when the member has not answered yet. */
  rsvp: boolean | null;
  bookFood: boolean;
};

export const STEP_LABELS: Record<RegistrationStep, string> = {
  attendance: "Närvaro",
  food: "Mat",
  confirm: "Bekräfta",
};

/** Steps shown in the progress indicator for the current choices. */
export function getVisibleSteps(
  eventHasFood: boolean,
  rsvp: boolean | null,
): RegistrationStep[] {
  if (eventHasFood && rsvp !== false) {
    return ["attendance", "food", "confirm"];
  }
  return ["attendance", "confirm"];
}

/**
 * Start (or restart) the flow. Existing values, e.g. rows prefilled from
 * Ständiga listan, are used as the starting point.
 */
export function startRegistrationFlow(
  saved: SavedRegistration | null | undefined,
  eventHasFood: boolean,
): RegistrationFlowState {
  const rsvp = saved?.rsvp ?? null;
  return {
    step: "attendance",
    rsvp,
    bookFood: eventHasFood && rsvp === true && Boolean(saved?.bookFood),
  };
}

export function chooseAttendance(
  state: RegistrationFlowState,
  rsvp: boolean,
): RegistrationFlowState {
  return {
    ...state,
    rsvp,
    // Not attending means "Äter inte" automatically.
    bookFood: rsvp ? state.bookFood : false,
  };
}

export function chooseFood(
  state: RegistrationFlowState,
  bookFood: boolean,
): RegistrationFlowState {
  if (state.rsvp !== true) return { ...state, bookFood: false };
  return { ...state, bookFood };
}

export function canGoNext(state: RegistrationFlowState): boolean {
  if (state.step === "attendance") return state.rsvp !== null;
  return state.step === "food";
}

export function goNext(
  state: RegistrationFlowState,
  eventHasFood: boolean,
): RegistrationFlowState {
  if (!canGoNext(state)) return state;
  if (state.step === "attendance") {
    // The food step is skipped when the event has no food or the member
    // does not attend.
    const showFood = eventHasFood && state.rsvp === true;
    return {
      ...state,
      bookFood: showFood ? state.bookFood : false,
      step: showFood ? "food" : "confirm",
    };
  }
  return { ...state, step: "confirm" };
}

export function goBack(
  state: RegistrationFlowState,
  eventHasFood: boolean,
): RegistrationFlowState {
  if (state.step === "confirm") {
    const showFood = eventHasFood && state.rsvp === true;
    return { ...state, step: showFood ? "food" : "attendance" };
  }
  if (state.step === "food") return { ...state, step: "attendance" };
  return state;
}

/** Payload for PUT /events/:id/registration, or null if not ready. */
export function toRegistrationPayload(
  state: RegistrationFlowState,
  eventHasFood: boolean,
): { rsvp: boolean; bookFood: boolean } | null {
  if (state.rsvp === null) return null;
  return {
    rsvp: state.rsvp,
    bookFood: eventHasFood && state.rsvp && state.bookFood,
  };
}

export function attendanceLabel(rsvp: boolean | null): string {
  if (rsvp === null) return "Inte besvarad";
  return rsvp ? "Kommer" : "Kommer inte";
}

export function foodLabel(bookFood: boolean): string {
  return bookFood ? "Äter" : "Äter inte";
}
