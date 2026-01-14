import type { Role } from "../../types";

export const RolesManager = ({
  rolesList,
  selectedRoleIds,
  setSelectedRoleIds,
  canEditRoles,
  isEditRoute,
}: {
  userId?: number | null;
  rolesList: Role[];
  selectedRoleIds: number[];
  setSelectedRoleIds: (ids: number[]) => void;
  canEditRoles: boolean;
  saveRoles: (targetUserId: number, ids: number[]) => Promise<void>;
  setGlobalError: (s: string) => void;
  setSaving: (b: boolean) => void;
  isEditRoute?: boolean;
}) => {
  if (!canEditRoles || !isEditRoute) return null;

  return (
    <div className="mb-4 w-full flex flex-col items-center">
      <fieldset className="text-center mb-1">
        <legend className="block font-medium">Roller</legend>
        <div className="flex flex-col md:flex-row gap-2 py-2">
          {rolesList.map((r) => (
            <label
              key={r.id}
              htmlFor={`role-${r.id}`}
              className="inline-flex items-center gap-2 border rounded-md px-3 py-2"
            >
              <input
                id={`role-${r.id}`}
                name="roles"
                type="checkbox"
                value={r.id}
                checked={selectedRoleIds.includes(r.id)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...selectedRoleIds, r.id]
                    : selectedRoleIds.filter((id) => id !== r.id);
                  setSelectedRoleIds(next);
                }}
              />
              <span className="text-sm text-gray-700">{r.name}</span>
            </label>
          ))}
          {/* Role save is handled by parent consolidated save */}
        </div>
      </fieldset>
    </div>
  );
};
