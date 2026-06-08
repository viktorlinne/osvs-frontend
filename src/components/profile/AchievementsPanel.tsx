import { useState } from "react";
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
  const [imgFailed, setImgFailed] = useState(false);
  const initials =
    `${user?.firstname?.[0] ?? ""}${user?.lastname?.[0] ?? ""}`.toUpperCase() || "?";

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
      <div className="mx-auto shrink-0 sm:mx-0">
        {!imgFailed && user?.pictureUrl ? (
          <img
            src={user.pictureUrl}
            alt={`${user?.firstname ?? ""} ${user?.lastname ?? ""}`}
            className="h-28 w-28 rounded-full object-cover object-top ring-2 ring-primary-100 sm:h-32 sm:w-32"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary-100 ring-2 ring-primary-100 sm:h-32 sm:w-32">
            <span className="text-2xl font-semibold text-primary-700">{initials}</span>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 text-center sm:text-left">
        <p className="text-2xl font-semibold tracking-tight text-neutral-900">
          {user?.firstname} {user?.lastname}
        </p>

        <div className="mt-2">
          {isEditRoute && lodges && setSelectedLid ? (
            <div>
              <label htmlFor="lodge" className="ui-label">Loge</label>
              <select
                id="lodge"
                name="lodge"
                value={selectedLid ?? ""}
                onChange={(e) =>
                  setSelectedLid(e.target.value ? Number(e.target.value) : null)
                }
                className="ui-select"
              >
                <option value="">— Ingen loge —</option>
                {lodges.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="ui-chapter">
              {lodge?.name ?? "Ingen loge"}
            </p>
          )}
        </div>

        <div className="mt-4">
          <p className="ui-label">Utmärkelser</p>
          {achievements.length > 0 ? (
            <ul className="mt-1.5 flex flex-wrap justify-center gap-2 sm:justify-start">
              {achievements.map((a) => (
                <li
                  key={a.id}
                  className="rounded border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs text-primary-800"
                >
                  {a.title}
                  {a.awardedAt ? (
                    <span className="ml-1.5 text-primary-700">
                      {new Date(a.awardedAt).toLocaleDateString("sv-SE")}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-neutral-500">Inga utmärkelser</p>
          )}
        </div>

        {isEditRoute && canAward ? (
          <div className="mt-4">
            <label htmlFor="awardSelect" className="ui-label">Tilldela ny utmärkelse</label>
            <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-end">
              <select
                id="awardSelect"
                name="award"
                value={selectedAid ?? ""}
                onChange={(e) =>
                  setSelectedAid(e.target.value ? Number(e.target.value) : null)
                }
                className="ui-select"
              >
                <option value="">Välj utmärkelse</option>
                {available.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.title}
                  </option>
                ))}
              </select>
              <div className="sm:shrink-0">
                <label htmlFor="awardDate" className="ui-label">Datum</label>
                <input
                  id="awardDate"
                  name="awardDate"
                  type="date"
                  value={awardDate}
                  onChange={(e) => setAwardDate(e.target.value)}
                  className="ui-input"
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
