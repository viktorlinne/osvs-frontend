import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { AuthContext, type AuthContextValue } from "../context/AuthContext";
import ErrorContext from "../context/ErrorContext";
import type { PublicUser } from "../types";

const usersMock = vi.hoisted(() => ({
  adminUpdateUser: vi.fn(),
  getPublicUserById: vi.fn(),
  getUserLodge: vi.fn(),
  getUserRoles: vi.fn(),
  setRoles: vi.fn(),
  setUserLodge: vi.fn(),
  uploadUserPicture: vi.fn(),
}));
const adminMock = vi.hoisted(() => ({ listRoles: vi.fn() }));

vi.mock("../services/users", () => usersMock);
vi.mock("../services/admin", () => adminMock);
vi.mock("../services/achievements", () => ({
  default: { listAchievements: vi.fn().mockResolvedValue([]) },
}));
vi.mock("../services/lodges", () => ({
  default: { listLodges: vi.fn().mockResolvedValue([]) },
}));
vi.mock("../services/allergies", () => ({
  listAllergies: vi.fn().mockResolvedValue([]),
  setMemberAllergies: vi.fn().mockResolvedValue({}),
}));
vi.mock("../components/profile/MemberHistoryEditor", () => ({
  MemberHistoryEditor: () => null,
}));

import { MemberDetail } from "./MemberDetail";

// Shape of a migrated member (from the trial DB): home number written with a
// slash and no mobile number. Neither may block an Admin/Editor from saving.
const migratedMember: PublicUser = {
  matrikelnummer: 308,
  email: "test.member@osvs.invalid",
  createdAt: "2026-10-21",
  firstname: "Sven Åke",
  lastname: "Nilsson",
  dateOfBirth: "1953-11-15",
  work: null,
  accommodationAvailable: false,
  mobile: "",
  homeNumber: "042/132521",
  city: "Helsingborg",
  address: "Drottninggatan 176 C",
  zipcode: "254 33",
  notes: null,
  feeExempt: false,
  standingList: true,
} as PublicUser;

function renderEdit(roles: string[]) {
  const setError = vi.fn();
  const auth: AuthContextValue = {
    user: { matrikelnummer: 1, email: "x@osvs.invalid", roles } as AuthContextValue["user"],
    session: null,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    clearUser: vi.fn(),
  };
  const router = createMemoryRouter(
    [
      { path: "/members/:matrikelnummer/edit", element: <MemberDetail /> },
      { path: "/members/:matrikelnummer", element: <div>Detaljvy</div> },
    ],
    { initialEntries: ["/members/308/edit"] },
  );
  render(
    <ErrorContext.Provider value={{ error: null, setError, clearError: vi.fn() }}>
      <AuthContext.Provider value={auth}>
        <RouterProvider router={router} />
      </AuthContext.Provider>
    </ErrorContext.Provider>,
  );
  return { setError };
}

beforeEach(() => {
  usersMock.getPublicUserById.mockResolvedValue({
    user: { ...migratedMember, roles: ["Member"] },
    achievements: [],
    allergies: [],
    officials: [],
    officialHistory: [],
  });
  usersMock.getUserLodge.mockResolvedValue({ lodge: null });
  usersMock.getUserRoles.mockResolvedValue(["Member"]);
  usersMock.adminUpdateUser.mockResolvedValue({});
  usersMock.setRoles.mockResolvedValue({});
  usersMock.setUserLodge.mockResolvedValue({});
  adminMock.listRoles.mockResolvedValue([
    { id: 1, name: "Admin" },
    { id: 2, name: "Editor" },
    { id: 3, name: "Member" },
  ]);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("MemberDetail edit", () => {
  it("lets an Editor toggle Ständiga listan and save a migrated member", async () => {
    const user = userEvent.setup();
    renderEdit(["Editor"]);

    const standing = await screen.findByLabelText("Ständiga listan");
    const save = screen.getByRole("button", { name: "Spara" });
    await user.click(standing);
    await waitFor(() => expect(save).toBeEnabled());

    await user.click(save);
    await waitFor(() => expect(usersMock.adminUpdateUser).toHaveBeenCalled());
    expect(usersMock.adminUpdateUser.mock.calls[0][1]).toEqual(
      expect.objectContaining({ standingList: false, feeExempt: false }),
    );
    // Role changes are Admin-only: an Editor must never hit those endpoints.
    expect(adminMock.listRoles).not.toHaveBeenCalled();
    expect(usersMock.setRoles).not.toHaveBeenCalled();
  });

  it("loads the role list for an Admin and only saves roles when changed", async () => {
    const user = userEvent.setup();
    renderEdit(["Admin"]);

    const feeExempt = await screen.findByLabelText("Befriad från årsavgift");
    expect(adminMock.listRoles).toHaveBeenCalled();
    await user.click(feeExempt);
    const save = screen.getByRole("button", { name: "Spara" });
    await waitFor(() => expect(save).toBeEnabled());
    await user.click(save);
    await waitFor(() => expect(usersMock.adminUpdateUser).toHaveBeenCalled());
    await screen.findByText("Detaljvy");
    expect(usersMock.setRoles).not.toHaveBeenCalled();
  });

  it("shows why Spara is disabled when loaded data is invalid", async () => {
    usersMock.getPublicUserById.mockResolvedValue({
      user: { ...migratedMember, mobile: "ring kansliet" },
      achievements: [],
      allergies: [],
      officials: [],
      officialHistory: [],
    });
    renderEdit(["Editor"]);

    expect(await screen.findByText("Ogiltigt mobilnummer")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Spara" })).toBeDisabled();
    expect(
      screen.getByText("Rätta de markerade fälten för att kunna spara."),
    ).toBeInTheDocument();
  });
});
