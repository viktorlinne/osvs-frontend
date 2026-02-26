import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import { useAuth, useError } from "../context";
import type { Achievement, Lodge, PublicUser, Role, UpdateUserForm } from "../types";
import {
  adminUpdateUser,
  getPublicUserById,
  getUserLodge,
  getUserRoles,
  postAchievement,
  setRoles,
  setUserLodge,
  uploadUserPicture,
} from "../services/users";
import type { UserLodgeResponse } from "../services/users";
import achievementsService from "../services/achievements";
import { setMemberAllergies } from "../services/allergies";
import lodgesService from "../services/lodges";
import { setMemberOfficials } from "../services/officials";
import { listRoles } from "../services/admin";
import { useForm } from "react-hook-form";
import {
  AchievementsPanel,
  AllergiesManager,
  OfficialsManager,
  ProfileForm,
  RolesManager,
} from "../components/profile/";
import {
  extractMissingFields,
  toUserProfileUpdatePayload,
} from "../utils/userProfileForm";

function mapRolesResponseToList(value: unknown): Role[] {
  const raw = value as { roles?: unknown } | null | undefined;
  const items = Array.isArray(value)
    ? value
    : Array.isArray(raw?.roles)
      ? raw.roles
      : [];

  return items
    .map((item) => {
      const record = item as Record<string, unknown>;
      const id = Number(record.id);
      const name = String(record.name ?? record.role ?? record.roleName ?? "");
      return Number.isFinite(id) && name ? { id, name } : null;
    })
    .filter((role): role is { id: number; name: string } => Boolean(role));
}

function mapMemberRoleNames(member: PublicUser | null): string[] {
  if (!member) return [];
  const roles = (member as { roles?: unknown }).roles;
  if (!Array.isArray(roles)) return [];

  return roles
    .map((roleItem) => {
      if (typeof roleItem === "string") return roleItem;
      if (!roleItem || typeof roleItem !== "object") return "";
      const role = roleItem as Record<string, unknown>;
      return String(role.name ?? role.role ?? role.id ?? "");
    })
    .filter((name): name is string => Boolean(name));
}

