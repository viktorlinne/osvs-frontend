import { describe, expect, it } from "vitest";
import { parseGroupMembers, parseGroups } from "./groups";

describe("groups service parsers", () => {
  it("reads memberCount and falls back to userIds length for older payloads", () => {
    const groups = parseGroups({
      groups: [
        { id: 1, name: "Ny", description: null, userIds: [3, 4], memberCount: 2 },
        { id: 2, name: "Gammal", userIds: ["5"] },
        { id: "x", name: "Ogiltig" },
        { id: 3, name: "   " },
      ],
    });

    expect(groups).toEqual([
      { id: 1, name: "Ny", description: null, userIds: [3, 4], memberCount: 2 },
      { id: 2, name: "Gammal", description: null, userIds: [5], memberCount: 1 },
    ]);
  });

  it("normalizes members and drops rows without matrikelnummer", () => {
    expect(
      parseGroupMembers({
        members: [
          { matrikelnummer: 7, firstname: "Anna", lastname: "Ek", email: "a@x.se", archive: null },
          { firstname: "Saknar", lastname: "Id" },
        ],
      }),
    ).toEqual([
      { matrikelnummer: 7, firstname: "Anna", lastname: "Ek", email: "a@x.se", archive: null },
    ]);
  });
});
