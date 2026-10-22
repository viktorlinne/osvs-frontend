import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";
import { Button, NotFoundPanel, PageContainer } from "../components";
import { MemberDetailSkeleton } from "../components/MemberDetailSkeleton";
import {
  AchievementsPanel,
  AllergiesManager,
  MemberHistoryEditor,
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
import {
  adminUpdateUser,
  getPublicUserById,
  type PictureUploadResult,
  getUserLodge,
  getUserRoles,
  setRoles,
  setUserLodge,
  uploadUserPicture,
  type UserMutationResult,
} from "../services/users";
import type { UserLodgeResponse } from "../services/users";
import type { MemberAllergiesResponse } from "../services/allergies";
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
import {
  toAdminUserProfileUpdatePayload,
  toUserProfileUpdatePayload,
} from "../utils/userProfileForm";
import { applyApiFieldErrors } from "../utils/apiErrors";
import { idsFromField, sameIds, selectionChanged } from "../utils/idSets";
import { SaveHint } from "../components/profile/SaveHint";
import {
  adminUpdateUserFormRules,
  validateImageFile,
} from "../utils/formValidation";

type MemberDetailUser = PublicUser & {
  roles?: string[];
};

type MemberActionResult =
  | PublicUser
  | null
  | UserMutationResult
  | PictureUploadResult
  | MemberAllergiesResponse;

function readMemberRoleNames(member: MemberDetailUser | null): string[] {
  return Array.isArray(member?.roles) ? member.roles : [];
}

export const MemberDetail = () => {
  const { matrikelnummer } = useParams<{ matrikelnummer: string }>();
  const { run, data: member, loading: memberLoading, notFound: memberNotFound } = useFetch<MemberDetailUser | null>();
  const { run: runAvailable } = useFetch<Achievement[]>();
  const { run: runLodges } = useFetch<Lodge[]>();
  const { run: runRoles } = useFetch<Role[]>();
  const { run: runUserLodge } = useFetch<UserLodgeResponse>();
  const { run: runAction } = useFetch<MemberActionResult>();

  const { setError: setGlobalError, clearError: clearGlobalError } = useError();
  const { user: authUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const canEdit = Boolean(
    authUser &&
    (authUser.roles ?? []).some((r) => ["Admin", "Editor"].includes(r)),
  );
  // Role changes are Admin-only (GET /admin/roles and POST /users/:id/roles
  // return 403 for Editors), so only Admins load the role list or save roles.
  const isAdmin = Boolean(authUser && (authUser.roles ?? []).includes("Admin"));
  const isEditRoute = location.pathname.endsWith("/edit");
  // The backend only returns feeExempt/standingList to Admin/Editor. Only show
  // and send them when they were actually loaded, so a save can never clear
  // flags that were not shown.
  const showAdminFlags =
    canEdit &&
    typeof member?.feeExempt === "boolean" &&
    typeof member?.standingList === "boolean";
  const shouldLoadRoleData = isEditRoute && canEdit;

  const [saving, setSaving] = useState(false);
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [selectedLid, setSelectedLid] = useState<number | null>(null);
  const [initialLid, setInitialLid] = useState<number | null>(null);
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
  const [initialRoleIds, setInitialRoleIds] = useState<number[]>([]);
  // Bumped after each reset(); validation must run after the re-render that
  // re-registers the fields, otherwise errors stay empty while isValid is
  // false and "Spara" is disabled without any visible reason.
  const [resetVersion, setResetVersion] = useState(0);
  const [selectedAllergyIds, setSelectedAllergyIds] = useState<number[] | null>(
    null,
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    trigger,
    clearErrors,
    setError: setFieldError,
    formState: { errors, isValid, isDirty },
  } = useForm<UpdateUserForm>({
    mode: "onChange",
    defaultValues: {
      firstname: "",
      lastname: "",
      dateOfBirth: "",
      work: "",
      notes: "",
      mobile: "",
      homeNumber: "",
      city: "",
      address: "",
      zipcode: "",
      accommodationAvailable: null,
      archive: "",
      feeExempt: false,
      standingList: false,
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
        userObj = { ...userObj, roles };
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

    if (shouldLoadRoleData && isAdmin) {
      runRoles(() => listRoles())
        .then((roles) => setRolesList(roles))
        .catch(() => {
          // useFetch handles global error
        });
    }

    runUserLodge(() => getUserLodge(matrikelnummer))
      .then((current) => {
        const lid = current?.lodge ? Number(current.lodge.id) : null;
        setSelectedLid(lid);
        setInitialLid(lid);
      })
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
    isAdmin,
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
    setInitialRoleIds(ids);
  }, [member, rolesList]);

  useEffect(() => {
    if (!member) return;

    reset({
      firstname: member.firstname ?? "",
      lastname: member.lastname ?? "",
      dateOfBirth: member.dateOfBirth
        ? String(member.dateOfBirth).slice(0, 10)
        : "",
      work: member.work ?? "",
      notes: member.notes ?? "",
      mobile: member.mobile ?? "",
      homeNumber: member.homeNumber ?? "",
      city: member.city ?? "",
      address: member.address ?? "",
      zipcode: member.zipcode ?? "",
      accommodationAvailable: member.accommodationAvailable ?? null,
      archive: member.archive ?? "",
      feeExempt: member.feeExempt === true,
      standingList: member.standingList === true,
    });
    setPictureFile(null);
    setResetVersion((v) => v + 1);
  }, [member, reset]);

  useEffect(() => {
    if (resetVersion === 0) return;
    void trigger();
  }, [resetVersion, trigger]);

  useEffect(() => {
    if (!pictureFile) return;

    const url = URL.createObjectURL(pictureFile);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [pictureFile]);

  const pictureError = validateImageFile(pictureFile);

  // Only changed values are sent; "Spara" stays disabled until something
  // changed. Profile fields and the flags are form fields (isDirty).
  const lodgeChanged = selectedLid !== initialLid;
  const allergiesChanged = selectionChanged(
    selectedAllergyIds,
    idsFromField(memberAllergies),
  );
  const rolesChanged =
    isAdmin &&
    selectedRoleIds.length > 0 &&
    !sameIds(selectedRoleIds, initialRoleIds);
  const hasChanges =
    isDirty ||
    pictureFile !== null ||
    lodgeChanged ||
    allergiesChanged ||
    rolesChanged;

  const handleMemberSave = handleSubmit(async (values) => {
    // Failed inner steps are collected and shown after the final reload:
    // useFetch.run() clears the global banner, so reporting them immediately
    // let a later step wipe the message and a failed change looked saved.
    const failures: string[] = [];
    clearGlobalError();
    clearErrors();
    setSaving(true);

    try {
      if (!matrikelnummer) throw new Error("Missing matrikelnummer");
      const userId = matrikelnummer;

      if (isDirty) {
        await runAction(() =>
          adminUpdateUser(
            userId,
            showAdminFlags
              ? toAdminUserProfileUpdatePayload(values)
              : toUserProfileUpdatePayload(values),
          ),
        );
      }

      if (pictureFile) {
        await runAction(() => uploadUserPicture(userId, pictureFile));
      }

      if (rolesChanged) {
        try {
          await runAction(() => setRoles(userId, selectedRoleIds));
        } catch {
          failures.push("Kunde inte uppdatera rollerna.");
        }
      }

      try {
        if (allergiesChanged && selectedAllergyIds) {
          await runAction(() => setMemberAllergies(userId, selectedAllergyIds));
        }
      } catch {
        failures.push("Kunde inte uppdatera allergierna.");
      }

      if (lodgeChanged) {
        try {
          await runAction(() =>
            setUserLodge(
              userId,
              selectedLid === null ? null : Number(selectedLid),
            ),
          );
          setInitialLid(selectedLid);
        } catch {
          failures.push("Kunde inte uppdatera logen.");
        }
      }
      setSelectedAllergyIds(null);

      await run(loadMember).catch(() => undefined);
      if (failures.length > 0) setGlobalError(failures.join(" "));
      else toast.success("Ändringarna har sparats.");
      navigate(`/members/${matrikelnummer}`, { replace: true });
    } catch (error: unknown) {
      if (applyApiFieldErrors(error, setFieldError)) {
        return;
      }

      setGlobalError("Kunde inte spara medlemmen.");
    } finally {
      setSaving(false);
    }
  });

  const currentLodge = lodges.find((l) => l.id === selectedLid) ?? null;

  return (
    <PageContainer size="xl" className="ui-page">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
              className="ui-btn ui-btn-secondary"
            >
              Närvaro
            </Link>
          </div>
        )}
      </div>

      {memberLoading && !member ? (
        <MemberDetailSkeleton />
      ) : member ? (
        <div className="flex flex-col gap-4 animate-step-in">
        <form
          id="member-edit-form"
          onSubmit={handleMemberSave}
          className="flex flex-col gap-4"
        >
          {/* Profile header */}
          <div className="ui-card">
            <AchievementsPanel
              user={member}
              achievements={achievements}
              available={available}
              lodge={currentLodge}
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
                  setGlobalError("Kunde inte uppdatera logen.");
                } finally {
                  setSaving(false);
                }
              }}
              isEditRoute={isEditRoute}
              // Awards are added/edited in the "Utmärkelser" section below
              // so that every change is change-logged with a note.
              canAward={false}
            />
          </div>

          {/* Two-column body */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Personal info */}
            <div className="ui-card flex flex-col gap-5">
              <h2 className="ui-chapter">Personuppgifter</h2>
              <ProfileForm
                user={member}
                register={register}
                control={control}
                errors={errors}
                isEditRoute={isEditRoute}
                pictureFile={pictureFile}
                setPictureFile={setPictureFile}
                pictureError={pictureError}
                showArchive={isEditRoute}
                showAdminFlags={showAdminFlags}
                rules={adminUpdateUserFormRules}
              />
            </div>

            {/* Membership info */}
            <div className="ui-card flex flex-col gap-5">
              <h2 className="ui-chapter">Medlemskap</h2>
              <RolesManager
                userId={member?.matrikelnummer}
                rolesList={rolesList}
                selectedRoleIds={selectedRoleIds}
                setSelectedRoleIds={setSelectedRoleIds}
                canEditRoles={isAdmin}
                isEditRoute={isEditRoute}
                viewModeRoles={readMemberRoleNames(member)}
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
              {!isEditRoute ? (
                <OfficialsManager
                  user={member}
                  assignedOfficials={memberOfficials}
                  historyEntries={memberOfficialHistory}
                  isEditRoute={false}
                />
              ) : null}
              <AllergiesManager
                user={member}
                assignedAllergies={memberAllergies}
                isEditRoute={isEditRoute}
                selectedIds={selectedAllergyIds ?? undefined}
                setSelectedIds={setSelectedAllergyIds}
              />
            </div>
          </div>

        </form>

          {/* Tjänster, utmärkelser and Ändringslogg (OSVS-25/26). Kept outside
              the profile <form>: each entry is saved immediately via its own
              dialog, and portal events must not bubble into the profile form. */}
          {isEditRoute && canEdit && matrikelnummer ? (
            <MemberHistoryEditor
              matrikelnummer={matrikelnummer}
              achievementOptions={available}
              onChanged={() => {
                // Refresh only the header lists; reloading `member` would
                // reset unsaved edits in the profile form.
                getPublicUserById(matrikelnummer)
                  .then((detail) => {
                    setAchievements(
                      Array.isArray(detail.achievements) ? detail.achievements : [],
                    );
                    setLoadedMemberOfficials(
                      Array.isArray(detail.officials) ? detail.officials : [],
                    );
                    setMemberOfficialHistory(
                      Array.isArray(detail.officialHistory)
                        ? detail.officialHistory
                        : [],
                    );
                  })
                  .catch(() => {
                    // Header refresh is best-effort; the editor shows its own state.
                  });
              }}
            />
          ) : null}

          {isEditRoute ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="submit"
                form="member-edit-form"
                disabled={
                  saving || !hasChanges || !isValid || Boolean(pictureError)
                }
              >
                {saving ? "Sparar…" : "Spara"}
              </Button>
              <Link to=".." relative="path" className="ui-btn ui-btn-secondary">
                Avbryt
              </Link>
              <SaveHint
                saving={saving}
                isValid={isValid}
                hasChanges={hasChanges}
              />
            </div>
          ) : null}
        </div>
      ) : memberNotFound || !member ? (
        <NotFoundPanel
          title="Medlemmen hittades inte"
          description="Kontrollera länken eller gå tillbaka till medlemslistan."
          backTo="/members"
          backLabel="Till medlemslistan"
        />
      ) : null}
    </PageContainer>
  );
};
