import api, { fetchData } from "./api";
import type {
  AddGroupMembersResult,
  Group,
  GroupInput,
  GroupMember,
} from "../types";
import { readArrayField, readObjectField, readRecord } from "./parsers/response";

type RawGroup = {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  userIds?: unknown;
  memberCount?: unknown;
};

type RawGroupMember = {
  matrikelnummer?: unknown;
  firstname?: unknown;
  lastname?: unknown;
  email?: unknown;
  archive?: unknown;
};

function toNumberList(value: unknown): number[] {
  return Array.isArray(value)
    ? value
        .map((item) => Number(item))
        .filter((item): item is number => Number.isFinite(item))
    : [];
}

export function parseGroup(group: RawGroup | null | undefined): Group | null {
  if (!group) return null;
  const id = Number(group.id);
  const name = String(group.name ?? "");
  if (!Number.isFinite(id) || name.trim().length === 0) return null;

  const userIds = toNumberList(group.userIds);
  const memberCount = Number(group.memberCount);
  return {
    id,
    name,
    description: group.description == null ? null : String(group.description),
    userIds,
    memberCount: Number.isFinite(memberCount) ? memberCount : userIds.length,
  };
}

export function parseGroups(source: unknown): Group[] {
  return readArrayField<RawGroup>(source, "groups")
    .map(parseGroup)
    .filter((group): group is Group => group !== null);
}

function parseGroupField(source: unknown): Group {
  const group = parseGroup(readObjectField(source, "group") as RawGroup | null);
  if (!group) throw new Error("Ogiltigt svar från servern");
  return group;
}

export function parseGroupMembers(source: unknown): GroupMember[] {
  return readArrayField<RawGroupMember>(source, "members")
    .map((member) => ({
      matrikelnummer: Number(member.matrikelnummer),
      firstname: String(member.firstname ?? ""),
      lastname: String(member.lastname ?? ""),
      email: String(member.email ?? ""),
      archive: member.archive == null ? null : String(member.archive),
    }))
    .filter((member) => Number.isFinite(member.matrikelnummer));
}

export async function listGroups(): Promise<Group[]> {
  return parseGroups(await fetchData(api.get("/groups")));
}

export async function getGroup(id: number | string): Promise<Group> {
  return parseGroupField(await fetchData(api.get(`/groups/${id}`)));
}

export async function createGroup(payload: GroupInput): Promise<Group> {
  return parseGroupField(await fetchData(api.post("/groups", payload)));
}

export async function updateGroup(
  id: number | string,
  payload: Partial<GroupInput>,
): Promise<Group> {
  return parseGroupField(await fetchData(api.put(`/groups/${id}`, payload)));
}

export async function deleteGroup(id: number | string): Promise<void> {
  await fetchData(api.delete(`/groups/${id}`));
}

export async function listGroupMembers(
  id: number | string,
): Promise<GroupMember[]> {
  return parseGroupMembers(await fetchData(api.get(`/groups/${id}/members`)));
}

export async function addGroupMembers(
  id: number | string,
  userIds: number[],
): Promise<AddGroupMembersResult> {
  const data = await fetchData(api.post(`/groups/${id}/members`, { userIds }));
  const record = readRecord(data);
  return {
    added: toNumberList(record?.added),
    alreadyMembers: toNumberList(record?.alreadyMembers),
  };
}

export async function removeGroupMember(
  id: number | string,
  matrikelnummer: number,
): Promise<void> {
  await fetchData(api.delete(`/groups/${id}/members/${matrikelnummer}`));
}

export default {
  listGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  listGroupMembers,
  addGroupMembers,
  removeGroupMember,
};
