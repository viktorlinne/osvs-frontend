import { useState } from "react";
import { describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HistoryDialog } from "./HistoryDialog";
import { Button } from "../ui";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/shadcn/dialog";

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button type="button" onClick={() => setOpen(true)}>
        Lägg till
      </Button>
      {open ? (
        <HistoryDialog title="Lägg till tjänst" onClose={() => setOpen(false)}>
          <label htmlFor="note">Anteckning</label>
          <input id="note" />
          <Button type="button" onClick={() => setOpen(false)}>
            Avbryt
          </Button>
        </HistoryDialog>
      ) : null}
    </div>
  );
}

describe("HistoryDialog", () => {
  it("opens as a modal dialog with an accessible name and focuses the first field", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Lägg till" }));

    const dialog = await screen.findByRole("dialog", { name: "Lägg till tjänst" });
    expect(dialog).toBeInTheDocument();
    await waitFor(() =>
      expect(within(dialog).getByLabelText("Anteckning")).toHaveFocus(),
    );
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Lägg till" });
    await user.click(trigger);
    await screen.findByRole("dialog");

    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("closes via the Stäng button", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Lägg till" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Stäng" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("keeps focus inside the dialog when tabbing", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Lägg till" }));
    const dialog = await screen.findByRole("dialog");
    await waitFor(() => expect(within(dialog).getByLabelText("Anteckning")).toHaveFocus());

    for (let i = 0; i < 5; i += 1) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
    await user.tab({ shift: true });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });
});

describe("Button as Radix trigger (asChild)", () => {
  it("receives the trigger ref/props and opens the dialog", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button type="button" variant="secondary">
            Öppna
          </Button>
        </DialogTrigger>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Exempel</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    const trigger = screen.getByRole("button", { name: "Öppna" });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveClass("ui-btn", "ui-btn-secondary");

    await user.click(trigger);
    expect(await screen.findByRole("dialog", { name: "Exempel" })).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
