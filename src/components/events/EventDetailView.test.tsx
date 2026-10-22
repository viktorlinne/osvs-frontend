import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import type { ComponentProps } from "react";
import { EventDetailView } from "./EventDetailView";

afterEach(() => cleanup());

type ViewProps = ComponentProps<typeof EventDetailView>;

function renderView(canManageGroups: boolean, extra: Partial<ViewProps> = {}) {
  const props = {
    event: {
      id: 1,
      title: "Höstmöte",
      startDate: "2026-11-01T18:00:00",
      endDate: "2026-11-01T21:00:00",
      price: 0,
      lodgeIds: [],
      groupIds: [7],
    },
    showRegistration: false,
    registration: null,
    registrationLoading: false,
    canChangeRegistration: false,
    registrationErrors: {},
    onConfirmRegistration: vi.fn(),
    saving: false,
    formatDisplayDate: (v?: string) => v ?? "",
    lodges: [],
    eventLodgeIds: [],
    groups: [{ id: 7, name: "Styrelsen", description: null, userIds: [], memberCount: 0 }],
    eventGroupIds: [7],
    isAdmin: false,
    canManageGroups,
    attendancesLoading: false,
    attendances: [],
    attendanceSavingUid: null,
    onAttendanceToggle: vi.fn(),
    hasStarted: false,
    ...extra,
  } as unknown as ViewProps;
  render(
    <MemoryRouter>
      <EventDetailView {...props} />
    </MemoryRouter>,
  );
}

describe("EventDetailView invited groups", () => {
  it("links to the admin group page for Admin/Editor", () => {
    renderView(true);
    expect(screen.getByRole("link", { name: "Styrelsen" })).toHaveAttribute(
      "href",
      "/admin/groups/7",
    );
  });

  it("shows the group name as plain text for other roles", () => {
    renderView(false);
    expect(screen.getByText("Styrelsen")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Styrelsen" })).not.toBeInTheDocument();
  });
});

describe("EventDetailView payment visibility", () => {
  const attendances = [
    { uid: 3, firstname: "Per", lastname: "Ås", allergies: [], rsvp: true, bookFood: true, attended: false },
  ];

  it("hides the Betalning column for members", () => {
    renderView(false, { attendances });
    expect(screen.getByRole("checkbox", { name: "Kommer – Per Ås" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Betalning" })).not.toBeInTheDocument();
  });

  const pricedEvent = {
    id: 1,
    title: "Höstmöte",
    description: "",
    startDate: "2026-11-01T18:00:00",
    endDate: "2026-11-01T21:00:00",
    price: 350,
    lodgeIds: [],
    groupIds: [7],
  } as ViewProps["event"];

  it("shows the Betalning column with status and action for Admin/Editor", () => {
    const onPaymentAction = vi.fn();
    renderView(true, {
      event: pricedEvent,
      canViewPayments: true,
      onPaymentAction,
      attendances: [{ ...attendances[0], paymentStatus: "Pending", paymentPaid: false }],
    });
    expect(screen.getByRole("columnheader", { name: "Betalning" })).toBeInTheDocument();
    expect(screen.getByText("Ej betald")).toBeInTheDocument();
    screen.getByRole("button", { name: "Markera betald – Per Ås" }).click();
    expect(onPaymentAction).toHaveBeenCalledWith(expect.objectContaining({ uid: 3 }));
  });

  it("hides the Betalning column for a free event without payments", () => {
    renderView(true, {
      canViewPayments: true,
      attendances: [{ ...attendances[0], paymentStatus: "Pending", paymentPaid: false }],
    });
    expect(screen.queryByRole("columnheader", { name: "Betalning" })).not.toBeInTheDocument();
  });
});
