import type { Achievement, PublicUser } from "../../types";

export const AchievementsPanel = ({
  user,
  achievements,
  available,
  selectedAid,
  setSelectedAid,
  awardDate,
  setAwardDate,
  canAward,
  assignAchievement,
  lodge,
  isEditRoute,
}: {
  user?: PublicUser | null;
  achievements: Achievement[];
  available: Achievement[];
  selectedAid?: number | null;
  setSelectedAid: (id: number | null) => void;
  awardDate: string;
  setAwardDate: (d: string) => void;
  canAward: boolean;
  assignAchievement: (
    targetUserId: number,
    achievementId: number,
    awardedAt?: string
  ) => Promise<void>;
  lodge?: { name?: string } | null;
  isEditRoute?: boolean;
}) => {
  return (
    <div className="w-full flex flex-col gap-4 mb-4">
      <div className="flex flex-col items-center">
        <img
          className="rounded-full w-28 h-28 md:w-40 md:h-40 object-cover mb-1"
          src={`${import.meta.env.VITE_BACKEND_URL}${user?.pictureUrl}`}
          alt={`${user?.firstname} ${user?.lastname}`}
        />

        <div className="text-left mb-4">
          <div className="text-sm text-gray-700 italic">
            {user?.firstname} {user?.lastname}
          </div>
        </div>

        <div className="text-center mb-1">
          <label className="block font-medium">Loge</label>
          <div className="text-sm text-gray-700 mb-4">
            {lodge?.name ?? "Ingen loge"}
          </div>
        </div>

        <div className="text-center mb-1">
          <label className="block font-medium">Utmärkelser</label>
          {achievements && achievements.length > 0 ? (
            <select className="w-auto border rounded px-4 py-2 mb-4">
              {achievements.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} —{" "}
                  {a.awardedAt
                    ? new Date(a.awardedAt).toLocaleDateString()
                    : ""}
                </option>
              ))}
            </select>
          ) : (
            <div className="text-sm text-gray-500 mb-4">Inga utmärkelser</div>
          )}
        </div>

        {isEditRoute && canAward ? (
          <div className="text-center mb-1">
            <label className="block font-medium">Tilldela ny utmärkelse</label>
            <div className="flex flex-col md:flex-row gap-2">
              <select
                value={selectedAid ?? ""}
                onChange={(e) =>
                  setSelectedAid(e.target.value ? Number(e.target.value) : null)
                }
                className="border rounded px-3 py-2 w-full"
              >
                <option value="">Välj utmärkelse</option>
                {available.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.title}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={awardDate}
                onChange={(e) => setAwardDate(e.target.value)}
                className="border rounded px-3 py-2 w-full"
              />
              <button
                type="button"
                className="bg-green-600 hover:bg-green-700 transition text-white px-3 py-2 rounded w-auto"
                disabled={!selectedAid || !user?.id}
                onClick={async () => {
                  if (!selectedAid || !user?.id) return;
                  await assignAchievement(
                    user.id,
                    selectedAid,
                    awardDate || undefined
                  );
                  setSelectedAid(null);
                  setAwardDate("");
                }}
              >
                Tilldela
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