export const MemberDetail = () => {
  const { matrikelnummer } = useParams<{ matrikelnummer: string }>();
  const {
    run,
    data: member,
  } = useFetch<PublicUser | null>();
  const { run: runAvailable } = useFetch<Achievement[]>();
  const { run: runLodges } = useFetch<Lodge[]>();
  const { run: runRoles } = useFetch<unknown>();
  const { run: runUserLodge } = useFetch<UserLodgeResponse>();
  const { run: runAction } = useFetch<unknown>();

  const { setError: setGlobalError, clearError: clearGlobalError } = useError();
  const { user: authUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const canAward = Boolean(
    authUser && (authUser.roles ?? []).some((r) => ["Admin", "Editor"].includes(r))
  );
  const canEdit = Boolean(
    authUser && (authUser.roles ?? []).some((r) => ["Admin", "Editor"].includes(r))
  );
  const isEditRoute = location.pathname.endsWith("/edit");

  const [saving, setSaving] = useState(false);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [selectedAid, setSelectedAid] = useState<number | null>(null);
  const [awardDate, setAwardDate] = useState("");
  const [selectedLid, setSelectedLid] = useState<number | null>(null);
  const [available, setAvailable] = useState<Achievement[]>([]);
  const [lodges, setLodges] = useState<Lodge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [rolesList, setRolesList] = useState<Role[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [selectedOfficialIds, setSelectedOfficialIds] = useState<number[] | null>(
    null,
  );
  const [selectedAllergyIds, setSelectedAllergyIds] = useState<number[] | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    reset,
    setError: setFieldError,
    formState: { errors },
  } = useForm<UpdateUserForm>({
    defaultValues: {
      firstname: "",
      lastname: "",
      dateOfBirth: "",
      work: undefined,
      notes: undefined,
      mobile: "",
      homeNumber: "",
      city: "",
      address: "",
      zipcode: "",
      accommodationAvailable: null,
    },
  });

  const loadMember = useCallback(async () => {
    if (!matrikelnummer) throw new Error("Missing matrikelnummer");

    const detail = await getPublicUserById(matrikelnummer);
    setAchievements(Array.isArray(detail.achievements) ? detail.achievements : []);

    let userObj: PublicUser | null = detail.user
      ? (detail.user as PublicUser)
      : null;
    if (userObj && !Array.isArray((userObj as { roles?: unknown }).roles)) {
      try {
        const roles = await getUserRoles(matrikelnummer);
        userObj = {
          ...(userObj as Record<string, unknown>),
          roles,
        } as unknown as PublicUser;
      } catch {
        // Fallback to payload user without explicit roles.
      }
    }

    return userObj;
  }, [matrikelnummer]);

  useEffect(() => {
    if (!matrikelnummer) {
      setGlobalError("Saknar matrikelnummer");
      return;
    }

    run(loadMember).catch(() => {
      // useFetch handles global error
    });

    runAvailable(() => achievementsService.listAchievements())
      .then((list) => setAvailable(Array.isArray(list) ? list : []))
      .catch(() => {
        // useFetch handles global error
      });

    runLodges(() => lodgesService.listLodges())
      .then((list) => setLodges(Array.isArray(list) ? list : []))
      .catch(() => {
        // useFetch handles global error
      });

    if (canEdit) {
      runRoles(() => listRoles())
        .then((response) => setRolesList(mapRolesResponseToList(response)))
        .catch(() => {
          // useFetch handles global error
        });
    }

    runUserLodge(() => getUserLodge(matrikelnummer))
      .then((current) => setSelectedLid(current?.lodge ? Number(current.lodge.id) : null))
      .catch(() => {
        // useFetch handles global error
      });
  }, [
    canEdit,
    matrikelnummer,
    loadMember,
    run,
    runAvailable,
    runLodges,
    runRoles,
    runUserLodge,
    setGlobalError,
  ]);

  useEffect(() => {
    if (!member || rolesList.length === 0) return;

    const memberRoles = mapMemberRoleNames(member);
    const ids = memberRoles
      .map((roleName) => rolesList.find((role) => role.name === roleName)?.id)
      .filter((value): value is number => typeof value === "number");

    setSelectedRoleIds(ids);
  }, [member, rolesList]);

  useEffect(() => {
    if (!member) return;

    reset({
      firstname: member.firstname ?? "",
      lastname: member.lastname ?? "",
      dateOfBirth: member.dateOfBirth ? String(member.dateOfBirth).slice(0, 10) : "",
      work: member.work ?? undefined,
      notes: member.notes ?? undefined,
      mobile: member.mobile ?? "",
      homeNumber: member.homeNumber ?? "",
      city: member.city ?? "",
      address: member.address ?? "",
      zipcode: member.zipcode ?? "",
      accommodationAvailable: member.accommodationAvailable ?? null,
    });
    setPictureFile(null);
  }, [member, reset]);

  useEffect(() => {
    if (!pictureFile) return;

    const url = URL.createObjectURL(pictureFile);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [pictureFile]);

  const handleMemberSave = handleSubmit(async (values) => {
    clearGlobalError();
    setSaving(true);

    try {
      if (!matrikelnummer) throw new Error("Missing matrikelnummer");
      const userId = matrikelnummer;

      await runAction(() => adminUpdateUser(userId, toUserProfileUpdatePayload(values)));

      if (pictureFile) {
        await runAction(() => uploadUserPicture(userId, pictureFile));
      }

      try {
        await runAction(() => setRoles(userId, selectedRoleIds));
      } catch {
        setGlobalError("Misslyckades att uppdatera roller");
      }

      try {
        if (Array.isArray(selectedOfficialIds)) {
          await runAction(() => setMemberOfficials(userId, selectedOfficialIds));
        }
      } catch {
        setGlobalError("Misslyckades att uppdatera tjänster");
      }

      try {
        if (Array.isArray(selectedAllergyIds)) {
          await runAction(() => setMemberAllergies(userId, selectedAllergyIds));
        }
      } catch {
        setGlobalError("Misslyckades att uppdatera allergier");
      }

      try {
        if (selectedAid) {
          await runAction(() =>
            postAchievement(userId, {
              achievementId: selectedAid,
              awardedAt: awardDate || undefined,
            }),
          );
          setSelectedAid(null);
          setAwardDate("");
        }
      } catch {
        setGlobalError("Misslyckades att tilldela utmärkelse");
      }

      try {
        await runAction(() =>
          setUserLodge(userId, selectedLid === null ? null : Number(selectedLid)),
        );
      } catch {
        setGlobalError("Misslyckades att uppdatera loge");
      }

      await run(loadMember);
      navigate(`/members/${matrikelnummer}`, { replace: true });
    } catch (error: unknown) {
      const missing = extractMissingFields(error);
      if (missing) {
        missing.forEach((field) => {
          setFieldError(field as keyof UpdateUserForm, {
            type: "server",
            message: "Ogiltigt värde",
          });
        });
        return;
      }

      setGlobalError("Misslyckades att uppdatera medlem");
    } finally {
      setSaving(false);
    }
  });

  return (
    <div className="flex flex-col items-center min-h-screen">
      <div className="max-w-3xl w-full mx-auto p-6">
        <div className="flex items-center justify-between">
          <Link
            to=".."
            relative="path"
            className="text-sm text-green-600 hover:text-green-700 hover:underline"
          >
            ← Tillbaka
          </Link>
          {canEdit && !isEditRoute && (
            <Link
              to={`/members/${matrikelnummer}/edit`}
              className="text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition px-3 py-2 rounded-md"
            >
              Redigera
            </Link>
          )}
        </div>

        <h2 className="text-2xl font-bold mt-4 mb-4">Medlem</h2>

        {member && (
          <form onSubmit={handleMemberSave} className="bg-white p-4 rounded-md shadow">
            <AchievementsPanel
              user={member}
              achievements={achievements}
              available={available}
              lodge={lodges.find((lodge) => lodge.id === selectedLid) ?? null}
              lodges={lodges}
              selectedLid={selectedLid}
              setSelectedLid={setSelectedLid}
              onSaveLodge={async (targetUserId: number, lodgeId: number | null) => {
                if (!targetUserId) throw new Error("Invalid target");
                clearGlobalError();
                setSaving(true);
                try {
                  await runAction(() =>
                    setUserLodge(
                      String(targetUserId),
                      lodgeId === null ? null : Number(lodgeId),
                    ),
                  );
                  await run(loadMember);
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
                awardedAt?: string,
              ) => {
                if (!targetUserId) throw new Error("Invalid target");
                clearGlobalError();
                setSaving(true);
                try {
                  await runAction(() =>
                    postAchievement(String(targetUserId), {
                      achievementId,
                      awardedAt,
                    }),
                  );
                  await run(loadMember);
                } finally {
                  setSaving(false);
                }
              }}
            />

            <RolesManager
              userId={member?.matrikelnummer}
              rolesList={rolesList}
              selectedRoleIds={selectedRoleIds}
              setSelectedRoleIds={setSelectedRoleIds}
              canEditRoles={canEdit}
              isEditRoute={isEditRoute}
              saveRoles={async (targetUserId: number, roleIds: number[]) => {
                if (!targetUserId) throw new Error("Invalid target");
                clearGlobalError();
                setSaving(true);
                try {
                  await runAction(() => setRoles(String(targetUserId), roleIds));
                  await run(loadMember);
                } finally {
                  setSaving(false);
                }
              }}
              setGlobalError={setGlobalError}
              setSaving={setSaving}
            />

            <OfficialsManager
              user={member}
              isEditRoute={isEditRoute}
              selectedIds={selectedOfficialIds ?? undefined}
              setSelectedIds={setSelectedOfficialIds}
            />

            <AllergiesManager
              user={member}
              isEditRoute={isEditRoute}
              selectedIds={selectedAllergyIds ?? undefined}
              setSelectedIds={setSelectedAllergyIds}
            />

            <ProfileForm
              user={member}
              register={register}
              errors={errors}
              isEditRoute={isEditRoute}
              setPictureFile={setPictureFile}
              saving={saving}
            />

            {isEditRoute ? (
              <div className="flex items-center gap-x-4 py-4">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-sm font-medium transition text-white px-4 py-2 rounded-md"
                  disabled={saving}
                >
                  {saving ? "Sparar..." : "Spara"}
                </button>
              </div>
            ) : null}
          </form>
        )}
      </div>
    </div>
  );
};
