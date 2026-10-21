import { describe, expect, it } from "vitest";
import {
  formatConfirmQuestion,
  formatMailingCounts,
  formatPreviewSummary,
  formatSkippedReasons,
  isMailingInProgress,
  validateMailingBody,
  validateMailingSubject,
} from "./mailings";

describe("mailing helpers", () => {
  it("formats skip reasons in Swedish", () => {
    expect(formatSkippedReasons({ archived: 2, no_email: 3 })).toBe(
      "3 saknar e-post, 2 arkiverade",
    );
    expect(formatSkippedReasons({ archived: 1, placeholder: 4 })).toBe(
      "4 har bara platshållaradress, 1 arkiverad",
    );
    expect(formatSkippedReasons({})).toBe("");
  });

  it("builds the preview line and confirmation question", () => {
    expect(formatPreviewSummary(12, 5)).toBe("12 mottagare får utskicket. 5 hoppas över:");
    expect(formatPreviewSummary(1, 0)).toBe("1 mottagare får utskicket.");
    expect(formatPreviewSummary(0, 3)).toBe("Ingen i gruppen kan ta emot e-post.");
    expect(formatConfirmQuestion(12)).toBe("Skicka till 12 mottagare?");
  });

  it("formats counts, omitting zero parts after sent", () => {
    expect(formatMailingCounts({ sent: 12, pending: 3, failed: 1, skipped: 5 })).toBe(
      "12 skickade · 3 väntar · 1 misslyckad · 5 hoppades över",
    );
    expect(formatMailingCounts({ sent: 1, pending: 0, failed: 0, skipped: 0 })).toBe(
      "1 skickad",
    );
  });

  it("knows which statuses are still in progress", () => {
    expect(isMailingInProgress("queued")).toBe(true);
    expect(isMailingInProgress("sending")).toBe(true);
    expect(isMailingInProgress("done")).toBe(false);
  });

  it("validates subject and body like the backend", () => {
    expect(validateMailingSubject("  ")).toBe("Ämne är obligatoriskt");
    expect(validateMailingSubject("x".repeat(201))).toBe("Ämnet får vara högst 200 tecken");
    expect(validateMailingSubject("a\nb")).toBe("Ämnet får inte innehålla radbrytningar");
    expect(validateMailingSubject("Kallelse")).toBe(true);
    expect(validateMailingBody("")).toBe("Meddelande är obligatoriskt");
    expect(validateMailingBody("x".repeat(20001))).toBe("Meddelandet får vara högst 20000 tecken");
    expect(validateMailingBody("Hej")).toBe(true);
  });
});
