import type { Achievement, Lodge, PublicUser } from "../../types";

export const AchievementsPanel = ({
  user,
  achievements,
  available,
  selectedAid,
  setSelectedAid,
  awardDate,
  setAwardDate,
  canAward,
  lodge,
  lodges,
  selectedLid,
  setSelectedLid,
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
    awardedAt?: string,
  ) => Promise<void>;
  lodge?: Lodge | null;
  lodges?: Lodge[];
  selectedLid?: number | null;
  setSelectedLid?: (id: number | null) => void;
  onSaveLodge?: (targetUserId: number, lodgeId: number | null) => Promise<void>;
  isEditRoute?: boolean;
}) => {
  return (
    <div className="mb-4 flex w-full flex-col gap-4">
      <div className="flex flex-col items-center">
        <img
          className="mb-1 h-28 w-28 rounded-full object-cover md:h-40 md:w-40"
          src={user?.pictureUrl}
          alt={`${user?.firstname} ${user?.lastname}`}
        />

        <div className="mb-4 text-left">
          <div className="text-sm italic text-neutral-700">
            {user?.firstname} {user?.lastname}
          </div>
        </div>

        <fieldset className="mb-1 w-full text-center">
          <legend className="ui-label text-center">Loge</legend>
          {isEditRoute && lodges && setSelectedLid ? (
            <div className="flex flex-col items-center justify-center gap-2 py-2 md:flex-row">
              <select
                id="lodge"
                name="lodge"
                value={selectedLid ?? ""}
                onChange={(e) =>
                  setSelectedLid(e.target.value ? Number(e.target.value) : null)
                }
                className="ui-select w-full md:w-auto"
              >
                {lodges.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="mb-4 text-sm text-neutral-700">{lodge?.name ?? "Ingen loge"}</div>
          )}
        </fieldset>

        <div className="mb-1 text-center">
          <label htmlFor="achievementsList" className="ui-label text-center">Utmärkelser</label>
          {achievements && achievements.length > 0 ? (
            <select id="achievementsList" name="achievementsList" className="ui-select w-auto">
              {achievements.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} - {a.awardedAt ? new Date(a.awardedAt).toLocaleDateString() : ""}
                </option>
              ))}
            </select>
          ) : (
            <div className="mb-4 text-sm text-neutral-600">Inga utmärkelser</div>
          )}
        </div>

        {isEditRoute && canAward ? (
          <div className="mb-1 text-center">
            <label htmlFor="awardSelect" className="ui-label text-center">Tilldela ny utmärkelse</label>
            <div className="flex flex-col gap-2 md:flex-row">
              <select
                id="awardSelect"
                name="award"
                value={selectedAid ?? ""}
                onChange={(e) =>
                  setSelectedAid(e.target.value ? Number(e.target.value) : null)
                }
                className="ui-select w-full"
              >
                <option value="">Välj utmärkelse</option>
                {available.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.title}
                  </option>
                ))}
              </select>
              <input
                id="awardDate"
                name="awardDate"
                type="date"
                value={awardDate}
                onChange={(e) => setAwardDate(e.target.value)}
                className="ui-input w-full"
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
