import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "sonner";
import ErrorContext from "@/context/ErrorContext";
import { Button } from "@/components/ui/Button";
import type { EventAttendanceRow } from "@/types";
import { useEventPaymentAction, type EventPaymentTarget } from "./useEventPaymentAction";

const paymentsMock = vi.hoisted(() => ({ setEventPaymentStatus: vi.fn() }));
vi.mock("@/services/payments", () => paymentsMock);

const target: EventPaymentTarget = {
  eventId: 5,
  uid: 308,
  memberName: "Bo Ek",
  eventTitle: "Höstmöte",
  amount: 350,
  paid: true,
  method: "manual",
};

function Harness({
  onSaved,
  initial = target,
}: {
  onSaved: (t: EventPaymentTarget, row: EventAttendanceRow | null) => void;
  initial?: EventPaymentTarget;
}) {
  const { requestPaymentChange, paymentDialog } = useEventPaymentAction({ onSaved });
  return (
    <div>
      <Button type="button" onClick={() => requestPaymentChange(initial)}>
        Öppna
      </Button>
      {paymentDialog}
    </div>
  );
}

function renderHarness(onSaved = vi.fn(), initial?: EventPaymentTarget) {
  render(
    <ErrorContext.Provider value={{ error: null, setError: vi.fn(), clearError: vi.fn() }}>
      <Harness onSaved={onSaved} initial={initial} />
      <Toaster />
    </ErrorContext.Provider>,
  );
  return onSaved;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useEventPaymentAction: undo", () => {
  it("requires a reason before calling the API", async () => {
    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByRole("button", { name: "Öppna" }));
    const dialog = await screen.findByRole("alertdialog", { name: "Ångra betalningen?" });
    const note = within(dialog).getByLabelText("Anledning");
    expect(note).toBeRequired();

    await user.click(within(dialog).getByRole("button", { name: "Ångra" }));
    expect(await within(dialog).findByText("Ange varför betalningen ångras.")).toBeInTheDocument();
    expect(note).toHaveAttribute("aria-invalid", "true");
    expect(note).toHaveFocus();
    expect(paymentsMock.setEventPaymentStatus).not.toHaveBeenCalled();
  });

  it("sends the reason, shows the toast and reports the new row", async () => {
    const user = userEvent.setup();
    const row = { uid: 308, paymentStatus: "Pending" } as EventAttendanceRow;
    paymentsMock.setEventPaymentStatus.mockResolvedValue(row);
    const onSaved = renderHarness();

    await user.click(screen.getByRole("button", { name: "Öppna" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.type(within(dialog).getByLabelText("Anledning"), "Fel medlem");
    await user.click(within(dialog).getByRole("button", { name: "Ångra" }));

    await waitFor(() =>
      expect(paymentsMock.setEventPaymentStatus).toHaveBeenCalledWith(5, 308, false, "Fel medlem"),
    );
    expect(await screen.findByText("Ändringarna har sparats.")).toBeInTheDocument();
    expect(onSaved).toHaveBeenCalledWith(target, row);
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    await waitFor(() => expect(screen.getByRole("button", { name: "Öppna" })).toHaveFocus());
  });

  it("shows the backend field error inline and keeps the dialog open", async () => {
    const user = userEvent.setup();
    paymentsMock.setEventPaymentStatus.mockRejectedValue({
      status: 400,
      message: "Formuläret innehåller fel",
      details: { fields: { paymentNote: "Anteckningen får vara högst 500 tecken" } },
    });
    const onSaved = renderHarness();

    await user.click(screen.getByRole("button", { name: "Öppna" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.type(within(dialog).getByLabelText("Anledning"), "x");
    await user.click(within(dialog).getByRole("button", { name: "Ångra" }));

    expect(
      await within(dialog).findByText("Anteckningen får vara högst 500 tecken"),
    ).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("warns before reverting a Swish payment", async () => {
    const user = userEvent.setup();
    renderHarness(vi.fn(), { ...target, method: "swish" });
    await user.click(screen.getByRole("button", { name: "Öppna" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("är bekräftad via Swish");
  });
});
