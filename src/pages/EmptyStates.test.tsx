import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";

const authState = vi.hoisted(() => ({ roles: ["Member"] as string[] }));
vi.mock("../context", () => ({
  useAuth: () => ({ user: { matrikelnummer: 1, roles: authState.roles } }),
  useError: () => ({ error: null, setError: vi.fn(), clearError: vi.fn() }),
}));
vi.mock("../services", () => ({
  listEvents: vi.fn().mockResolvedValue({ events: [] }),
  listMyEvents: vi.fn().mockResolvedValue({ events: [] }),
  listLodges: vi.fn().mockResolvedValue([]),
  listPosts: vi.fn().mockResolvedValue({
    posts: [],
    total: 0,
    totalPages: 0,
    page: 1,
    pageSize: 10,
  }),
}));

import { EventsPage } from "./EventsPage";
import { NewsPage } from "./PostsPage";

function renderAt(element: React.ReactNode) {
  render(<MemoryRouter>{element}</MemoryRouter>);
}

beforeEach(() => {
  authState.roles = ["Member"];
});

describe("EventsPage empty month", () => {
  it("tells members how to browse other months", async () => {
    renderAt(<EventsPage />);
    expect(
      (await screen.findAllByText(/Använd Förra och Nästa/)).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: "Skapa möte" })).not.toBeInTheDocument();
  });

  it("offers editors to create a meeting", async () => {
    authState.roles = ["Editor"];
    renderAt(<EventsPage />);
    const texts = await screen.findAllByText("Inga möten den här månaden.");
    // Rendered once for the mobile list and once under the desktop grid.
    expect(texts).toHaveLength(2);
    const container = texts[0].parentElement as HTMLElement;
    expect(within(container).getByRole("link", { name: "Skapa möte" })).toHaveAttribute(
      "href",
      "/events/create",
    );
  });
});

describe("NewsPage empty list", () => {
  it("shows no create action to members", async () => {
    renderAt(<NewsPage />);
    expect(await screen.findByText("Inga inlägg har publicerats ännu.")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Skriv det första inlägget" }),
    ).not.toBeInTheDocument();
  });

  it("offers editors to write the first post", async () => {
    authState.roles = ["Editor"];
    renderAt(<NewsPage />);
    expect(
      await screen.findByRole("link", { name: "Skriv det första inlägget" }),
    ).toHaveAttribute("href", "/posts/create");
  });
});
