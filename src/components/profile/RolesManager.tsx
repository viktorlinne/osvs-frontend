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
    <div className="mb-4 w-full">
      <fieldset className="w-full text-center">
        <legend className="ui-label text-center">Roller</legend>
        <div className="flex flex-col gap-2 py-2 md:flex-row md:flex-wrap md:justify-center">
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
};
