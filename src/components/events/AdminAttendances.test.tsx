import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminAttendances } from "./AdminAttendances";

describe("AdminAttendances", () => {
  it("labels every checkbox with the column and member name", () => {
    render(
      <AdminAttendances
        rows={[
          {
            uid: 7,
            firstname: "Bo",
            lastname: "Ek",
            allergies: [],
            rsvp: true,
            bookFood: false,
            attended: false,
            paymentStatus: null,
            paymentPaid: false,
          },
        ]}
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
});
