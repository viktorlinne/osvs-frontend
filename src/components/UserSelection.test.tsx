import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PublicUser } from "../types";
import { UserSelection } from "./UserSelection";

const users = [
  { matrikelnummer: 101, firstname: "Anders", lastname: "Berg", lodgeId: 3, lodgeName: "Regulus" },
  { matrikelnummer: 102, firstname: "Bertil", lastname: "Ek", lodgeId: 5, lodgeName: "Capella" },
  { matrikelnummer: 103, firstname: "Carl", lastname: "Åberg", lodgeId: 3, lodgeName: "Regulus" },
  { matrikelnummer: 104, firstname: "David", lastname: "Lind", lodgeId: null, lodgeName: null },
] as unknown as PublicUser[];

function Harness({
  onChange,
  initial = [],
  derived,
}: {
  onChange?: (ids: string[]) => void;
  initial?: string[];
  derived?: string[];
}) {
  const [ids, setIds] = useState<string[]>(initial);
  return (
    <UserSelection
      users={users}
      selectedIds={ids}
      derivedSelectedIds={derived}
      label="Välj medlemmar att lägga till"
      onChange={(next) => {
        onChange?.(next);
        setIds(next);
      }}
    />
  );
}

async function openPicker(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /Välj medlemmar att lägga till/ }));
  return screen.findByRole("combobox", { name: "Välj medlemmar att lägga till" });
}

describe("UserSelection combobox", () => {
  it("lists members grouped by lodge with 'Ingen loge' last", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await openPicker(user);

    const listbox = screen.getByRole("listbox");
    const groups = within(listbox).getAllByRole("group");
    expect(groups).toHaveLength(3);
    expect(groups[0]).toHaveAccessibleName("Regulus");
    expect(groups[1]).toHaveAccessibleName("Capella");
    expect(groups[2]).toHaveAccessibleName("Ingen loge");
    expect(within(listbox).getAllByRole("option")).toHaveLength(4);
  });

  it("filters as you type (name, also with Swedish letters)", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = await openPicker(user);

    await user.type(input, "åb");
    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Carl Åberg");

    await user.clear(input);
    await user.type(input, "zzz");
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByText("Inga medlemmar matchade sökningen")).toBeInTheDocument();
  });

  it("selects with arrow keys + Enter and shows a removable chip", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const input = await openPicker(user);

    await user.type(input, "Bertil");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onChange).toHaveBeenLastCalledWith(["102"]);

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: /Välj medlemmar att lägga till/ })).toHaveFocus();

    const chips = screen.getByRole("list", { name: "Valda medlemmar" });
    expect(within(chips).getByText("Bertil Ek")).toBeInTheDocument();

    await user.click(within(chips).getByRole("button", { name: "Ta bort Bertil Ek" }));
    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(screen.queryByRole("list", { name: "Valda medlemmar" })).not.toBeInTheDocument();
  });

  it("toggles off an already selected member and keeps derived ones read-only", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} initial={["101"]} derived={["102"]} />);
    expect(screen.getByText("1 medlem ingår redan via valda loger eller grupper.")).toBeInTheDocument();
    await openPicker(user);

    const derivedOption = screen.getByRole("option", { name: /Bertil Ek/ });
    expect(derivedOption).toHaveAttribute("aria-disabled", "true");
    expect(derivedOption).toHaveTextContent("via annat val");

    await user.click(screen.getByRole("option", { name: /Anders Berg/ }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("reports the query to a controlled (server-side) search", async () => {
    const user = userEvent.setup();
    const onSearchQueryChange = vi.fn();
    render(
      <UserSelection
        users={users}
        selectedIds={[]}
        onChange={vi.fn()}
        label="Välj"
        searchQuery=""
        onSearchQueryChange={onSearchQueryChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Välj/ }));
    await user.type(await screen.findByRole("combobox"), "A");
    expect(onSearchQueryChange).toHaveBeenCalledWith("A");
  });
});
