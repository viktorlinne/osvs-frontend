import { useEffect, useState } from "react";
import { useAuth, useError } from "../context";
import { getUserLodge, postAchievement, setRoles } from "../services/users";
import { listRoles } from "../services/admin";
import achievementsService from "../services/achievements";
import type { Achievement, Lodge, Role, PublicUser } from "../types";

export const useProfile = ({ isEditRoute }: { isEditRoute: boolean }) => {
  const { user, refresh } = useAuth();
  const { setError: setGlobalError } = useError();

  const achievements: PublicUser["achievements"] = user?.achievements ?? [];
  const [available, setAvailable] = useState<Achievement[]>([]);
  const [lodge, setLodge] = useState<Lodge | null>(null);
  const [rolesList, setRolesList] = useState<Role[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [selectedAid, setSelectedAid] = useState<number | null>(null);
  const [awardDate, setAwardDate] = useState<string>("");

  const canAward = Boolean(
    user && (user.roles ?? []).some((r) => ["Admin", "Editor"].includes(r))
  );
  const canEditRoles = canAward;
  const shouldLoadRoleData = canEditRoles && isEditRoute;

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const list = await achievementsService.listAchievements();
        if (mounted) setAvailable(list);
      } catch {
        // ignore
      }
    })();

    (async () => {
      try {
        if (user?.matrikelnummer) {
          const cur = await getUserLodge(user.matrikelnummer);
          if (cur && cur.lodge) setLodge(cur.lodge);
        }

        if (!shouldLoadRoleData) {
          if (mounted) {
            setRolesList([]);
            setSelectedRoleIds([]);
          }
          return;
        }

        try {
          const rolesArray = await listRoles();
          if (mounted) setRolesList(rolesArray);

          const ids = (user?.roles ?? [])
            .map((rn) => {
              const rnName = typeof rn === "string" ? rn : "";
              return rolesArray.find((x) => (x.name ?? x.role ?? "") === rnName)?.id;
            })
            .filter((v): v is number => Boolean(v));
          if (mounted) setSelectedRoleIds(ids);
        } catch {
          // ignore
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user?.matrikelnummer, user?.roles, shouldLoadRoleData]);

  async function assignAchievement(
    targetUserId: number,
    achievementId: number,
    awardedAt?: string
  ) {
    try {
      await postAchievement(targetUserId, { achievementId, awardedAt });
      await refresh();
    } catch {
      setGlobalError("Misslyckades att tilldela utmärkelse");
    }
  }

  async function saveRoles(targetUserId: number, ids: number[]) {
    try {
      await setRoles(targetUserId, ids);
      await refresh();
    } catch {
      setGlobalError("Misslyckades att uppdatera roller");
    }
  }

  return {
    user,
    refresh,
    achievements,
    available,
    lodge,
    rolesList,
    selectedRoleIds,
    setSelectedRoleIds,
    selectedAid,
    setSelectedAid,
    awardDate,
    setAwardDate,
    canAward,
    canEditRoles,
    assignAchievement,
    saveRoles,
  } as const;
};
