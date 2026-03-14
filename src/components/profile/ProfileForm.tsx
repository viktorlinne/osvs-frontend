import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { errorTextClass, inputClass, labelClass } from "../ui";
import type { PublicUser, UpdateUserForm } from "../../types";
import { updateUserFormRules } from "../../utils/formValidation";

export const ProfileForm = ({
  user,
  register,
  errors,
  isEditRoute,
  setPictureFile,
  pictureError,
}: {
  user?: PublicUser | null;
  register: UseFormRegister<UpdateUserForm>;
  errors: FieldErrors<UpdateUserForm>;
  isEditRoute: boolean;
  setPictureFile: (f: File | null) => void;
  pictureError?: string | null;
  saving: boolean;
}) => {
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

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="firstname" className={labelClass}>
            Förnamn
          </label>
          <input
            id="firstname"
            {...register("firstname", updateUserFormRules.firstname)}
            readOnly={!isEditRoute}
            className={`${inputClass} ${isEditRoute ? "" : "bg-neutral-100"}`}
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
            readOnly={!isEditRoute}
            className={`${inputClass} ${isEditRoute ? "" : "bg-neutral-100"}`}
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
            readOnly={!isEditRoute}
            className={`${inputClass} ${isEditRoute ? "" : "bg-neutral-100"}`}
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
            value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""}
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
            readOnly={!isEditRoute}
            className={`${inputClass} ${isEditRoute ? "" : "bg-neutral-100"}`}
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
            readOnly={!isEditRoute}
            className={`${inputClass} ${isEditRoute ? "" : "bg-neutral-100"}`}
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
            readOnly={!isEditRoute}
            className={`${inputClass} ${isEditRoute ? "" : "bg-neutral-100"}`}
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
            readOnly={!isEditRoute}
            className={`${inputClass} ${isEditRoute ? "" : "bg-neutral-100"}`}
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
            readOnly={!isEditRoute}
            className={`${inputClass} ${isEditRoute ? "" : "bg-neutral-100"}`}
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
        <input
          id="work"
          type="text"
          {...register("work")}
          readOnly={!isEditRoute}
          className={`${inputClass} ${isEditRoute ? "" : "bg-neutral-100"}`}
        />
        {errors.work ? <p className={errorTextClass}>{errors.work.message}</p> : null}
      </div>

      <div className="mb-4">
        <label htmlFor="notes" className={labelClass}>
          Noteringar
        </label>
        <input
          id="notes"
          type="text"
          {...register("notes")}
          readOnly={!isEditRoute}
          className={`${inputClass} ${isEditRoute ? "" : "bg-neutral-100"}`}
        />
        {errors.notes ? <p className={errorTextClass}>{errors.notes.message}</p> : null}
      </div>

      <div className="mb-4">
        <label htmlFor="accommodationAvailable" className={labelClass}>
          Tillgängligt boende
        </label>
        <input
          id="accommodationAvailable"
          type="checkbox"
          {...register("accommodationAvailable")}
          disabled={!isEditRoute}
          className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus-visible:ring-primary-600"
        />
        {errors.accommodationAvailable ? (
          <p className={errorTextClass}>{errors.accommodationAvailable.message}</p>
        ) : null}
      </div>

      {isEditRoute ? (
        <div className="mb-4">
          <label htmlFor="profilePicture" className={labelClass}>
            Uppdatera Profilbild
          </label>
          <input
            id="profilePicture"
            name="profilePicture"
            type="file"
            accept="image/*"
            className={inputClass}
            onChange={(e) => setPictureFile(e.target.files ? e.target.files[0] : null)}
          />
          {pictureError ? <p className={errorTextClass}>{pictureError}</p> : null}
        </div>
      ) : null}
    </>
  );
};
