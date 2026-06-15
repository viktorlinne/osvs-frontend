import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import AuthGuard from "./AuthGuard";
import { AuthProvider } from "../context/AuthProvider";
import { ErrorProvider } from "../context/ErrorProvider";

function renderGuard(roles?: string[]) {
  const router = createMemoryRouter(
    [
      {
        path: "/admin",
        element: (
          <ErrorProvider>
            <AuthProvider>
              <AuthGuard roles={roles}>
                <div>Protected content</div>
              </AuthGuard>
            </AuthProvider>
          </ErrorProvider>
        ),
      },
      {
        path: "/login",
        element: <div>Login page</div>,
      },
      {
        path: "/forbidden",
        element: <div>Forbidden page</div>,
      },
    ],
    { initialEntries: ["/admin"] },
  );

  return render(<RouterProvider router={router} />);
}

describe("AuthGuard", () => {
  it("redirects unauthenticated users to login", async () => {
    renderGuard(["Admin"]);
    expect(await screen.findByText("Login page")).toBeInTheDocument();
  });
});
