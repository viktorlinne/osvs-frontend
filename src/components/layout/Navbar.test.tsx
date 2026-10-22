import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { AuthContext, type AuthContextValue } from "../../context/AuthContext";
import ErrorContext from "../../context/ErrorContext";
import { Navbar } from "./Navbar";

function renderNavbar(roles: string[] | null, setError = vi.fn()) {
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
    <ErrorContext.Provider value={{ error: null, setError, clearError: vi.fn() }}>
      <AuthContext.Provider value={auth}>
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      </AuthContext.Provider>
    </ErrorContext.Provider>,
  );
  return auth;
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
    expect(within(menu).getByRole("link", { name: "Medlemsavgifter" })).toBeInTheDocument();
    expect(within(menu).getByRole("link", { name: "Mötesavgifter" })).toHaveAttribute(
      "href",
      "/admin/event-payments",
    );
  });

  it("shows Mötesavgifter but not Medlemsavgifter to an Editor", async () => {
    const user = userEvent.setup();
    renderNavbar(["Editor"]);
    await user.click(screen.getByRole("button", { name: "Öppna meny" }));
    const menu = document.getElementById("mobile-menu")!;
    expect(within(menu).getByRole("link", { name: "Mötesavgifter" })).toBeInTheDocument();
    expect(within(menu).queryByRole("link", { name: "Medlemsavgifter" })).toBeNull();
  });

  it("hides the payment pages from members", async () => {
    const user = userEvent.setup();
    renderNavbar(["Member"]);
    await user.click(screen.getByRole("button", { name: "Öppna meny" }));
    const menu = document.getElementById("mobile-menu")!;
    expect(within(menu).queryByRole("link", { name: /avgifter/i })).toBeNull();
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

describe("Navbar logout", () => {
  it("asks for confirmation in the standard dialog; Avbryt keeps the session", async () => {
    const user = userEvent.setup();
    const auth = renderNavbar(["Member"]);
    const logoutButton = screen.getByRole("button", { name: "Logga ut" });
    await user.click(logoutButton);

    const dialog = await screen.findByRole("alertdialog", { name: "Logga ut?" });
    expect(within(dialog).getByRole("button", { name: "Avbryt" })).toHaveFocus();
    await user.click(within(dialog).getByRole("button", { name: "Avbryt" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(auth.logout).not.toHaveBeenCalled();
    expect(logoutButton).toHaveFocus();
  });

  it("logs out on confirm", async () => {
    const user = userEvent.setup();
    const auth = renderNavbar(["Member"]);
    await user.click(screen.getByRole("button", { name: "Logga ut" }));
    const dialog = await screen.findByRole("alertdialog", { name: "Logga ut?" });
    await user.click(within(dialog).getByRole("button", { name: "Logga ut" }));
    expect(auth.logout).toHaveBeenCalledTimes(1);
  });

  it("tells the member when the server could not confirm the logout", async () => {
    const user = userEvent.setup();
    const setError = vi.fn();
    const auth = renderNavbar(["Member"], setError);
    vi.mocked(auth.logout).mockRejectedValueOnce({ status: 0, message: "Kunde inte nå servern." });
    await user.click(screen.getByRole("button", { name: "Logga ut" }));
    const dialog = await screen.findByRole("alertdialog", { name: "Logga ut?" });
    await user.click(within(dialog).getByRole("button", { name: "Logga ut" }));

    expect(setError).toHaveBeenCalledWith(
      expect.stringContaining("Servern kunde inte bekräfta utloggningen"),
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("Escape closes only the dialog, not the mobile menu", async () => {
    const user = userEvent.setup();
    renderNavbar(["Member"]);
    await user.click(screen.getByRole("button", { name: "Öppna meny" }));
    const menu = document.getElementById("mobile-menu")!;
    const mobileLogout = within(menu).getByRole("button", { name: "Logga ut" });
    await user.click(mobileLogout);
    await screen.findByRole("alertdialog", { name: "Logga ut?" });

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(document.getElementById("mobile-menu")).not.toBeNull();
    expect(mobileLogout).toHaveFocus();
  });
});
