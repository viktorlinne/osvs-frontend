import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { AuthContext, type AuthContextValue } from "../context/AuthContext";
import ErrorContext from "../context/ErrorContext";
import { LoginPage } from "./LoginPage";

const INACTIVE_MESSAGE =
  "Inloggningen nekades eftersom ditt konto är arkiverat. Om det är fel, kontakta en administratör eller redaktör så kan de återaktivera kontot.";

function renderLogin(loginError: unknown) {
  const setError = vi.fn();
  const auth: AuthContextValue = {
    user: null,
    session: null,
    loading: false,
    login: vi.fn().mockRejectedValue(loginError),
    logout: vi.fn(),
    refresh: vi.fn().mockResolvedValue(null),
    clearUser: vi.fn(),
  };
  const router = createMemoryRouter([{ path: "/login", element: <LoginPage /> }], {
    initialEntries: ["/login"],
  });
  render(
    <ErrorContext.Provider value={{ error: null, setError, clearError: vi.fn() }}>
      <AuthContext.Provider value={auth}>
        <RouterProvider router={router} />
      </AuthContext.Provider>
    </ErrorContext.Provider>,
  );
  return setError;
}

async function submit() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/E-post/), "member@example.com");
  await user.type(screen.getByLabelText(/Lösenord/, { selector: "input" }), "secret");
  await user.click(screen.getByRole("button", { name: "Logga in" }));
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("LoginPage error messages", () => {
  it("tells an archived member why the login failed and whom to contact", async () => {
    const setError = renderLogin({
      status: 401,
      message: INACTIVE_MESSAGE,
      details: { reason: "ACCOUNT_INACTIVE" },
    });

    await submit();

    await waitFor(() => expect(setError).toHaveBeenLastCalledWith(INACTIVE_MESSAGE));
  });

  it("keeps the generic message for a wrong e-mail or password", async () => {
    const setError = renderLogin({
      status: 401,
      message: "Felaktiga inloggningsuppgifter",
    });

    await submit();

    await waitFor(() =>
      expect(setError).toHaveBeenLastCalledWith("Felaktig e-postadress eller lösenord"),
    );
  });
});
