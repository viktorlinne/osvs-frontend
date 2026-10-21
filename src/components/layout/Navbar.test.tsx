import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthContext, type AuthContextValue } from "../../context/AuthContext";
import ErrorContext from "../../context/ErrorContext";
import { Navbar } from "./Navbar";

function renderNavbar(roles: string[] | null) {
  const auth: AuthContextValue = {
    user: roles
      ? ({ matrikelnummer: 1, email: "x@osvs.invalid", roles } as AuthContextValue["user"])
      : null,
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
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      </AuthContext.Provider>
    </ErrorContext.Provider>,
  );
}

describe("Navbar mobile menu", () => {
  it("toggles the mobile menu with aria-expanded/aria-controls", async () => {
    const user = userEvent.setup();
    renderNavbar(["Admin"]);
    const toggle = screen.getByRole("button", { name: "Öppna meny" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", "mobile-menu");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAccessibleName("Stäng meny");
    const menu = document.getElementById("mobile-menu")!;
    expect(within(menu).getByRole("link", { name: "Grupper" })).toBeInTheDocument();
    expect(within(menu).getByRole("link", { name: "Avgifter" })).toBeInTheDocument();
  });

  it("closes on Escape from inside the menu and returns focus to the toggle", async () => {
    const user = userEvent.setup();
    renderNavbar(null);
    const toggle = screen.getByRole("button", { name: "Öppna meny" });
    await user.click(toggle);
    const menu = document.getElementById("mobile-menu")!;
    within(menu).getByRole("link", { name: "Hem" }).focus();

    await user.keyboard("{Escape}");
    expect(document.getElementById("mobile-menu")).toBeNull();
    expect(toggle).toHaveFocus();
  });

  it("closes after following a link", async () => {
    const user = userEvent.setup();
    renderNavbar(null);
    await user.click(screen.getByRole("button", { name: "Öppna meny" }));
    const menu = document.getElementById("mobile-menu")!;
    await user.click(within(menu).getByRole("link", { name: "Kontakt" }));
    expect(document.getElementById("mobile-menu")).toBeNull();
  });
});
