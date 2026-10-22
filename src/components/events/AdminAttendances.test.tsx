import { describe, expect, it } from "vitest";
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
    for (const label of ["RSVP", "Boka mat", "Deltagande", "Betalning"]) {
      expect(screen.getByRole("checkbox", { name: `${label} – Bo Ek` })).toBeInTheDocument();
    }
    // The scrollable list is a focusable, named region.
    expect(screen.getByRole("region", { name: "Inbjudna medlemmar" })).toHaveAttribute(
      "tabindex",
      "0",
    );
  });

  it("shows the payment column with its state for Admin/Editor", () => {
    render(
      <AdminAttendances
        showPayment
        rows={[{ ...baseRow, paymentStatus: "Paid", paymentPaid: true }]}
      />,
    );
    expect(screen.getByRole("columnheader", { name: "Betalning" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Betalning – Bo Ek" })).toBeChecked();
  });

  it("hides the payment column for members (API omits the fields)", () => {
    render(<AdminAttendances rows={[baseRow]} />);
    expect(screen.queryByRole("columnheader", { name: "Betalning" })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /Betalning/ })).not.toBeInTheDocument();
    // The rest of the row is still shown.
    expect(screen.getByRole("checkbox", { name: "RSVP – Bo Ek" })).toBeInTheDocument();
  });
});
