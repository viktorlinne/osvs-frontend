import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import type { Lodge, PublicUser } from "../../types";
import { EventAudienceFields } from "./EventAudienceFields";

afterEach(() => cleanup());

type FieldsProps = ComponentProps<typeof EventAudienceFields>;

const lodges = [
  { id: 3, name: "Regulus" },
  { id: 5, name: "Capella" },
  { id: 7, name: "Orion" },
] as unknown as Lodge[];

const users = [
  { matrikelnummer: 101, firstname: "Anders", lastname: "A", lodgeId: 3 },
  { matrikelnummer: 102, firstname: "Bertil", lastname: "B", lodgeId: 5 },
  { matrikelnummer: 103, firstname: "Carl", lastname: "C", lodgeId: 7 },
] as unknown as PublicUser[];

function renderFields(overrides: Partial<FieldsProps> = {}) {
  const props: FieldsProps = {
    lodges,
    groups: [],
    users,
    lodgeUsers: [],
    selectedLodgeIds: [],
    selectedGroupIds: [],
    selectedUserIds: [],
    onLodgeChange: vi.fn(),
    onGroupChange: vi.fn(),
    onUserChange: vi.fn(),
    clearServerField: vi.fn(),
    errors: {},
    disabled: false,
    ...overrides,
  };
  render(<EventAudienceFields {...props} />);
  return props;
}

describe("EventAudienceFields lodge selection", () => {
  it("keeps the other lodges selectable after one lodge is picked", () => {
    const props = renderFields({
      selectedLodgeIds: ["3"],
      lodgeUsers: [users[0]],
    });

    const capella = screen.getByRole("checkbox", { name: "Capella" });
    expect(screen.getByRole("checkbox", { name: "Regulus" })).toBeChecked();
    expect(capella).toBeEnabled();

    fireEvent.click(capella);
    expect(props.onLodgeChange).toHaveBeenCalledWith(["3", "5"]);
  });

  it("removes only the unticked lodge from a multi-lodge selection", () => {
    const props = renderFields({
      selectedLodgeIds: ["3", "5"],
      lodgeUsers: [users[0], users[1]],
    });

    fireEvent.click(screen.getByRole("checkbox", { name: "Regulus" }));
    expect(props.onLodgeChange).toHaveBeenCalledWith(["5"]);
  });

  it("shows a lodge fully covered by other selections as read-only and never sends it", () => {
    // Orion's only member (103) is selected individually.
    const props = renderFields({
      selectedLodgeIds: ["3"],
      lodgeUsers: [users[0]],
      selectedUserIds: ["103"],
    });

    const orion = screen.getByRole("checkbox", { name: /Orion/ });
    expect(orion).toBeChecked();
    expect(orion).toBeDisabled();
    expect(screen.getByText("täckt av urvalet")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox", { name: "Capella" }));
    expect(props.onLodgeChange).toHaveBeenCalledWith(["3", "5"]);
  });
});
