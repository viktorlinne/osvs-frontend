import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { AuthContext, type AuthContextValue } from "../context/AuthContext";
import ErrorContext from "../context/ErrorContext";

const usersMock = vi.hoisted(() => ({
  getUserLodge: vi.fn(),
  postAchievement: vi.fn(),
  setRoles: vi.fn(),
  setUserLodge: vi.fn(),
  updateMe: vi.fn(),
  uploadMyPicture: vi.fn(),
}));
const adminMock = vi.hoisted(() => ({ listRoles: vi.fn() }));
const officialsMock = vi.hoisted(() => ({
  listOfficials: vi.fn(),
  setMemberOfficials: vi.fn(),
}));
const allergiesMock = vi.hoisted(() => ({
  listAllergies: vi.fn(),
  setMemberAllergies: vi.fn(),
}));

vi.mock("../services/users", () => usersMock);
vi.mock("../services/admin", () => adminMock);
vi.mock("../services/officials", () => officialsMock);
vi.mock("../services/allergies", () => allergiesMock);
vi.mock("../services/achievements", () => ({
  default: { listAchievements: vi.fn().mockResolvedValue([]) },
}));
vi.mock("../services/lodges", () => ({
  default: {
    listLodges: vi.fn().mockResolvedValue([{ id: 6, name: "Orion" }]),
  },
}));
vi.mock("../components/profile/ProfileMapPinSection", () => ({
  ProfileMapPinSection: () => null,
}));

import { Profile } from "./Profile";

function renderProfileEdit(roles: string[]) {
  const auth: AuthContextValue = {
    user: {
      matrikelnummer: 308,
      email: "test.member@osvs.invalid",
      firstname: "Sven Åke",
      lastname: "Nilsson",
      dateOfBirth: "1953-11-15",
      mobile: "0705 50 68 82",
      homeNumber: "042/132521",
      city: "Helsingborg",
      address: "Drottninggatan 176 C",
      zipcode: "254 33",
      work: null,
      notes: null,
      accommodationAvailable: false,
      roles,
      officials: [{ id: 2, title: "DM" }],
      allergies: [{ id: 1, title: "Gluten" }],
    } as unknown as AuthContextValue["user"],
    session: null,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn().mockResolvedValue(null),
    clearUser: vi.fn(),
  };
  const router = createMemoryRouter(
    [
      { path: "/profile/edit", element: <Profile /> },
      { path: "/profile", element: <div>Profilvy</div> },
    ],
    { initialEntries: ["/profile/edit"] },
  );
  render(
    <ErrorContext.Provider
      value={{ error: null, setError: vi.fn(), clearError: vi.fn() }}
    >
      <AuthContext.Provider value={auth}>
        <RouterProvider router={router} />
      </AuthContext.Provider>
    </ErrorContext.Provider>,
  );
}

beforeEach(() => {
  usersMock.getUserLodge.mockResolvedValue({ lodge: { id: 6, name: "Orion" } });
  usersMock.updateMe.mockResolvedValue({});
  usersMock.setUserLodge.mockResolvedValue({});
  adminMock.listRoles.mockResolvedValue([]);
  officialsMock.listOfficials.mockResolvedValue([{ id: 2, title: "DM" }]);
  officialsMock.setMemberOfficials.mockResolvedValue({});
  allergiesMock.listAllergies.mockResolvedValue([
    { id: 1, title: "Gluten" },
    { id: 3, title: "Nötter" },
  ]);
  allergiesMock.setMemberAllergies.mockResolvedValue({});
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Profile edit as Member", () => {
  it("keeps Spara disabled until a change and only sends allowed, changed data", async () => {
    const user = userEvent.setup();
    renderProfileEdit(["Member"]);

    const save = await screen.findByRole("button", { name: "Spara" });
    await waitFor(() => expect(screen.getByText("Inga ändringar")).toBeInTheDocument());
    expect(save).toBeDisabled();
    // Members cannot change lodge or tjänster.
    expect(screen.queryByLabelText("Loge")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("DM")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Stad"), "s");
    await waitFor(() => expect(save).toBeEnabled());
    await user.click(save);

    await screen.findByText("Profilvy");
    expect(usersMock.updateMe).toHaveBeenCalledWith(
      expect.objectContaining({ city: "Helsingborgs" }),
    );
    expect(usersMock.setUserLodge).not.toHaveBeenCalled();
    expect(officialsMock.setMemberOfficials).not.toHaveBeenCalled();
    expect(allergiesMock.setMemberAllergies).not.toHaveBeenCalled();
    expect(usersMock.setRoles).not.toHaveBeenCalled();
    expect(usersMock.postAchievement).not.toHaveBeenCalled();
    expect(adminMock.listRoles).not.toHaveBeenCalled();
  });

  it("saves only allergies when only allergies changed", async () => {
    const user = userEvent.setup();
    renderProfileEdit(["Member"]);

    const save = await screen.findByRole("button", { name: "Spara" });
    await user.click(await screen.findByLabelText("Nötter"));
    await waitFor(() => expect(save).toBeEnabled());
    await user.click(save);

    await screen.findByText("Profilvy");
    expect(allergiesMock.setMemberAllergies).toHaveBeenCalledWith(308, [1, 3]);
    expect(usersMock.updateMe).not.toHaveBeenCalled();
    expect(usersMock.setUserLodge).not.toHaveBeenCalled();
  });
});
