import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { Spinner, NotFound } from "../components";
import useFetch from "../hooks/useFetch";
import { useError, useAuth } from "../context";
import type { PublicUser, Achievement, Lodge, Role } from "../types";
import { postAchievement, getUserLodge, setUserLodge } from "../services/users";
import achievementsService from "../services/achievements";
import lodgesService from "../services/lodges";
import { listRoles } from "../services/admin";
import { setRoles } from "../services";
import { useForm } from "react-hook-form";
import type { UpdateUserForm } from "../types";
import {
  AchievementsPanel,
  RolesManager,
  ProfileForm,
} from "../components/profile/";

export const MemberDetail = () => {
  const { id } = useParams<{ id: string }>();
  const {
    run,
    loading,
    data: member,
    notFound,
  } = useFetch<PublicUser | null>();
  const { setError: setGlobalError, clearError: clearGlobalError } = useError();
  const { user } = useAuth();
  const { user: currentUser } = useAuth();
  const canAward = Boolean(
    currentUser &&
      (currentUser.roles ?? []).some((r) => ["Admin", "Editor"].includes(r))
  );
  const [selectedAid, setSelectedAid] = useState<number | null>(null);
  const [awardDate, setAwardDate] = useState<string>("");
  const [selectedLid, setSelectedLid] = useState<number | null>(null);
  const [available, setAvailable] = useState<Achievement[]>([]);
  const [lodges, setLodges] = useState<Lodge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [rolesList, setRolesList] = useState<Role[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  const canEdit = Boolean(
    user && (user.roles ?? []).some((r) => ["Admin", "Editor"].includes(r))
  );
  const location = useLocation();
  const isEditRoute = location.pathname.endsWith("/edit");

  const [saving, setSaving] = useState(false);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  // removed duplicate useError destructure; use `setGlobalError` / `clearGlobalError`

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateUserForm>({
    defaultValues: {
      firstname: "",
      lastname: "",
      dateOfBirth: "",
      official: undefined,
      notes: undefined,
      mobile: "",
      homeNumber: "",
      city: "",
      address: "",
      zipcode: "",
    },
  });

  useEffect(() => {
    if (!id) return setGlobalError("Saknar medlems-id");
    run(async () => {
      const resp = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/${id}`,
        { credentials: "include" }
      );
      if (!resp.ok) throw new Error("Misslyckades att hämta medlem");
      const json = await resp.json();
      setAchievements(
        Array.isArray(json.achievements) ? json.achievements : []
      );
      return (json.user ?? null) as PublicUser | null;
    }).catch(() => {});
    (async () => {
      try {
        const list = await achievementsService.listAchievements();
        setAvailable(list);
      } catch {
        // ignore
      }
    })();
    // fetch lodges list and current user's lodge
    (async () => {
      try {
        const l = await lodgesService.listLodges();
        setLodges(Array.isArray(l) ? l : []);
      } catch {
        // ignore
      }
      try {
        const r = await listRoles();
        // accept either an array or { roles: [...] }
        const raw = r as Record<string, unknown> | undefined;
        let items: Array<Record<string, unknown>> = [];
        if (Array.isArray(r)) items = r as Array<Record<string, unknown>>;
        else if (raw && Array.isArray(raw.roles))
          items = raw.roles as Array<Record<string, unknown>>;
        if (items.length > 0) {
          const rolesArray = items.map((item) => ({
            id: Number(item.id),
            name: String(item.name ?? item.role ?? item.roleName ?? ""),
          }));
          setRolesList(rolesArray);
        }
      } catch {
        // ignore
      }
      try {
        const cur = await getUserLodge(id as string);
        setSelectedLid(cur?.lodge ? Number(cur.lodge.id) : null);
      } catch {
        // ignore
      }
    })();
  }, [id, run, setGlobalError]);

  useEffect(() => {
    // when member and rolesList available, set selectedRoleIds
    if (!member) return;
    if (!rolesList || rolesList.length === 0) return;
    const memberRoles = (member as unknown as Record<string, unknown>)[
      "roles"
    ] as Array<unknown> | undefined;
    const ids = (memberRoles ?? [])
      .map((rn: unknown) => {
        const rnName =
          typeof rn === "string"
            ? rn
            : ((): string => {
                const rec = rn as Record<string, unknown>;
                return String(rec["name"] ?? rec["role"] ?? rec["id"] ?? "");
              })();
        return rolesList.find((r) => r.name === rnName)?.id;
      })
      .filter((v: unknown): v is number => Boolean(v));
    setSelectedRoleIds(ids);
  }, [member, rolesList]);

  useEffect(() => {
    if (!member) return;
    reset({
      firstname: member.firstname ?? "",
      lastname: member.lastname ?? "",
      dateOfBirth: member.dateOfBirth
        ? String(member.dateOfBirth).slice(0, 10)
        : "",
      official: member.official ?? undefined,
      notes: member.notes ?? undefined,
      mobile: member.mobile ?? "",
      homeNumber: member.homeNumber ?? "",
      city: member.city ?? "",
      address: member.address ?? "",
      zipcode: member.zipcode ?? "",
    });
    setPictureFile(null);
  }, [member, reset]);

  useEffect(() => {
    if (!pictureFile) {
      return;
    }
    const url = URL.createObjectURL(pictureFile);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [pictureFile]);

  return (
    <div className="flex flex-col items-center min-h-screen">
      <div className="max-w-3xl w-full mx-auto p-6">
        <div className="flex items-center justify-between">
          <Link to="/members" className="text-sm text-green-600 underline">
            ← Tillbaka till medlemmar
          </Link>
          {canEdit && !isEditRoute && (
            <Link
              to={`/members/${id}/edit`}
              className="text-sm text-white bg-green-600 hover:bg-green-700 transition px-3 py-1 rounded-md"
            >
              Edit
            </Link>
          )}
        </div>
        <h2 className="text-2xl font-bold mt-4 mb-4">Medlem</h2>

        {loading && <Spinner />}
        {notFound ? (
          <NotFound />
        ) : (
          member && (
            <form
              onSubmit={handleSubmit(async () => {
                /* noop; Save button inside ProfileForm handles submit */
              })}
              className="bg-white p-4 rounded-md shadow"
            >
              {/* Compose shared profile components to match `Profile` structure */}
              <AchievementsPanel
                user={member}
                achievements={achievements}
                available={available}
                lodge={lodges.find((l) => l.id === selectedLid) ?? null}
                lodges={lodges}
                selectedLid={selectedLid}
                setSelectedLid={setSelectedLid}
                onSaveLodge={async (
                  targetUserId: number,
                  lodgeId: number | null
                ) => {
                  if (!targetUserId) throw new Error("Invalid target");
                  clearGlobalError();
                  setSaving(true);
                  try {
                    await setUserLodge(
                      String(targetUserId),
                      lodgeId === null ? null : Number(lodgeId)
                    );
                    await run(async () => {
                      const resp = await fetch(
                        `${import.meta.env.VITE_BACKEND_URL}/api/users/${id}`,
                        { credentials: "include" }
                      );
                      if (!resp.ok)
                        throw new Error("Misslyckades att hämta medlem");
                      const json = await resp.json();
                      setAchievements(
                        Array.isArray(json.achievements)
                          ? json.achievements
                          : []
                      );
                      return (json.user ?? null) as PublicUser | null;
                    });
                  } catch {
                    setGlobalError("Misslyckades att uppdatera loge");
                  } finally {
                    setSaving(false);
                  }
                }}
                isEditRoute={isEditRoute}
                selectedAid={selectedAid}
                setSelectedAid={setSelectedAid}
                awardDate={awardDate}
                setAwardDate={setAwardDate}
                canAward={canAward}
                assignAchievement={async (
                  targetUserId: number,
                  achievementId: number,
                  awardedAt?: string
                ) => {
                  if (!targetUserId) throw new Error("Invalid target");
                  clearGlobalError();
                  setSaving(true);
                  try {
                    await postAchievement(String(targetUserId), {
                      achievementId,
                      awardedAt,
                    });
                    await run(async () => {
                      const resp = await fetch(
                        `${import.meta.env.VITE_BACKEND_URL}/api/users/${id}`,
                        { credentials: "include" }
                      );
                      if (!resp.ok)
                        throw new Error("Misslyckades att hämta medlem");
                      const json = await resp.json();
                      setAchievements(
                        Array.isArray(json.achievements)
                          ? json.achievements
                          : []
                      );
                      return (json.user ?? null) as PublicUser | null;
                    });
                  } finally {
                    setSaving(false);
                  }
                }}
              />

              {/* lodge editor moved into AchievementsPanel; no-op here */}

              <RolesManager
                userId={member?.id}
                rolesList={rolesList}
                selectedRoleIds={selectedRoleIds}
                setSelectedRoleIds={setSelectedRoleIds}
                canEditRoles={canEdit}
                isEditRoute={isEditRoute}
                saveRoles={async (targetUserId: number, ids: number[]) => {
                  if (!targetUserId) throw new Error("Invalid target");
                  clearGlobalError();
                  setSaving(true);
                  try {
                    await setRoles(String(targetUserId), ids);
                    await run(async () => {
                      const resp = await fetch(
                        `${import.meta.env.VITE_BACKEND_URL}/api/users/${id}`,
                        { credentials: "include" }
                      );
                      if (!resp.ok)
                        throw new Error("Misslyckades att hämta medlem");
                      const json = await resp.json();
                      setAchievements(
                        Array.isArray(json.achievements)
                          ? json.achievements
                          : []
                      );
                      return (json.user ?? null) as PublicUser | null;
                    });
                  } finally {
                    setSaving(false);
                  }
                }}
                setGlobalError={setGlobalError}
                setSaving={setSaving}
              />

              <ProfileForm
                user={member}
                register={register}
                errors={errors}
                isEditRoute={isEditRoute}
                setPictureFile={setPictureFile}
                saving={saving}
              />
            </form>
          )
        )}
      </div>
    </div>
  );
};
