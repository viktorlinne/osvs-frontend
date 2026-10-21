import { describe, expect, it } from "vitest";
import { idsFromField, sameIds, selectionChanged } from "./idSets";

describe("idSets", () => {
  it("reads ids from objects or plain values", () => {
    expect(idsFromField([{ id: 2 }, "3", { name: "x" }])).toEqual([2, 3]);
    expect(idsFromField(null)).toEqual([]);
  });

  it("compares ignoring order and duplicates", () => {
    expect(sameIds([1, 2], [2, 1, 1])).toBe(true);
    expect(sameIds([1], [1, 2])).toBe(false);
  });

  it("treats an untouched (null) selection as unchanged", () => {
    expect(selectionChanged(null, [1])).toBe(false);
    expect(selectionChanged([1], [1])).toBe(false);
    expect(selectionChanged([], [1])).toBe(true);
  });
});
