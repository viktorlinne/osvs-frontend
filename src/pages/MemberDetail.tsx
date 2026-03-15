import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button, PageContainer } from "../components";
import {
  AchievementsPanel,
  AllergiesManager,
  OfficialsManager,
  ProfileForm,
  RolesManager,
} from "../components/profile/";
import { useAuth, useError } from "../context";
import useFetch from "../hooks/useFetch";
import { listRoles } from "../services/admin";
import achievementsService from "../services/achievements";
import { setMemberAllergies } from "../services/allergies";
import lodgesService from "../services/lodges";
import { setMemberOfficials } from "../services/officials";
import {
  adminUpdateUser,
  type AchievementMutationResult,
  getPublicUserById,
  type PictureUploadResult,
  getUserLodge,
  getUserRoles,
  postAchievement,
  setRoles,
  setUserLodge,
  uploadUserPicture,
  type UserMutationResult,
} from "../services/users";
import type { UserLodgeResponse } from "../services/users";
import type { MemberAllergiesResponse } from "../services/allergies";
import type { MemberOfficialsResponse } from "../services/officials";
import type {
  Achievement,
  Allergy,
  Lodge,
  Official,
  OfficialHistoryItem,
  PublicUser,
  Role,
  UpdateUserForm,
} from "../types";
import { toUserProfileUpdatePayload } from "../utils/userProfileForm";
import { applyApiFieldErrors } from "../utils/apiErrors";
import { validateImageFile } from "../utils/formValidation";

type MemberDetailUser = PublicUser & {
  roles?: string[];
};

type MemberActionResult =
  | PublicUser
  | null
  | UserMutationResult
  | PictureUploadResult
  | AchievementMutationResult
  | MemberAllergiesResponse
  | MemberOfficialsResponse;

function readMemberRoleNames(member: MemberDetailUser | null): string[] {
  return Array.isArray(member?.roles) ? member.roles : [];
}

