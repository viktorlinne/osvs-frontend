import type { FieldErrors, UseFormRegister } from "react-hook-form";
import {
  ImageFileInput,
  errorTextClass,
  inputClass,
  labelClass,
  selectClass,
  textareaClass,
} from "../ui";
import type { PublicUser, UpdateUserForm } from "../../types";
import { updateUserFormRules } from "../../utils/formValidation";

function FieldValue({ value }: { value: string | null | undefined }) {
  return <dd className="mt-0.5 text-sm text-neutral-900">{value || "—"}</dd>;
}

export const ProfileForm = ({
  user,
  register,
  errors,
  isEditRoute,
  pictureFile,
  setPictureFile,
  pictureError,
  showArchive = false,
}: {
  user?: PublicUser | null;
  register: UseFormRegister<UpdateUserForm>;
  errors: FieldErrors<UpdateUserForm>;
  isEditRoute: boolean;
  pictureFile: File | null;
  setPictureFile: (f: File | null) => void;
  pictureError?: string | null;
  showArchive?: boolean;
}) => {
  if (!isEditRoute) {
    return (
      <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        <div>
          <dt className={labelClass}>Matrikelnummer</dt>
          <FieldValue value={user?.matrikelnummer != null ? String(user.matrikelnummer) : null} />
        </div>
        <div>
          <dt className={labelClass}>E-post</dt>
          <FieldValue value={user?.email} />
        </div>
        <div>
          <dt className={labelClass}>Förnamn</dt>
          <FieldValue value={user?.firstname} />
        </div>
        <div>
          <dt className={labelClass}>Efternamn</dt>
          <FieldValue value={user?.lastname} />
        </div>
        <div>
          <dt className={labelClass}>Födelsedatum</dt>
          <FieldValue
            value={
              user?.dateOfBirth
                ? new Date(user.dateOfBirth).toLocaleDateString("sv-SE")
                : null
            }
          />
        </div>
        <div>
          <dt className={labelClass}>Registrerad</dt>
          <FieldValue
            value={
              user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString("sv-SE")
                : null
            }
          />
        </div>
        <div>
          <dt className={labelClass}>Mobilnummer</dt>
          <FieldValue value={user?.mobile} />
        </div>
        <div>
          <dt className={labelClass}>Hemnummer</dt>
          <FieldValue value={user?.homeNumber} />
        </div>
        <div className="sm:col-span-2">
          <dt className={labelClass}>Adress</dt>
          <dd className="mt-0.5 text-sm text-neutral-900">
            {[user?.address, user?.zipcode, user?.city].filter(Boolean).join(", ") || "—"}
          </dd>
        </div>
        <div>
          <dt className={labelClass}>Jobb</dt>
          <FieldValue value={user?.work} />
        </div>
        <div>
          <dt className={labelClass}>Noteringar</dt>
          <FieldValue value={user?.notes} />
        </div>
        <div>
          <dt className={labelClass}>Tillgängligt boende</dt>
          <dd className="mt-0.5 text-sm text-neutral-900">
            {user?.accommodationAvailable === true ? "Ja" : user?.accommodationAvailable === false ? "Nej" : "—"}
          </dd>
        </div>
      </dl>
    );
  }

  return (
    <>
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="matrikelnummer" className={labelClass}>
            Matrikelnummer
          </label>
          <input
            id="matrikelnummer"
            name="matrikelnummer"
            autoComplete="off"
            value={user?.matrikelnummer ?? ""}
            className={`${inputClass} bg-neutral-100`}
            readOnly
          />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            E-post
          </label>
          <input
            id="email"
            name="email"
            autoComplete="off"
            value={user?.email ?? ""}
            className={`${inputClass} bg-neutral-100`}
            readOnly
          />
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="profilePicture" className={labelClass}>
          Profilbild
        </label>
        <ImageFileInput
          id="profilePicture"
          value={pictureFile}
          onChange={setPictureFile}
          error={pictureError ?? undefined}
          hint="JPEG, PNG, GIF eller WebP, max 5 MB"
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="firstname" className={labelClass}>
            Förnamn
          </label>
          <input
            id="firstname"
            {...register("firstname", updateUserFormRules.firstname)}
            className={inputClass}
          />
          {errors.firstname ? (
            <p className={errorTextClass}>{errors.firstname.message}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="lastname" className={labelClass}>
            Efternamn
          </label>
          <input
            id="lastname"
            {...register("lastname", updateUserFormRules.lastname)}
            className={inputClass}
          />
          {errors.lastname ? (
            <p className={errorTextClass}>{errors.lastname.message}</p>
          ) : null}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="dateOfBirth" className={labelClass}>
            Födelsedatum
          </label>
          <input
            id="dateOfBirth"
            type="date"
            {...register("dateOfBirth", updateUserFormRules.dateOfBirth)}
            className={inputClass}
          />
          {errors.dateOfBirth ? (
            <p className={errorTextClass}>{errors.dateOfBirth.message}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="createdAt" className={labelClass}>
            Registrerad
          </label>
          <input
            id="createdAt"
            name="createdAt"
            value={
              user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString("sv-SE")
                : ""
            }
            readOnly
            className={`${inputClass} bg-neutral-100`}
          />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="mobile" className={labelClass}>
            Mobilnummer
          </label>
          <input
            id="mobile"
            type="text"
            inputMode="tel"
            {...register("mobile", updateUserFormRules.mobile)}
            className={inputClass}
          />
          {errors.mobile ? (
            <p className={errorTextClass}>{errors.mobile.message}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="homeNumber" className={labelClass}>
            Hemnummer
          </label>
          <input
            id="homeNumber"
            type="text"
            inputMode="tel"
            {...register("homeNumber", updateUserFormRules.homeNumber)}
            className={inputClass}
          />
          {errors.homeNumber ? (
            <p className={errorTextClass}>{errors.homeNumber.message}</p>
          ) : null}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="address" className={labelClass}>
            Adress
          </label>
          <input
            id="address"
            {...register("address", updateUserFormRules.address)}
            autoComplete="off"
            className={inputClass}
          />
          {errors.address ? (
            <p className={errorTextClass}>{errors.address.message}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="zipcode" className={labelClass}>
            Postnummer
          </label>
          <input
            id="zipcode"
            type="text"
            inputMode="numeric"
            {...register("zipcode", updateUserFormRules.zipcode)}
            className={inputClass}
          />
          {errors.zipcode ? (
            <p className={errorTextClass}>{errors.zipcode.message}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="city" className={labelClass}>
            Stad
          </label>
          <input
            id="city"
            {...register("city", updateUserFormRules.city)}
            className={inputClass}
          />
          {errors.city ? (
            <p className={errorTextClass}>{errors.city.message}</p>
          ) : null}
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="work" className={labelClass}>
          Jobb
        </label>
        <textarea
          id="work"
          rows={2}
          {...register("work")}
          className={textareaClass}
        />
        {errors.work ? (
          <p className={errorTextClass}>{errors.work.message}</p>
        ) : null}
      </div>

      <div className="mb-4">
        <label htmlFor="notes" className={labelClass}>
          Noteringar
        </label>
        <textarea
          id="notes"
          rows={3}
          {...register("notes")}
          className={textareaClass}
        />
        {errors.notes ? (
          <p className={errorTextClass}>{errors.notes.message}</p>
        ) : null}
      </div>

      <div className="mb-4 flex items-center gap-3">
        <input
          id="accommodationAvailable"
          type="checkbox"
          {...register("accommodationAvailable")}
          className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus-visible:ring-primary-600"
        />
        <label htmlFor="accommodationAvailable" className="text-sm text-neutral-700">
          Tillgängligt boende
        </label>
        {errors.accommodationAvailable ? (
          <p className={errorTextClass}>{errors.accommodationAvailable.message}</p>
        ) : null}
      </div>

      {showArchive ? (
        <div className="mb-4">
          <label htmlFor="archive" className={labelClass}>
            Arkiv
          </label>
          <select id="archive" {...register("archive")} className={selectClass}>
            <option value="">— Aktiv —</option>
            <option value="Avliden">Avliden</option>
            <option value="Urgången">Urgången</option>
          </select>
          <p className="mt-1.5 text-xs text-neutral-500">
            Arkivering döljer medlemmen från aktiva listor. Välj tomt för att återaktivera.
          </p>
        </div>
      ) : null}

    </>
  );
};
