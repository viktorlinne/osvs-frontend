import { describe, expect, it, vi, beforeEach } from "vitest";
import { useEffect } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { AuthProvider } from "./AuthProvider";
import { ErrorProvider } from "./ErrorProvider";
import { useAuth } from "./useAuth";
import type { AuthContextValue } from "./AuthContext";
import { reportGlobalError } from "../services/globalError";

const authMock = vi.hoisted(() => ({
  restoreSession: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("../services/auth", () => authMock);

const SESSION = {
  inactivityTimeoutMs: 900_000,
  inactivityExpiresAt: "2099-01-01T00:00:00.000Z",
  refreshWindowDays: 30,
};
const USER = { matrikelnummer: 7, firstname: "Test", roles: ["Member"] };
const RATE_LIMITED = {
  status: 429,
  message: "Sessionen kunde inte förnyas just nu. Försök igen om en stund.",
};

let auth: AuthContextValue | undefined;
const captureAuth = (value: AuthContextValue) => {
  auth = value;
};

function Probe({ onAuth }: { onAuth: (value: AuthContextValue) => void }) {
  const value = useAuth();
  useEffect(() => onAuth(value), [onAuth, value]);
  return (
    <div>
      {value.loading ? "loading" : value.user ? "logged-in" : "logged-out"}
    </div>
  );
}

function renderProvider() {
  return render(
    <ErrorProvider>
      <AuthProvider>
        <Probe onAuth={captureAuth} />
      </AuthProvider>
    </ErrorProvider>,
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    auth = undefined;
    authMock.restoreSession.mockReset();
    // The global error channel replays its last message; start clean.
    reportGlobalError(null);
  });

  it("keeps the user logged in when a later session check is rate limited", async () => {
    authMock.restoreSession
      .mockResolvedValueOnce({ user: USER, session: SESSION })
      .mockRejectedValueOnce(RATE_LIMITED);
    renderProvider();
    expect(await screen.findByText("logged-in")).toBeInTheDocument();

    let result: unknown;
    await act(async () => {
      result = await auth!.refresh();
    });

    expect(result).toMatchObject({ matrikelnummer: 7 });
    expect(screen.getByText("logged-in")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(RATE_LIMITED.message);
  });

  it("logs out when a later session check returns 401", async () => {
    authMock.restoreSession
      .mockResolvedValueOnce({ user: USER, session: SESSION })
      .mockRejectedValueOnce({ status: 401, message: "Vänligen logga in" });
    renderProvider();
    expect(await screen.findByText("logged-in")).toBeInTheDocument();

    await act(async () => {
      await auth!.refresh();
    });

    expect(screen.getByText("logged-out")).toBeInTheDocument();
  });

  it("shows the retry message when the startup check is rate limited", async () => {
    authMock.restoreSession.mockRejectedValueOnce(RATE_LIMITED);
    renderProvider();

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(RATE_LIMITED.message),
    );
    expect(authMock.logout).not.toHaveBeenCalled();
  });

  it("explains why when the server cannot be reached at startup", async () => {
    authMock.restoreSession.mockRejectedValueOnce({
      status: 0,
      message: "Kunde inte nå servern. Kontrollera anslutningen och försök igen.",
    });
    renderProvider();

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Kunde inte nå servern"),
    );
    expect(screen.getByText("logged-out")).toBeInTheDocument();
  });

  it("clears the local session even when the server logout fails, and reports it", async () => {
    authMock.restoreSession.mockResolvedValueOnce({ user: USER, session: SESSION });
    authMock.logout.mockRejectedValueOnce({ status: 0, message: "offline" });
    renderProvider();
    await screen.findByText("logged-in");

    let caught: unknown;
    await act(async () => {
      await auth!.logout().catch((e: unknown) => {
        caught = e;
      });
    });

    expect(caught).toMatchObject({ status: 0 });
    expect(screen.getByText("logged-out")).toBeInTheDocument();
  });
});
