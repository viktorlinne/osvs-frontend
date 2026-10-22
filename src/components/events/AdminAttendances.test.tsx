import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminAttendances } from "./AdminAttendances";
import type { EventAttendanceRow } from "../../types";

const baseRow: EventAttendanceRow = {
  uid: 7,
  firstname: "Bo",
  lastname: "Ek",
  allergies: [],
  rsvp: true,
  bookFood: false,
  attended: false,
};

describe("AdminAttendances", () => {
  it("labels every checkbox with the column and member name", () => {
    render(
      <AdminAttendances
        showPayment
        rows={[{ ...baseRow, paymentStatus: null, paymentPaid: false }]}
      />,
    );
    for (const label of ["Kommer", "Boka mat", "Deltagande"]) {
      expect(screen.getByRole("checkbox", { name: `${label} – Bo Ek` })).toBeInTheDocument();
    }
    // The scrollable list is a focusable, named region.
    expect(screen.getByRole("region", { name: "Inbjudna bröder" })).toHaveAttribute(
      "tabindex",
      "0",
    );
  });

  it("shows a paid badge with who/when and the note, and an undo action", () => {
    const onPaymentAction = vi.fn();
    const row: EventAttendanceRow = {
      ...baseRow,
      paymentStatus: "Paid",
      paymentPaid: true,
      paymentPaidAt: "2026-10-22 14:05:00",
      paymentPaidByName: "Test Admin",
      paymentMethod: "manual",
      paymentNote: "Kontant vid dörren",
    };
    render(<AdminAttendances showPayment rows={[row]} onPaymentAction={onPaymentAction} />);
    expect(screen.getByRole("columnheader", { name: "Betalning" })).toBeInTheDocument();
    expect(screen.getByText("Betald")).toBeInTheDocument();
    expect(screen.getByText("Betald 2026-10-22 av Test Admin")).toBeInTheDocument();
    expect(screen.getByText(/Anteckning: Kontant vid dörren/)).toBeInTheDocument();

    screen.getByRole("button", { name: "Ångra betalning – Bo Ek" }).click();
    expect(onPaymentAction).toHaveBeenCalledWith(row);
  });

  it("marks Swish payments and offers Markera betald for unpaid rows", () => {
    render(
      <AdminAttendances
        showPayment
        onPaymentAction={vi.fn()}
        rows={[
          { ...baseRow, paymentStatus: "Paid", paymentPaid: true, paymentMethod: "swish", paymentPaidAt: "2026-10-21 09:00:00" },
          { ...baseRow, uid: 8, firstname: "Al", paymentStatus: "Pending", paymentPaid: false },
        ]}
      />,
    );
    expect(screen.getByText("Betald · Swish")).toBeInTheDocument();
    expect(screen.getByText("Betald via Swish 2026-10-21")).toBeInTheDocument();
    expect(screen.getByText("Ej betald")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Markera betald – Al Ek" })).toBeInTheDocument();
  });

  it("shows status without actions when no handler is given", () => {
    render(
      <AdminAttendances
        showPayment
        rows={[{ ...baseRow, paymentStatus: "Pending", paymentPaid: false }]}
      />,
    );
    expect(screen.getByText("Ej betald")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Markera betald/ })).toBeNull();
  });

  it("hides the payment column for members (API omits the fields)", () => {
    render(<AdminAttendances rows={[baseRow]} />);
    expect(screen.queryByRole("columnheader", { name: "Betalning" })).not.toBeInTheDocument();
    expect(screen.queryByText(/betald/i)).not.toBeInTheDocument();
    // The rest of the row is still shown.
    expect(screen.getByRole("checkbox", { name: "Kommer – Bo Ek" })).toBeInTheDocument();
  });
});
