import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  AchievementsPanel,
  AllergiesManager,
  OfficialsManager,
  ProfileForm,
  ProfileHeader,
  RolesManager,
} from "../components";
import { useAuth, useError } from "../context";
import { useProfile } from "../hooks";
import useFetch from "../hooks/useFetch";
import { setMemberAllergies } from "../services/allergies";
import { setMemberOfficials } from "../services/officials";
import lodgesService from "../services/lodges";
import { setUserLodge, updateMe, uploadMyPicture } from "../services/users";
import type { Lodge, UpdateUserForm } from "../types";
import {
  extractMissingFields,
  toUserProfileUpdatePayload,
} from "../utils/userProfileForm";

export const Profile = () => {
  const { user, refresh } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isEditRoute = location.pathname.endsWith("/edit");

  const { setError: setGlobalError, clearError: clearGlobalError } = useError();
  const { run } = useFetch<unknown>();
  const { run: runLodges } = useFetch<Lodge[]>();

  const [saving, setSaving] = useState(false);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [lodges, setLodges] = useState<Lodge[]>([]);
  const [selectedLid, setSelectedLid] = useState<number | null>(null);
  const [selectedOfficialIds, setSelectedOfficialIds] = useState<number[] | null>(
    null,
  );
  const [selectedAllergyIds, setSelectedAllergyIds] = useState<number[] | null>(
    null,
  );

  const {
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
  } = useProfile();

  const {
    register,
    handleSubmit,
    reset,
    setError: setFieldError,
    formState: { errors },
  } = useForm<UpdateUserForm>({
    defaultValues: {
      firstname: user?.firstname ?? "",
      lastname: user?.lastname ?? "",
      dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "",
      work: user?.work ?? undefined,
      notes: user?.notes ?? undefined,
      mobile: user?.mobile ?? "",
      homeNumber: user?.homeNumber ?? "",
      city: user?.city ?? "",
      address: user?.address ?? "",
      zipcode: user?.zipcode ?? "",
      accommodationAvailable: user?.accommodationAvailable ?? null,
    },
  });

  useEffect(() => {
    reset({
      firstname: user?.firstname ?? "",
      lastname: user?.lastname ?? "",
      dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "",
      work: user?.work ?? undefined,
      notes: user?.notes ?? undefined,
      mobile: user?.mobile ?? "",
      homeNumber: user?.homeNumber ?? "",
      city: user?.city ?? "",
      address: user?.address ?? "",
      zipcode: user?.zipcode ?? "",
      accommodationAvailable: user?.accommodationAvailable ?? null,
    });
  }, [reset, user]);

  useEffect(() => {
    let mounted = true;

    runLodges(() => lodgesService.listLodges())
      .then((list) => {
        if (mounted) {
          setLodges(Array.isArray(list) ? list : []);
        }
      })
      .catch(() => {
        // useFetch handles global error state
      });

    return () => {
      mounted = false;
    };
  }, [runLodges]);

  useEffect(() => {
    setSelectedLid(lodge?.id ? Number(lodge.id) : null);
  }, [lodge]);

  const handleProfileSave = handleSubmit(async (values) => {
    clearGlobalError();
    setSaving(true);

    try {
      await run(() => updateMe(toUserProfileUpdatePayload(values)));

      if (pictureFile) {
        await run(() => uploadMyPicture(pictureFile));
      }

      const userId = user?.matrikelnummer;
      if (userId) {
        try {
          if (Array.isArray(selectedRoleIds) && selectedRoleIds.length > 0) {
            await run(() => saveRoles(userId, selectedRoleIds));
          }
        } catch {
          setGlobalError("Misslyckades att uppdatera roller");
        }

        try {
          if (Array.isArray(selectedOfficialIds)) {
            await run(() => setMemberOfficials(userId, selectedOfficialIds));
          }
        } catch {
          setGlobalError("Misslyckades att uppdatera tjänster");
        }

        try {
          if (Array.isArray(selectedAllergyIds)) {
            await run(() => setMemberAllergies(userId, selectedAllergyIds));
          }
        } catch {
          setGlobalError("Misslyckades att uppdatera allergier");
        }

        try {
          if (selectedAid) {
            await run(() =>
              assignAchievement(userId, selectedAid, awardDate || undefined),
            );
            setSelectedAid(null);
            setAwardDate("");
          }
        } catch {
          setGlobalError("Misslyckades att tilldela utmärkelse");
        }

        try {
          await run(() =>
            setUserLodge(
              String(userId),
              selectedLid === null ? null : Number(selectedLid),
            ),
          );
        } catch {
          setGlobalError("Misslyckades att uppdatera loge");
        }
      }

      await refresh();
      navigate("/profile", { replace: true });
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

      setGlobalError("Misslyckades att uppdatera profilen");
    } finally {
      setSaving(false);
    }
  });

  return (
    <div className="flex flex-col items-center min-h-screen">
      <div className="max-w-3xl w-full mx-auto p-6">
        <ProfileHeader user={user} isEditRoute={isEditRoute} />
        <h2 className="text-2xl font-bold mt-4 mb-4">Din profil</h2>

        <form onSubmit={handleProfileSave} className="bg-white p-4 rounded-md shadow">
          <AchievementsPanel
            user={user}
            achievements={achievements}
            available={available}
            lodge={lodge}
            lodges={lodges}
            selectedLid={selectedLid}
            setSelectedLid={setSelectedLid}
            onSaveLodge={async (targetUserId: number, lodgeId: number | null) => {
              if (!targetUserId) throw new Error("Invalid target");

              setSaving(true);
              try {
                await setUserLodge(
                  String(targetUserId),
                  lodgeId === null ? null : Number(lodgeId),
                );
                await refresh();
              } catch {
                // state refresh is handled in useProfile fallback
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
            assignAchievement={assignAchievement}
          />

          <RolesManager
            userId={user?.matrikelnummer}
            rolesList={rolesList}
            selectedRoleIds={selectedRoleIds}
            setSelectedRoleIds={setSelectedRoleIds}
            canEditRoles={canEditRoles}
            isEditRoute={isEditRoute}
            saveRoles={saveRoles}
            setGlobalError={setGlobalError}
            setSaving={setSaving}
          />

          <OfficialsManager
            user={user}
            isEditRoute={isEditRoute}
            selectedIds={selectedOfficialIds ?? undefined}
            setSelectedIds={setSelectedOfficialIds}
          />

          <AllergiesManager
            user={user}
            isEditRoute={isEditRoute}
            selectedIds={selectedAllergyIds ?? undefined}
            setSelectedIds={setSelectedAllergyIds}
          />

          <ProfileForm
            user={user}
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
      </div>
    </div>
  );
};

