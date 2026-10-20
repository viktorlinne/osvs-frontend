import { afterEach, describe, expect, it, vi } from "vitest";
import api from "./api";
import {
  deleteOfficialEntry,
  getMemberChangeLog,
  parseChangeLogEntry,
  updateOfficialEntry,
} from "./memberHistory";

afterEach(() => {
  vi.restoreAllMocks();
});

function ok<T>(data: T) {
  return Promise.resolve({ data, config: {}, status: 200 } as never);
}

describe("memberHistory service", () => {
  it("sends the note in the DELETE body", async () => {
    const spy = vi.spyOn(api, "delete").mockReturnValue(ok({ success: true }));
    await deleteOfficialEntry(7, 31, "Dubblett");
    expect(spy).toHaveBeenCalledWith("/users/7/officials/31", {
      data: { note: "Dubblett" },
    });
  });

  it("sends datesConfirmed when updating a tjänst and parses the entry", async () => {
    const spy = vi.spyOn(api, "put").mockReturnValue(
      ok({
        success: true,
        entry: {
          id: 31,
          officialId: 2,
          title: "Ordförande",
          appointedAt: "2019-01-15",
          unappointedAt: null,
        },
      }),
    );
    const payload = {
      officialId: 2,
      appointedAt: "2019-01-15",
      unappointedAt: null,
      datesConfirmed: true,
      note: "Rättelse",
    };
    const entry = await updateOfficialEntry(7, 31, payload);
    expect(spy).toHaveBeenCalledWith("/users/7/officials/31", payload);
    expect(entry).toEqual({
      id: 31,
      officialId: 2,
      title: "Ordförande",
      appointedAt: "2019-01-15",
      unappointedAt: null,
    });
  });

  it("normalizes change-log entries and drops malformed rows", async () => {
    vi.spyOn(api, "get").mockReturnValue(
      ok({
        entries: [
          {
            id: 1,
            entityType: "achievement",
            action: "delete",
            entryId: 88,
            oldValue: { achievementId: 3, title: "III", awardedAt: "2021-03-20 00:00:00" },
            newValue: null,
            note: "Fel",
            editorId: 9,
            editorName: null,
            createdAt: "2026-10-21 10:00:00",
          },
          { id: "x" },
        ],
      }),
    );
    const entries = await getMemberChangeLog(7);
    expect(entries).toHaveLength(1);
    expect(entries[0].oldValue).toEqual({
      itemId: 3,
      title: "III",
      date: "2021-03-20 00:00:00",
      endDate: null,
    });
    expect(parseChangeLogEntry(null)).toBeNull();
  });
});
