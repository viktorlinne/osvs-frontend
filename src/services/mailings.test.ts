import { describe, expect, it } from "vitest";
import {
  parseCreatedMailing,
  parseMailingDetail,
  parseMailingPreview,
  parseMailings,
} from "./mailings";

describe("mailings service parsers", () => {
  it("normalizes the preview and drops unknown reasons", () => {
    expect(
      parseMailingPreview({
        preview: {
          recipients: 3,
          skipped: 2,
          skippedByReason: { archived: 1, placeholder: "1", bogus: 4 },
          devAllowlist: { active: true, blocked: 0 },
        },
      }),
    ).toEqual({
      recipients: 3,
      skipped: 2,
      skippedByReason: { archived: 1, placeholder: 1 },
      devAllowlist: { active: true, blocked: 0 },
    });
  });

  it("reads the create response and rejects payloads without id", () => {
    expect(
      parseCreatedMailing({
        success: true,
        mailing: { id: 17, status: "queued", queued: 3, skipped: 1, skippedByReason: { no_email: 1 } },
      }),
    ).toEqual({ id: 17, status: "queued", queued: 3, skipped: 1, skippedByReason: { no_email: 1 } });
    expect(() => parseCreatedMailing({ mailing: {} })).toThrow();
  });

  it("parses the mailing list and detail", () => {
    const summary = {
      id: 1,
      groupId: 5,
      groupName: "G",
      subject: "S",
      senderName: "Anna",
      senderEmail: "a@x.se",
      status: "sending",
      createdAt: "2026-10-21T21:32:47.000Z",
      counts: { sent: 2, pending: 1, failed: 0, skipped: 1 },
    };
    expect(parseMailings({ mailings: [summary, { id: "x" }] })).toEqual([summary]);

    const detail = parseMailingDetail({
      mailing: {
        ...summary,
        body: "B",
        recipients: [
          {
            id: 9,
            uid: 4,
            name: "Bo",
            email: "bo@x.se",
            status: "skipped",
            skipReason: "archived",
            reason: "Arkiverad medlem",
            attempts: 0,
            lastError: null,
            sentAt: null,
          },
        ],
      },
    });
    expect(detail.body).toBe("B");
    expect(detail.recipients[0]).toMatchObject({ status: "skipped", reason: "Arkiverad medlem" });
  });
});
