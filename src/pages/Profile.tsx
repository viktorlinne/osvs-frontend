import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import lodgesService from "../services/lodges";
import { setUserLodge } from "../services/users";
import type { Lodge } from "../types";
import { useAuth, useError } from "../context";
import { updateMe, uploadMyPicture } from "../services";
import { useForm } from "react-hook-form";
import type { UpdateUserForm } from "../types";
import { useProfile } from "../hooks";
import {
  ProfileHeader,
  AchievementsPanel,
  RolesManager,
  ProfileForm,
} from "../components/profile/";

export const Profile = () => {
  const { user, refresh } = useAuth();
  const location = useLocation();
  const isEditRoute = location.pathname.endsWith("/edit");
  const { setError: setGlobalError, clearError: clearGlobalError } = useError();

  const [saving, setSaving] = useState(false);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [lodges, setLodges] = useState<Lodge[]>([]);
  const [selectedLid, setSelectedLid] = useState<number | null>(null);
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
    // runtime validation removed; relying on TypeScript types and controller-side checks
    defaultValues: {
      firstname: user?.firstname ?? "",
      lastname: user?.lastname ?? "",
      dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "",
      official: user?.official ?? undefined,
      notes: user?.notes ?? undefined,
      mobile: user?.mobile ?? "",
      homeNumber: user?.homeNumber ?? "",
      city: user?.city ?? "",
      address: user?.address ?? "",
      zipcode: user?.zipcode ?? "",
    },
  });

  // data-fetching and role/achievement state handled by `useProfile`

  useEffect(() => {
    // keep form in sync when `user` changes
    reset({
      firstname: user?.firstname ?? "",
      lastname: user?.lastname ?? "",
      dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "",
      official: user?.official ?? undefined,
      notes: user?.notes ?? undefined,
      mobile: user?.mobile ?? "",
      homeNumber: user?.homeNumber ?? "",
      city: user?.city ?? "",
      address: user?.address ?? "",
      zipcode: user?.zipcode ?? "",
    });
  }, [user, reset]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await lodgesService.listLodges();
        if (mounted) setLodges(Array.isArray(list) ? list : []);
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setSelectedLid(lodge?.id ? Number(lodge.id) : null);
  }, [lodge]);

  async function onSave(values: Record<string, unknown>) {
    clearGlobalError();
    setSaving(true);
    try {
      await updateMe({
        firstname: String(values.firstname ?? "").trim(),
        lastname: String(values.lastname ?? "").trim(),
        mobile: String(values.mobile ?? "").trim(),
        city: String(values.city ?? "").trim(),
        dateOfBirth: values.dateOfBirth ? String(values.dateOfBirth) : null,
        address: values.address ? String(values.address) : null,
        zipcode: values.zipcode ? String(values.zipcode) : null,
        official: values.official ?? null,
        notes: values.notes ?? null,
      });
      if (pictureFile) {
        await uploadMyPicture(pictureFile);
      }
      await refresh();
    } catch (e: unknown) {
      const err = e as { status?: number; details?: unknown };
      if (
        err?.status === 400 &&
        err.details &&
        typeof err.details === "object"
      ) {
        const rec = err.details as Record<string, unknown>;
        const missing = Array.isArray(rec.missing) ? rec.missing : undefined;
        if (missing) {
          missing.forEach((p: unknown) => {
            if (typeof p === "string")
              setFieldError(p as keyof UpdateUserForm, {
                type: "server",
                message: "Ogiltigt värde",
              });
          });
          setSaving(false);
          return;
        }
      }
      setGlobalError("Misslyckades att uppdatera profilen");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen">
      <div className="max-w-3xl w-full mx-auto p-6">
        <ProfileHeader user={user} isEditRoute={isEditRoute} />
        <h2 className="text-2xl font-bold mt-4 mb-4">Din profil</h2>
        <form
          onSubmit={handleSubmit(onSave)}
          className="bg-white p-4 rounded-md shadow"
        >
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
                await setUserLodge(String(targetUserId), lodgeId === null ? null : Number(lodgeId));
                await refresh();
              } catch {
                // signal handled by useProfile refresh fallback
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
            userId={user?.id}
            rolesList={rolesList}
            selectedRoleIds={selectedRoleIds}
            setSelectedRoleIds={setSelectedRoleIds}
            canEditRoles={canEditRoles}
            isEditRoute={isEditRoute}
            saveRoles={saveRoles}
            setGlobalError={setGlobalError}
            setSaving={setSaving}
          />
          <ProfileForm
            user={user}
            register={register}
            errors={errors}
            isEditRoute={isEditRoute}
            setPictureFile={setPictureFile}
            saving={saving}
          />
        </form>
      </div>
    </div>
  );
};
