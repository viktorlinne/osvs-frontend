import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "sonner";
import ErrorContext from "../../context/ErrorContext";

const mailingsMock = vi.hoisted(() => ({
  getMailingPreview: vi.fn(),
  createMailing: vi.fn(),
  listGroupMailings: vi.fn(),
  getMailing: vi.fn(),
}));

vi.mock("../../services/mailings", () => mailingsMock);

import { GroupMailingSection } from "./GroupMailingSection";

const setError = vi.fn();

function renderSection() {
  render(
    <ErrorContext.Provider value={{ error: null, setError, clearError: vi.fn() }}>
      <GroupMailingSection groupId="5" membersVersion={5} />
      <Toaster />
    </ErrorContext.Provider>,
  );
}

beforeEach(() => {
  mailingsMock.getMailingPreview.mockResolvedValue({
    recipients: 12,
    skipped: 5,
    skippedByReason: { no_email: 3, archived: 2 },
    devAllowlist: { active: false, blocked: 0 },
  });
  mailingsMock.listGroupMailings.mockResolvedValue([]);
  mailingsMock.createMailing.mockResolvedValue({
    id: 17,
    status: "queued",
    queued: 12,
    skipped: 5,
    skippedByReason: { no_email: 3, archived: 2 },
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("GroupMailingSection", () => {
  it("shows recipient counts with skip reasons and an empty history", async () => {
    renderSection();
    expect(await screen.findByTestId("mailing-preview")).toHaveTextContent(
      "12 mottagare får utskicket. 5 hoppas över: 3 saknar e-post, 2 arkiverade.",
    );
    expect(
      await screen.findByText("Inga utskick har skickats till gruppen ännu."),
    ).toBeInTheDocument();
  });

  it("empty history offers to write a mailing", async () => {
    const user = userEvent.setup();
    renderSection();
    await user.click(await screen.findByRole("button", { name: "Skriv ett utskick" }));
    expect(screen.getByLabelText("Ämne")).toHaveFocus();
  });

  it("validates before asking for confirmation", async () => {
    const user = userEvent.setup();
    renderSection();
    await screen.findByTestId("mailing-preview");

    await user.click(screen.getByRole("button", { name: "Skicka utskick" }));

    expect(await screen.findByText("Ämne är obligatoriskt")).toBeInTheDocument();
    expect(screen.getByText("Meddelande är obligatoriskt")).toBeInTheDocument();
    expect(screen.queryByText("Skicka till 12 mottagare?")).not.toBeInTheDocument();
    expect(mailingsMock.createMailing).not.toHaveBeenCalled();
  });

  it("asks for confirmation, can cancel, and sends on confirm", async () => {
    const user = userEvent.setup();
    mailingsMock.listGroupMailings
      .mockResolvedValueOnce([])
      .mockResolvedValue([
        {
          id: 17,
          groupId: 5,
          groupName: "G",
          subject: "Kallelse",
          senderName: "Anna Admin",
          senderEmail: "a@x.se",
          status: "done",
          createdAt: "2026-10-21T21:32:47.000Z",
          counts: { sent: 12, pending: 0, failed: 0, skipped: 5 },
        },
      ]);
    renderSection();
    await screen.findByTestId("mailing-preview");

    await user.type(screen.getByLabelText("Ämne"), "  Kallelse ");
    await user.type(screen.getByLabelText("Meddelande"), "Hej!{enter}Välkomna.");
    await user.click(screen.getByRole("button", { name: "Skicka utskick" }));

    const dialog = await screen.findByRole("alertdialog", {
      name: "Skicka till 12 mottagare?",
    });
    expect(dialog).toHaveAccessibleDescription("Ämne: Kallelse");
    await user.click(within(dialog).getByRole("button", { name: "Avbryt" }));
    await waitFor(() =>
      expect(screen.queryByText("Skicka till 12 mottagare?")).not.toBeInTheDocument(),
    );
    expect(mailingsMock.createMailing).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Skicka utskick" }));
    await user.click(await screen.findByRole("button", { name: "Skicka" }));

    await waitFor(() =>
      expect(mailingsMock.createMailing).toHaveBeenCalledWith("5", {
        subject: "Kallelse",
        body: "Hej!\nVälkomna.",
      }),
    );
    expect(
      await screen.findByText("Utskicket har lagts i kö till 12 mottagare, 5 hoppas över."),
    ).toBeInTheDocument();
    expect(await screen.findByText("Kallelse")).toBeInTheDocument();
    expect(screen.getByText("12 skickade · 5 hoppades över")).toBeInTheDocument();
    expect(screen.getByLabelText("Ämne")).toHaveValue("");
  });

  it("maps backend field errors inline", async () => {
    const user = userEvent.setup();
    mailingsMock.createMailing.mockRejectedValue({
      status: 400,
      message: "Formuläret innehåller fel",
      details: { fields: { subject: "Ämnet får vara högst 200 tecken" } },
    });
    renderSection();
    await screen.findByTestId("mailing-preview");

    await user.type(screen.getByLabelText("Ämne"), "Kallelse");
    await user.type(screen.getByLabelText("Meddelande"), "Hej");
    await user.click(screen.getByRole("button", { name: "Skicka utskick" }));
    await user.click(await screen.findByRole("button", { name: "Skicka" }));

    expect(await screen.findByText("Ämnet får vara högst 200 tecken")).toBeInTheDocument();
    expect(setError).not.toHaveBeenCalled();
  });

  it("disables sending when nobody can receive mail", async () => {
    mailingsMock.getMailingPreview.mockResolvedValue({
      recipients: 0,
      skipped: 2,
      skippedByReason: { archived: 2 },
      devAllowlist: { active: false, blocked: 0 },
    });
    renderSection();
    expect(await screen.findByTestId("mailing-preview")).toHaveTextContent(
      "Ingen i gruppen kan ta emot e-post.",
    );
    expect(screen.getByRole("button", { name: "Skicka utskick" })).toBeDisabled();
    expect(
      await screen.findByText("Inga utskick har skickats till gruppen ännu."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Skriv ett utskick" })).not.toBeInTheDocument();
  });
});
