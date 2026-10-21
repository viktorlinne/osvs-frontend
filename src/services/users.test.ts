import { describe, expect, it, vi } from "vitest";

const apiMock = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("./api", () => ({
  default: apiMock,
  api: apiMock,
  fetchData: (promise: Promise<unknown>) => promise,
}));

import { listAllUsers } from "./users";

function pageBody(page: number, totalPages: number, ids: number[]) {
  return {
    users: ids.map((id) => ({
      matrikelnummer: id,
      firstname: `F${id}`,
      lastname: `L${id}`,
    })),
    page,
    pageSize: 100,
    total: 250,
    totalPages,
  };
}

describe("listAllUsers", () => {
  it("fetches every page at the backend's max page size", async () => {
    apiMock.get.mockImplementation(async (url: string) => {
      const page = Number(new URL(url, "http://x").searchParams.get("page"));
      if (page === 1) return pageBody(1, 3, [1, 2]);
      if (page === 2) return pageBody(2, 3, [3, 2]);
      return pageBody(3, 3, [4]);
    });

    const users = await listAllUsers({ lodgeId: 5 });

    expect(users.map((u) => u.matrikelnummer)).toEqual([1, 2, 3, 4]);
    const urls = apiMock.get.mock.calls.map(([url]) => String(url));
    expect(urls).toHaveLength(3);
    for (const url of urls) {
      expect(url).toContain("pageSize=100");
      expect(url).toContain("lodgeId=5");
    }
  });

  it("makes a single request when everything fits on one page", async () => {
    apiMock.get.mockReset();
    apiMock.get.mockResolvedValue(pageBody(1, 1, [7]));

    const users = await listAllUsers({ name: "Ek" });

    expect(users).toHaveLength(1);
    expect(apiMock.get).toHaveBeenCalledTimes(1);
  });
});
