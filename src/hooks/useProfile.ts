import { useEffect, useState } from "react";
import { useAuth, useError } from "../context";
import { getUserLodge, postAchievement } from "../services";
import { listRoles } from "../services/admin";
import achievementsService from "../services/achievements";
import type { Achievement, Lodge, Role, PublicUser } from "../types";

export const useProfile = () => {
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
        if (user?.id) {
          const cur = await getUserLodge(user.id);
          if (cur && cur.lodge) setLodge(cur.lodge);
        }

        try {
          const r = await listRoles();
          let items: Array<Record<string, unknown>> = [];
          const raw = r as Record<string, unknown> | undefined;
          if (Array.isArray(r)) items = r as Array<Record<string, unknown>>;
          else if (raw && Array.isArray(raw.roles))
            items = raw.roles as Array<Record<string, unknown>>;

          if (items.length > 0) {
            const rolesArray = items.map((item) => ({
              id: Number(item.id),
              name: String(item.name ?? item.role ?? item.roleName ?? ""),
            }));
            if (mounted) setRolesList(rolesArray);

            const ids = (user?.roles ?? [])
              .map((rn) => {
                const rnName =
                  typeof rn === "string"
                    ? rn
                    : ((): string => {
                        const rec = rn as Record<string, unknown>;
                        return String(
                          rec["name"] ?? rec["role"] ?? rec["id"] ?? ""
                        );
                      })();
                return rolesArray.find((x) => x.name === rnName)?.id;
              })
              .filter((v): v is number => Boolean(v));
            if (mounted) setSelectedRoleIds(ids);
          }
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
  }, [user?.id, user?.roles]);

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
      const { setRoles } = await import("../services");
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
