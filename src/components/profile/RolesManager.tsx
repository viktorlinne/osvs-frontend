import type { Role } from "../../types";

export const RolesManager = ({
  rolesList,
  selectedRoleIds,
  setSelectedRoleIds,
  canEditRoles,
  isEditRoute,
  viewModeRoles = [],
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
  viewModeRoles?: string[];
}) => {
  if (isEditRoute && canEditRoles) {
    return (
      <div className="w-full">
        <fieldset className="w-full">
          <legend className="ui-label">Roller</legend>
          <div className="flex flex-col gap-2 py-2 sm:flex-row sm:flex-wrap">
            {rolesList.map((r) => (
              <label
                key={r.id}
                htmlFor={`role-${r.id}`}
                className="inline-flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-700"
              >
                <input
                  id={`role-${r.id}`}
                  name="roles"
                  type="checkbox"
                  value={r.id}
                  checked={selectedRoleIds.includes(r.id)}
                  className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus-visible:ring-primary-600"
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...selectedRoleIds, r.id]
                      : selectedRoleIds.filter((id) => id !== r.id);
                    setSelectedRoleIds(next);
                  }}
                />
                <span>{r.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    );
  }

  if (!isEditRoute && viewModeRoles.length > 0) {
    return (
      <div>
        <p className="ui-label">Roller</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {viewModeRoles.map((role) => (
            <span
              key={role}
              className="rounded border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-700"
            >
              {role}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return null;
};
