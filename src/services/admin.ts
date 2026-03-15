import api, { fetchData } from "./api";
import type { Role } from "../types";
import { readArrayField } from "./parsers/response";

function normalizeRole(value: unknown): Role | null {
  if (typeof value !== "object" || value === null) return null;

  const record = value as Record<string, unknown>;
  const id = Number(record.id);
  const name = String(record.name ?? record.role ?? record.roleName ?? "").trim();
  if (!Number.isFinite(id) || name.length === 0) return null;

  return {
    id,
    name,
    role:
      name === "Admin" || name === "Editor" || name === "Member"
        ? name
        : undefined,
  };
}

export async function listRoles(): Promise<Role[]> {
  const response = await fetchData(api.get("/admin/roles"));
  return readArrayField<unknown>(response, "roles")
    .map(normalizeRole)
    .filter((role): role is Role => Boolean(role));
}

export default { listRoles };
