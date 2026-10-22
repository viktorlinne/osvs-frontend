import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { Toaster } from "sonner";
import ErrorContext from "../context/ErrorContext";
import type { OutstandingEventPayments } from "../types";

const paymentsMock = vi.hoisted(() => ({
  getOutstandingEventPayments: vi.fn(),
  setEventPaymentStatus: vi.fn(),
}));
vi.mock("../services/payments", () => paymentsMock);
vi.mock("../services/lodges", () => ({
  listLodges: vi.fn().mockResolvedValue([
    { id: 1, name: "Stamlogen" },
    { id: 2, name: "Regulus" },
  ]),
}));

import { EventPaymentsPage } from "./EventPaymentsPage";

const data: OutstandingEventPayments = {
  period: "12m",
  fromDate: "2025-10-22 00:00:00",
  totals: { events: 2, count: 3, amount: 1050 },
  events: [
    {
      id: 5,
      title: "Höstmöte",
      startDate: "2026-10-12 18:00:00",
      price: 350,
      daysSinceEvent: 10,
      lodges: [{ id: 1, name: "Stamlogen" }],
      count: 2,
      amount: 700,
      payments: [
        { uid: 10, firstname: "Ada", lastname: "Berg", lodgeName: "Stamlogen", amount: 350, rsvp: true, attended: false },
        { uid: 11, firstname: "Bo", lastname: "Ek", lodgeName: null, amount: 350, rsvp: false, attended: true },
      ],
    },
    {
      id: 6,
      title: "Julmöte",
      startDate: "2026-12-12 18:00:00",
      price: 350,
      daysSinceEvent: -51,
      lodges: [],
      count: 1,
      amount: 350,
      payments: [
        { uid: 12, firstname: "Cia", lastname: "Ås", lodgeName: "Regulus", amount: 350, rsvp: true, attended: false },
      ],
    },
  ],
};

const setError = vi.fn();

function renderPage() {
  render(
    <ErrorContext.Provider value={{ error: null, setError, clearError: vi.fn() }}>
      <MemoryRouter>
        <EventPaymentsPage />
      </MemoryRouter>
      <Toaster />
    </ErrorContext.Provider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  paymentsMock.getOutstandingEventPayments.mockResolvedValue(data);
  paymentsMock.setEventPaymentStatus.mockResolvedValue(null);
});

describe("EventPaymentsPage", () => {
  it("lists outstanding payments per event with totals", async () => {
    renderPage();
    expect(screen.getByLabelText("Laddar mötesavgifter")).toBeInTheDocument();

    const section = await screen.findByRole("region", { name: "Höstmöte" });
    expect(paymentsMock.getOutstandingEventPayments).toHaveBeenCalledWith({
      period: "12m",
      lodgeId: null,
    });
    expect(within(section).getByText(/för 10 dagar sedan · Stamlogen/)).toBeInTheDocument();
    expect(within(section).getByRole("link", { name: "Höstmöte" })).toHaveAttribute("href", "/events/5");
    expect(within(section).getByText("(deltog utan anmälan)")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Julmöte" })).toHaveTextContent("om 51 dagar");

    const summary = screen.getByRole("region", { name: "Totalt utestående" });
    expect(summary).toHaveTextContent(/1\s050 kr/);
    expect(summary).toHaveTextContent("3 obetalda avgifter · 2 möten");
  });

  it("filters by event on the client and by lodge on the server", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole("region", { name: "Höstmöte" });

    await user.selectOptions(screen.getByLabelText("Filtrera efter möte"), "6");
    expect(screen.queryByRole("region", { name: "Höstmöte" })).toBeNull();
    expect(screen.getByRole("region", { name: "Totalt utestående" })).toHaveTextContent(
      "1 obetald avgift · 1 möte",
    );

    await user.selectOptions(await screen.findByLabelText("Filtrera efter loge"), "2");
    await waitFor(() =>
      expect(paymentsMock.getOutstandingEventPayments).toHaveBeenLastCalledWith({
        period: "12m",
        lodgeId: 2,
      }),
    );
  });

  it("shows the empty state", async () => {
    paymentsMock.getOutstandingEventPayments.mockResolvedValue({
      ...data,
      totals: { events: 0, count: 0, amount: 0 },
      events: [],
    });
    renderPage();
    expect(
      await screen.findByText("Inga obetalda mötesavgifter. Alla som har anmält sig har betalat."),
    ).toBeInTheDocument();
  });

  it("shows an error with retry", async () => {
    const user = userEvent.setup();
    paymentsMock.getOutstandingEventPayments.mockRejectedValueOnce(new Error("nät"));
    renderPage();
    expect(await screen.findByText("Mötesavgifterna kunde inte laddas.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Försök igen" }));
    expect(await screen.findByRole("region", { name: "Höstmöte" })).toBeInTheDocument();
  });

  it("marks a payment paid after confirmation, with a toast, and moves focus", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole("region", { name: "Höstmöte" });

    await user.click(screen.getByRole("button", { name: "Markera betald – Ada Berg" }));
    const dialog = await screen.findByRole("alertdialog", {
      name: "Markera betalningen som betald?",
    });
    expect(dialog).toHaveTextContent("Mötesavgiften för ”Höstmöte” (350 kr) för ”Ada Berg”");
    // Avbryt has focus first; Avbryt changes nothing.
    expect(within(dialog).getByRole("button", { name: "Avbryt" })).toHaveFocus();

    await user.type(within(dialog).getByLabelText("Anteckning (valfritt)"), "Swish 21/10");
    await user.click(within(dialog).getByRole("button", { name: "Markera betald" }));

    await waitFor(() =>
      expect(paymentsMock.setEventPaymentStatus).toHaveBeenCalledWith(5, 10, true, "Swish 21/10"),
    );
    expect(await screen.findByText("Ändringarna har sparats.")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());

    expect(screen.queryByText("Ada Berg")).toBeNull();
    expect(screen.getByRole("region", { name: "Totalt utestående" })).toHaveTextContent(
      "2 obetalda avgifter · 2 möten",
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Markera betald – Bo Ek" })).toHaveFocus(),
    );
  });

  it("does nothing when the dialog is cancelled", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole("region", { name: "Höstmöte" });
    const opener = screen.getByRole("button", { name: "Markera betald – Cia Ås" });

    await user.click(opener);
    const dialog = await screen.findByRole("alertdialog");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(dialog).not.toBeInTheDocument());

    expect(paymentsMock.setEventPaymentStatus).not.toHaveBeenCalled();
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it("reports a conflict in the global banner and reloads", async () => {
    const user = userEvent.setup();
    paymentsMock.setEventPaymentStatus.mockRejectedValue({
      status: 409,
      message: "Betalningen är redan markerad som betald",
    });
    renderPage();
    await screen.findByRole("region", { name: "Höstmöte" });

    await user.click(screen.getByRole("button", { name: "Markera betald – Ada Berg" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Markera betald" }));

    await waitFor(() =>
      expect(setError).toHaveBeenCalledWith("Betalningen är redan markerad som betald"),
    );
    await waitFor(() => expect(paymentsMock.getOutstandingEventPayments).toHaveBeenCalledTimes(2));
  });
});
