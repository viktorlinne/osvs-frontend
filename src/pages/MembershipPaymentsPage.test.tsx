import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import ErrorContext from "../context/ErrorContext";

const paymentsMock = vi.hoisted(() => ({
  getAllMembershipPayments: vi.fn(),
  updateMembershipPaymentStatus: vi.fn(),
}));
vi.mock("../services/payments", () => paymentsMock);
vi.mock("../services/lodges", () => ({
  listLodges: vi.fn().mockResolvedValue([{ id: 1, name: "Stamlogen" }]),
}));

import { MembershipPaymentsPage } from "./MembershipPaymentsPage";

describe("MembershipPaymentsPage status toggle", () => {
  it("disables the row while saving so a double click sends one request", async () => {
    paymentsMock.getAllMembershipPayments.mockResolvedValue({
      payments: [
        {
          id: 3, uid: 10, year: 2026, amount: 600, status: "Pending",
          firstname: "Ada", lastname: "Berg", lodgeName: "Stamlogen",
        },
      ],
      total: 1, page: 1, pageSize: 50, totalPages: 1,
    });
    let resolveSave!: () => void;
    paymentsMock.updateMembershipPaymentStatus.mockImplementation(
      () => new Promise<void>((r) => (resolveSave = r)),
    );

    const user = userEvent.setup();
    render(
      <ErrorContext.Provider value={{ error: null, setError: vi.fn(), clearError: vi.fn() }}>
        <MemoryRouter>
          <MembershipPaymentsPage />
        </MemoryRouter>
      </ErrorContext.Provider>,
    );

    const box = await screen.findByRole("checkbox", { name: /Ada Berg, 2026/ });
    await user.dblClick(box);

    expect(paymentsMock.updateMembershipPaymentStatus).toHaveBeenCalledTimes(1);
    expect(paymentsMock.updateMembershipPaymentStatus).toHaveBeenCalledWith(3, "Paid");
    expect(box).toBeDisabled();
    expect(box).toBeChecked();

    resolveSave();
    await waitFor(() => expect(box).toBeEnabled());
    expect(box).toBeChecked();
  });
});
