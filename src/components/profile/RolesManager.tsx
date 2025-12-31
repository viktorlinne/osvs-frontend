import type { Role } from "../../types";

export const RolesManager = ({
  userId,
  rolesList,
  selectedRoleIds,
  setSelectedRoleIds,
  canEditRoles,
  saveRoles,
  setGlobalError,
  setSaving,
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
      <div className="text-center mb-1">
        <label className="block font-medium">Roller</label>
        <div className="flex flex-col md:flex-row gap-2 py-2">
          {rolesList.map((r) => (
            <label
              key={r.id}
              className="inline-flex items-center gap-2 border rounded px-3 py-2"
            >
              <input
                type="checkbox"
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
          <button
            type="button"
            className="bg-green-600 hover:bg-green-700 transition text-white px-3 py-2 rounded w-auto"
            onClick={async () => {
              if (!userId) return setGlobalError("Invalid target");
              try {
                setGlobalError("");
                setSaving(true);
                await saveRoles(userId, selectedRoleIds);
              } catch {
                setGlobalError("Misslyckades att uppdatera roller");
              } finally {
                setSaving(false);
              }
            }}
          >
            Spara roller
          </button>
        </div>
      </div>
    </div>
  );
};
