import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "sonner";
import { AuthContext, type AuthContextValue } from "../context/AuthContext";
import ErrorContext from "../context/ErrorContext";

const usersMock = vi.hoisted(() => ({
  listUsersMapPins: vi.fn(),
  setUserLocation: vi.fn(),
  clearUserLocationOverride: vi.fn(),
}));
vi.mock("../services/users", () => usersMock);

vi.mock("../hooks/useDebouncedUserSearch", () => ({
  default: () => ({
    users: [{ matrikelnummer: 308, firstname: "Bo", lastname: "Ek" }],
    query: "",
    setQuery: vi.fn(),
    loading: false,
  }),
}));

// Leaflet does not render in jsdom; the map itself is not under test here.
vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  TileLayer: () => null,
  Marker: () => null,
  Popup: () => null,
  useMap: () => ({ fitBounds: vi.fn() }),
}));
vi.mock("../components/map/ManualLocationPicker", () => ({
  ManualLocationPicker: () => <div data-testid="picker" />,
}));

import { MapPage } from "./MapPage";

function renderPage() {
  const auth: AuthContextValue = {
    user: { matrikelnummer: 1, email: "a@osvs.invalid", roles: ["Admin"] } as AuthContextValue["user"],
    session: null,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    clearUser: vi.fn(),
  };
  render(
    <ErrorContext.Provider value={{ error: null, setError: vi.fn(), clearError: vi.fn() }}>
      <AuthContext.Provider value={auth}>
        <MapPage />
        <Toaster />
      </AuthContext.Provider>
    </ErrorContext.Provider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  usersMock.listUsersMapPins.mockResolvedValue([
    { id: 308, name: "Bo Ek", lat: 56.2, lng: 12.9, lodgeName: "Regulus", highestGradeRank: 3 },
  ]);
  usersMock.clearUserLocationOverride.mockImplementation(async () => {
    usersMock.listUsersMapPins.mockResolvedValue([]);
  });
  usersMock.setUserLocation.mockResolvedValue(undefined);
});

describe("MapPage position editing focus", () => {
  it("moves focus to the edit hint on entering edit mode and back on cancel", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("button", { name: "Ändra position" }));
    expect(screen.getByText("Klicka i kartan för att markera positionen.")).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Avbryt redigering" }));
    expect(screen.getByRole("button", { name: "Ändra position" })).toHaveFocus();
  });

  it("focuses the position button after removing a manual position", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("button", { name: "Ändra position" }));
    await user.click(screen.getByRole("button", { name: "Ta bort manuell position" }));

    const dialog = await screen.findByRole("alertdialog", { name: "Ta bort positionen?" });
    await user.click(within(dialog).getByRole("button", { name: "Ta bort" }));

    expect(await screen.findByText("Positionen har tagits bort.")).toBeInTheDocument();
    expect(usersMock.clearUserLocationOverride).toHaveBeenCalledWith(308);
    const button = await screen.findByRole("button", { name: "Ange position manuellt" });
    await waitFor(() => expect(button).toHaveFocus());
    // Radix's close handling must not move focus afterwards.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(button).toHaveFocus();
  });

  it("focuses the position button after saving", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("button", { name: "Ändra position" }));
    await user.click(screen.getByRole("button", { name: "Spara position" }));

    expect(await screen.findByText("Positionen har sparats.")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Ändra position" })).toHaveFocus(),
    );
  });
});