export const MemberDetail = () => {
  const { matrikelnummer } = useParams<{ matrikelnummer: string }>();
  const { run, data: member } = useFetch<MemberDetailUser | null>();
  const { run: runAvailable } = useFetch<Achievement[]>();
  const { run: runLodges } = useFetch<Lodge[]>();
  const { run: runRoles } = useFetch<Role[]>();
  const { run: runUserLodge } = useFetch<UserLodgeResponse>();
  const { run: runAction } = useFetch<MemberActionResult>();

  const { setError: setGlobalError, clearError: clearGlobalError } = useError();
  const { user: authUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const canAward = Boolean(
    authUser &&
    (authUser.roles ?? []).some((r) => ["Admin", "Editor"].includes(r)),
  );
  const canEdit = Boolean(
    authUser &&
    (authUser.roles ?? []).some((r) => ["Admin", "Editor"].includes(r)),
  );
  const isEditRoute = location.pathname.endsWith("/edit");
  const shouldLoadRoleData = isEditRoute && canEdit;

  const [saving, setSaving] = useState(false);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [selectedAid, setSelectedAid] = useState<number | null>(null);
  const [awardDate, setAwardDate] = useState("");
  const [selectedLid, setSelectedLid] = useState<number | null>(null);
  const [available, setAvailable] = useState<Achievement[]>([]);
  const [lodges, setLodges] = useState<Lodge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [memberAllergies, setLoadedMemberAllergies] = useState<Allergy[]>([]);
  const [memberOfficials, setLoadedMemberOfficials] = useState<Official[]>([]);
  const [memberOfficialHistory, setMemberOfficialHistory] = useState<
    OfficialHistoryItem[]
  >([]);
  const [rolesList, setRolesList] = useState<Role[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [selectedOfficialIds, setSelectedOfficialIds] = useState<
    number[] | null
  >(null);
  const [selectedAllergyIds, setSelectedAllergyIds] = useState<number[] | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    reset,
    trigger,
    clearErrors,
    setError: setFieldError,
    formState: { errors, isValid },
  } = useForm<UpdateUserForm>({
    mode: "onChange",
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
    setAchievements(
      Array.isArray(detail.achievements) ? detail.achievements : [],
    );
    setLoadedMemberAllergies(
      Array.isArray(detail.allergies) ? detail.allergies : [],
    );
    setLoadedMemberOfficials(
      Array.isArray(detail.officials) ? detail.officials : [],
    );
    setMemberOfficialHistory(
      Array.isArray(detail.officialHistory) ? detail.officialHistory : [],
    );

    let userObj: MemberDetailUser | null = detail.user ? { ...detail.user } : null;
    if (shouldLoadRoleData && userObj && !Array.isArray(userObj.roles)) {
      try {
        const roles = await getUserRoles(matrikelnummer);
        userObj = {
          ...userObj,
          roles,
        };
      } catch {
        // Fallback to payload user without explicit roles.
      }
    }

    return userObj;
  }, [matrikelnummer, shouldLoadRoleData]);

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

    if (shouldLoadRoleData) {
      runRoles(() => listRoles())
        .then((roles) => setRolesList(roles))
        .catch(() => {
          // useFetch handles global error
        });
    }

    runUserLodge(() => getUserLodge(matrikelnummer))
      .then((current) =>
        setSelectedLid(current?.lodge ? Number(current.lodge.id) : null),
      )
      .catch(() => {
        // useFetch handles global error
      });
  }, [
    matrikelnummer,
    loadMember,
    run,
    runAvailable,
    runLodges,
    runRoles,
    runUserLodge,
    setGlobalError,
    shouldLoadRoleData,
  ]);

  useEffect(() => {
    if (!member || rolesList.length === 0) return;

    const memberRoles = readMemberRoleNames(member);
    const ids = memberRoles
      .map(
        (roleName) =>
          rolesList.find((role) => (role.name ?? role.role ?? "") === roleName)
            ?.id,
      )
      .filter((value): value is number => typeof value === "number");

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
    void trigger();
  }, [member, reset, trigger]);

  useEffect(() => {
    if (!pictureFile) return;

    const url = URL.createObjectURL(pictureFile);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [pictureFile]);

  const pictureError = validateImageFile(pictureFile);

  const handleMemberSave = handleSubmit(async (values) => {
    clearGlobalError();
    clearErrors();
    setSaving(true);

    try {
      if (!matrikelnummer) throw new Error("Missing matrikelnummer");
      const userId = matrikelnummer;

      await runAction(() =>
        adminUpdateUser(userId, toUserProfileUpdatePayload(values)),
      );

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
          await runAction(() =>
            setMemberOfficials(userId, selectedOfficialIds),
          );
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
          setUserLodge(
            userId,
            selectedLid === null ? null : Number(selectedLid),
          ),
        );
      } catch {
        setGlobalError("Misslyckades att uppdatera loge");
      }

      await run(loadMember);
      navigate(`/members/${matrikelnummer}`, { replace: true });
    } catch (error: unknown) {
      if (applyApiFieldErrors(error, setFieldError)) {
        return;
      }

      setGlobalError("Misslyckades att uppdatera medlem");
    } finally {
      setSaving(false);
    }
  });

  return (
    <PageContainer size="xl" className="ui-page">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
        <Link to=".." relative="path" className="ui-link">
          ← Tillbaka
        </Link>
        {!isEditRoute && (
          <div className="flex flex-col gap-2 sm:flex-row">
            {canEdit && (
              <Link
                to={`/members/${matrikelnummer}/edit`}
                className="ui-btn ui-btn-primary"
              >
                Redigera
              </Link>
            )}
            <Link
              to={`/members/${matrikelnummer}/attended`}
              className="ui-btn ui-btn-primary"
            >
              Närvaro
            </Link>
          </div>
        )}
      </div>

      {member && (
        <form onSubmit={handleMemberSave} className="ui-card">
          <AchievementsPanel
            user={member}
            achievements={achievements}
            available={available}
            lodge={lodges.find((lodge) => lodge.id === selectedLid) ?? null}
            lodges={lodges}
            selectedLid={selectedLid}
            setSelectedLid={setSelectedLid}
            onSaveLodge={async (
              targetUserId: number,
              lodgeId: number | null,
            ) => {
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
            assignedOfficials={memberOfficials}
            historyEntries={memberOfficialHistory}
            isEditRoute={isEditRoute}
            selectedIds={selectedOfficialIds ?? undefined}
            setSelectedIds={setSelectedOfficialIds}
          />

          <AllergiesManager
            user={member}
            assignedAllergies={memberAllergies}
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
            pictureError={pictureError}
            saving={saving}
          />

          {isEditRoute ? (
            <div className="flex flex-col gap-2 py-4 sm:flex-row">
              <Button
                type="submit"
                disabled={saving || !isValid || Boolean(pictureError)}
              >
                {saving ? "Sparar..." : "Spara"}
              </Button>
              <Link to=".." relative="path" className="ui-btn ui-btn-secondary">
                Avbryt
              </Link>
            </div>
          ) : null}
        </form>
      )}
    </PageContainer>
  );
};
