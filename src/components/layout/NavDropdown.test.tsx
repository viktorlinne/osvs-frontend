import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { NavDropdown } from "./NavDropdown";
import { NavItem } from "./NavItem";

function renderDropdown(onClose = vi.fn()) {
  render(
    <MemoryRouter>
      <NavDropdown label="Arkiv" onClose={onClose}>
        <NavItem to="/documents">Dokument</NavItem>
        <NavItem to="/revisions">Revisioner</NavItem>
        {null}
      </NavDropdown>
      <a href="#after">Efter</a>
    </MemoryRouter>,
  );
  return onClose;
}

describe("NavDropdown (disclosure)", () => {
  it("is a disclosure button controlling a list of links (no ARIA menu)", async () => {
    const user = userEvent.setup();
    renderDropdown();
    const button = screen.getByRole("button", { name: "Arkiv" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).not.toHaveAttribute("aria-haspopup");
    const panel = document.getElementById(button.getAttribute("aria-controls")!);
    expect(panel).not.toBeNull();
    expect(panel).not.toBeVisible();

    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(panel).toBeVisible();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Dokument" })).toBeInTheDocument();
  });

  it("closes on Escape and returns focus to the button", async () => {
    const user = userEvent.setup();
    renderDropdown();
    const button = screen.getByRole("button", { name: "Arkiv" });
    await user.click(button);
    await user.tab();
    expect(screen.getByRole("link", { name: "Dokument" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
  });

  it("closes when focus leaves it and when a link is followed", async () => {
    const user = userEvent.setup();
    const onClose = renderDropdown();
    const button = screen.getByRole("button", { name: "Arkiv" });

    await user.click(button);
    await user.tab(); // Dokument
    await user.tab(); // Revisioner
    await user.tab(); // outside
    await waitFor(() => expect(button).toHaveAttribute("aria-expanded", "false"));

    await user.click(button);
    await user.click(screen.getByRole("link", { name: "Revisioner" }));
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(onClose).toHaveBeenCalled();
  });

  it("closes on a click outside", async () => {
    const user = userEvent.setup();
    renderDropdown();
    const button = screen.getByRole("button", { name: "Arkiv" });
    await user.click(button);
    await user.click(document.body);
    expect(button).toHaveAttribute("aria-expanded", "false");
  });
});
