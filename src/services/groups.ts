import api, { fetchData } from "./api";
import type { Group } from "../types";
import { readArrayField } from "./parsers/response";

type RawGroup = {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  userIds?: unknown;
};

function parseGroups(source: unknown): Group[] {
  return readArrayField<RawGroup>(source, "groups")
    .map((group) => ({
      id: Number(group.id),
      name: String(group.name ?? ""),
      description: group.description == null ? null : String(group.description),
      userIds: Array.isArray(group.userIds)
        ? group.userIds
            .map((userId) => Number(userId))
            .filter((userId): userId is number => Number.isFinite(userId))
        : [],
    }))
    .filter((group) => Number.isFinite(group.id) && group.name.trim().length > 0);
}

export async function listGroups(): Promise<Group[]> {
  return parseGroups(await fetchData(api.get("/groups")));
}

export default {
  listGroups,
};
