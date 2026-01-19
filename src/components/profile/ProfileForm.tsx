import type { PublicUser, UpdateUserForm } from "../../types";
import type { UseFormRegister, FieldErrors } from "react-hook-form";

export const ProfileForm = ({
  user,
  register,
  errors,
  isEditRoute,
  setPictureFile,
}: {
  user?: PublicUser | null;
  register: UseFormRegister<UpdateUserForm>;
  errors: FieldErrors<UpdateUserForm>;
  isEditRoute: boolean;
  setPictureFile: (f: File | null) => void;
  saving: boolean;
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium mb-1">Användarnamn</label>
          <input
            id="username"
            name="username"
            autoComplete="off"
            value={user?.username ?? ""}
            className="w-full border rounded-md px-3 py-2 bg-gray-100"
            readOnly
          />
        </div>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium mb-1">E-post</label>
          <input
            id="email"
            name="email"
            autoComplete="off"
            value={user?.email ?? ""}
            className="w-full border rounded-md px-3 py-2 bg-gray-100"
            readOnly
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="mb-4">
          <label htmlFor="firstname" className="block text-sm font-medium mb-1">Förnamn</label>
          <input
            id="firstname"
            {...register("firstname")}
            readOnly={!isEditRoute}
            className={`${isEditRoute ? "" : "bg-gray-100"
              } w-full border rounded-md px-3 py-2`}
          />
          {errors.firstname && (
            <p className="text-red-500 text-sm  ">
              {errors.firstname?.message}
            </p>
          )}
        </div>
        <div className="mb-4">
          <label htmlFor="lastname" className="block text-sm font-medium mb-1">Efternamn</label>
          <input
            id="lastname"
            {...register("lastname")}
            readOnly={!isEditRoute}
            className={`${isEditRoute ? "" : "bg-gray-100"
              } w-full border rounded-md px-3 py-2`}
          />
          {errors.lastname && (
            <p className="text-red-500 text-sm  ">{errors.lastname?.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="mb-4">
          <label htmlFor="dateOfBirth" className="block text-sm font-medium mb-1">Födelsedatum</label>
          <input
            id="dateOfBirth"
            type="date"
            {...register("dateOfBirth")}
            readOnly={!isEditRoute}
            className={`${isEditRoute ? "" : "bg-gray-100"
              } w-full border rounded-md px-3 py-2`}
          />
          {errors.dateOfBirth && (
            <p className="text-red-500 text-sm  ">
              {errors.dateOfBirth?.message}
            </p>
          )}
        </div>
        <div className="mb-4">
          <label htmlFor="createdAt" className="block text-sm font-medium mb-1">Registrerad</label>
          <input
            id="createdAt"
            name="createdAt"
            value={
              user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : ""
            }
            readOnly
            className="w-full border rounded-md px-3 py-2 bg-gray-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="mb-4">
          <label htmlFor="mobile" className="block text-sm font-medium mb-1">Mobilnummer</label>
          <input
            id="mobile"
            type="number"
            {...register("mobile")}
            readOnly={!isEditRoute}
            className={`${isEditRoute ? "" : "bg-gray-100"
              } w-full border rounded-md px-3 py-2`}
          />
          {errors.mobile && (
            <p className="text-red-500 text-sm  ">{errors.mobile?.message}</p>
          )}
        </div>
        <div className="mb-4">
          <label htmlFor="homeNumber" className="block text-sm font-medium mb-1">Hemnummer</label>
          <input
            id="homeNumber"
            type="number"
            {...register("homeNumber")}
            readOnly={!isEditRoute}
            className={`${isEditRoute ? "" : "bg-gray-100"
              } w-full border rounded-md px-3 py-2`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="mb-4">
          <label htmlFor="address" className="block text-sm font-medium mb-1">Adress</label>
          <input
            id="address"
            {...register("address")}
            autoComplete="off"
            readOnly={!isEditRoute}
            className={`${isEditRoute ? "" : "bg-gray-100"
              } w-full border rounded-md px-3 py-2`}
          />
          {errors.address && (
            <p className="text-red-500 text-sm  ">{errors.address?.message}</p>
          )}
        </div>
        <div className="mb-4">
          <label htmlFor="zipcode" className="block text-sm font-medium mb-1">Postnummer</label>
          <input
            id="zipcode"
            type="number"
            {...register("zipcode")}
            readOnly={!isEditRoute}
            className={`${isEditRoute ? "" : "bg-gray-100"
              } w-full border rounded-md px-3 py-2`}
          />
          {errors.zipcode && (
            <p className="text-red-500 text-sm  ">{errors.zipcode?.message}</p>
          )}
        </div>
        <div className="mb-4">
          <label htmlFor="city" className="block text-sm font-medium mb-1">Stad</label>
          <input
            id="city"
            {...register("city")}
            readOnly={!isEditRoute}
            className={`${isEditRoute ? "" : "bg-gray-100"
              } w-full border rounded-md px-3 py-2`}
          />
          {errors.city && (
            <p className="text-red-500 text-sm  ">{errors.city?.message}</p>
          )}
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="work" className="block text-sm font-medium mb-1">Jobb</label>
        <input
          id="work"
          type="text"
          {...register("work")}
          readOnly={!isEditRoute}
          className={`${isEditRoute ? "" : "bg-gray-100"
            } w-full border rounded-md px-3 py-2`}
        />
        {errors.work && (
          <p className="text-red-500 text-sm  ">{errors.work?.message}</p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="notes" className="block text-sm font-medium mb-1">Noteringar</label>
        <input
          id="notes"
          type="text"
          {...register("notes")}
          readOnly={!isEditRoute}
          className={`${isEditRoute ? "" : "bg-gray-100"
            } w-full border rounded-md px-3 py-2`}
        />
        {errors.notes && (
          <p className="text-red-500 text-sm  ">{errors.notes?.message}</p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="accommodationAvailable" className="block text-sm font-medium mb-1">Tillgängligt boende</label>
        <input
          id="accommodationAvailable"
          type="checkbox"
          {...register("accommodationAvailable")}
          disabled={!isEditRoute}
          className={`${isEditRoute ? "" : "bg-gray-100"
            } border rounded-md px-3 py-2`}
        />
        {errors.accommodationAvailable && (
          <p className="text-red-500 text-sm  ">{errors.accommodationAvailable?.message}</p>
        )}
      </div>

      {isEditRoute ? (
        <div className="mb-4">
          <label htmlFor="profilePicture" className="block text-sm font-medium mb-1">
            Uppdatera Profilbild
          </label>
          <input
            id="profilePicture"
            name="profilePicture"
            type="file"
            accept="image/*"
            onChange={(e) =>
              setPictureFile(e.target.files ? e.target.files[0] : null)
            }
          />
        </div>
      ) : null}

      {/* Parent renders the consolidated save button */}
    </>
  );
};
