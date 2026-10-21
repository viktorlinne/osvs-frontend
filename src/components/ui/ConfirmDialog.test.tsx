import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";
import { useConfirm } from "./useConfirm";

function Harness({ onResult }: { onResult: (value: boolean) => void }) {
  const { confirm, confirmDialog } = useConfirm();
  const [count, setCount] = useState(0);
  return (
    <div>
      <Button
        type="button"
        variant="danger"
        onClick={async () => {
          const ok = await confirm({
            title: "Radera mötet?",
            description: "Mötet raderas permanent.",
            confirmLabel: "Radera",
          });
          onResult(ok);
          setCount((c) => c + 1);
        }}
      >
        Radera
      </Button>
      <span data-testid="count">{count}</span>
      {confirmDialog}
    </div>
  );
}

describe("useConfirm / ConfirmDialog", () => {
  it("opens an alertdialog with name and description, focusing Avbryt", async () => {
    const user = userEvent.setup();
    render(<Harness onResult={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Radera" }));

    const dialog = await screen.findByRole("alertdialog", { name: "Radera mötet?" });
    expect(dialog).toHaveAccessibleDescription("Mötet raderas permanent.");
    await waitFor(() =>
      expect(within(dialog).getByRole("button", { name: "Avbryt" })).toHaveFocus(),
    );
  });

  it("resolves true on confirm", async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    render(<Harness onResult={onResult} />);
    await user.click(screen.getByRole("button", { name: "Radera" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Radera" }));

    await waitFor(() => expect(onResult).toHaveBeenCalledWith(true));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });

  it("resolves false on Avbryt and on Escape, returning focus to the opener", async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    render(<Harness onResult={onResult} />);
    const opener = screen.getByRole("button", { name: "Radera" });

    await user.click(opener);
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Avbryt" }),
    );
    await waitFor(() => expect(onResult).toHaveBeenLastCalledWith(false));
    await waitFor(() => expect(opener).toHaveFocus());

    await user.click(opener);
    await screen.findByRole("alertdialog");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(onResult).toHaveBeenCalledTimes(2));
    expect(onResult).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    await waitFor(() => expect(opener).toHaveFocus());
  });
});
