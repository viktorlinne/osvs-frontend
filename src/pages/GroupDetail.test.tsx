import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import ErrorContext from "../context/ErrorContext";

const groupsMock = vi.hoisted(() => ({
  addGroupMembers: vi.fn(),
  deleteGroup: vi.fn(),
  getGroup: vi.fn(),
  listGroupMembers: vi.fn(),
  removeGroupMember: vi.fn(),
  updateGroup: vi.fn(),
}));
vi.mock("../services/groups", () => groupsMock);
vi.mock("../services/users", () => ({
  listAllUsers: vi.fn().mockResolvedValue([
    { matrikelnummer: 11, firstname: "Anders", lastname: "Berg", lodgeId: 1, lodgeName: "Regulus" },
    { matrikelnummer: 13, firstname: "Cecil", lastname: "Holm", lodgeId: 1, lodgeName: "Regulus" },
  ]),
}));
vi.mock("../components/groups/GroupMailingSection", () => ({
  GroupMailingSection: () => null,
}));

import { GroupDetail } from "./GroupDetail";

const members = [
  { matrikelnummer: 11, firstname: "Anders", lastname: "Berg", email: "a@x.se", archive: null },
  { matrikelnummer: 12, firstname: "Bo", lastname: "Ek", email: "b@x.se", archive: null },
];

function renderPage() {
  const router = createMemoryRouter(
    [
      { path: "/admin/groups/:id", element: <GroupDetail /> },
      { path: "/admin/groups", element: <div>Grupplista</div> },
    ],
    { initialEntries: ["/admin/groups/3"] },
  );
  render(
    <ErrorContext.Provider value={{ error: null, setError: vi.fn(), clearError: vi.fn() }}>
      <RouterProvider router={router} />
      <Toaster />
    </ErrorContext.Provider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  groupsMock.getGroup.mockResolvedValue({
    id: 3,
    name: "Styrelsen",
    description: null,
    userIds: [11, 12],
    memberCount: 2,
  });
  groupsMock.listGroupMembers.mockResolvedValue(members);
  groupsMock.deleteGroup.mockResolvedValue(undefined);
  groupsMock.removeGroupMember.mockResolvedValue(undefined);
});

describe("GroupDetail confirmations", () => {
  it("confirms before deleting the group", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole("heading", { name: "Styrelsen" });

    await user.click(screen.getByRole("button", { name: "Ta bort" }));
    let dialog = await screen.findByRole("alertdialog", {
      name: "Ta bort gruppen Styrelsen?",
    });
    expect(dialog).toHaveTextContent("2 medlemskap tas bort");
    await user.click(within(dialog).getByRole("button", { name: "Avbryt" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(groupsMock.deleteGroup).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Ta bort" }));
    dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Ta bort" }));

    await waitFor(() => expect(groupsMock.deleteGroup).toHaveBeenCalledWith("3"));
    expect(await screen.findByText("Grupplista")).toBeInTheDocument();
    expect(await screen.findByText("Gruppen Styrelsen togs bort.")).toBeInTheDocument();
  });

  it("confirms before removing a member", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: "Ta bort Bo Ek ur gruppen" }),
    );
    const dialog = await screen.findByRole("alertdialog", { name: "Ta bort ur gruppen?" });
    expect(dialog).toHaveTextContent("Bo Ek tas bort ur gruppen Styrelsen");

    groupsMock.listGroupMembers.mockResolvedValue([members[0]]);
    await user.click(within(dialog).getByRole("button", { name: "Ta bort" }));

    await waitFor(() => expect(groupsMock.removeGroupMember).toHaveBeenCalledWith("3", 12));
    expect(await screen.findByText("Bo Ek togs bort ur gruppen.")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    await waitFor(() =>
      expect(screen.queryByRole("link", { name: "Bo Ek" })).not.toBeInTheDocument(),
    );
    // The removed row's button is gone; focus moves to the remaining row.
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Ta bort Anders Berg ur gruppen" }),
      ).toHaveFocus(),
    );
  });

  it("moves focus to the next row after removing a member", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: "Ta bort Anders Berg ur gruppen" }),
    );
    const dialog = await screen.findByRole("alertdialog", { name: "Ta bort ur gruppen?" });
    groupsMock.listGroupMembers.mockResolvedValue([members[1]]);
    await user.click(within(dialog).getByRole("button", { name: "Ta bort" }));

    await waitFor(() =>
      expect(screen.queryByRole("link", { name: "Anders Berg" })).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Ta bort Bo Ek ur gruppen" })).toHaveFocus(),
    );
  });

  it("moves focus to the members heading after removing the last member", async () => {
    const user = userEvent.setup();
    groupsMock.listGroupMembers.mockResolvedValue([members[0]]);
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: "Ta bort Anders Berg ur gruppen" }),
    );
    const dialog = await screen.findByRole("alertdialog", { name: "Ta bort ur gruppen?" });
    groupsMock.listGroupMembers.mockResolvedValue([]);
    await user.click(within(dialog).getByRole("button", { name: "Ta bort" }));

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Medlemmar" })).toHaveFocus(),
    );
  });

  it("adds members picked in the combobox", async () => {
    const user = userEvent.setup();
    groupsMock.addGroupMembers.mockResolvedValue({ added: [13], alreadyMembers: [] });
    renderPage();
    await screen.findByRole("link", { name: "Bo Ek" });

    await user.click(screen.getByRole("button", { name: /Välj medlemmar att lägga till/ }));
    const listbox = await screen.findByRole("listbox");
    // Existing member 11 is filtered out of the candidates.
    expect(within(listbox).getAllByRole("option")).toHaveLength(1);
    await user.click(within(listbox).getByRole("option", { name: /Cecil Holm/ }));
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: "Lägg till (1)" }));
    await waitFor(() => expect(groupsMock.addGroupMembers).toHaveBeenCalledWith("3", [13]));
    expect(await screen.findByText("1 medlem lades till.")).toBeInTheDocument();
  });
});
