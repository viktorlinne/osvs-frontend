import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import ErrorContext from "../context/ErrorContext";

const groupsMock = vi.hoisted(() => ({
  createGroup: vi.fn(),
  listGroups: vi.fn(),
}));
vi.mock("../services/groups", () => groupsMock);

import { GroupsPage } from "./GroupsPage";

function renderPage() {
  render(
    <ErrorContext.Provider value={{ error: null, setError: vi.fn(), clearError: vi.fn() }}>
      <MemoryRouter>
        <GroupsPage />
      </MemoryRouter>
    </ErrorContext.Provider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GroupsPage empty states", () => {
  it("offers to create the first group", async () => {
    const user = userEvent.setup();
    groupsMock.listGroups.mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText(/Det finns inga grupper ännu/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Skapa grupp" }));
    expect(screen.getByRole("heading", { name: "Skapa grupp" })).toBeInTheDocument();
    // The create form is open, so the empty-state button is gone.
    expect(screen.queryByRole("button", { name: "Skapa grupp" })).not.toBeInTheDocument();
  });

  it("offers to clear a search without results", async () => {
    const user = userEvent.setup();
    groupsMock.listGroups.mockResolvedValue([
      { id: 1, name: "Styrelsen", description: null, userIds: [], memberCount: 0 },
    ]);
    renderPage();
    await screen.findByText("Styrelsen");

    await user.type(screen.getByLabelText("Sök på namn"), "xyz");
    expect(screen.getByText("Inga grupper matchade sökningen.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Skapa grupp" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Rensa sökning" }));
    expect(screen.getByText("Styrelsen")).toBeInTheDocument();
  });
});
