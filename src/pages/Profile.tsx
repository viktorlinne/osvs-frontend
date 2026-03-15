import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  AchievementsPanel,
  AllergiesManager,
  Button,
  PageContainer,
  OfficialsManager,
  ProfileForm,
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
import { applyApiFieldErrors } from "../utils/apiErrors";
import { validateImageFile } from "../utils/formValidation";
import { toUserProfileUpdatePayload } from "../utils/userProfileForm";

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
  const [selectedOfficialIds, setSelectedOfficialIds] = useState<
    number[] | null
  >(null);
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
  } = useProfile({ isEditRoute });

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
    void trigger();
  }, [reset, trigger, user]);

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

  const pictureError = validateImageFile(pictureFile);

  const handleProfileSave = handleSubmit(async (values) => {
    clearGlobalError();
    clearErrors();
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
          setGlobalError("Misslyckades att uppdatera tjÃ¤nster");
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
          setGlobalError("Misslyckades att tilldela utmÃ¤rkelse");
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
      if (applyApiFieldErrors(error, setFieldError)) {
        return;
      }

      setGlobalError("Misslyckades att uppdatera profilen");
    } finally {
      setSaving(false);
    }
  });

  return (
    <PageContainer size="xl" className="ui-page">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Link to=".." relative="path" className="ui-link">
          â† Tillbaka
        </Link>
        <div className="flex flex-col gap-2 sm:flex-row">
          {user && !isEditRoute ? (
            <Link to="/profile/edit" className="ui-btn ui-btn-primary">
              Redigera
            </Link>
          ) : null}
          {user ? (
            <Link to="/profile/attended" className="ui-btn ui-btn-primary">
              Närvaro
            </Link>
          ) : null}
          <Link to="/profile/memberships" className="ui-btn ui-btn-primary">
            Medlemskap
          </Link>
        </div>
      </div>
      <h2 className="ui-page-title mb-4 mt-4">Din profil</h2>

      <form onSubmit={handleProfileSave} className="ui-card">
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
            <Link
              to=".."
              relative="path"
              className={`ui-btn ui-btn-secondary ${saving ? "pointer-events-none opacity-60" : ""}`}
              aria-disabled={saving}
              onClick={saving ? (event) => event.preventDefault() : undefined}
            >
              Avbryt
            </Link>
          </div>
        ) : null}
      </form>
    </PageContainer>
  );
};
