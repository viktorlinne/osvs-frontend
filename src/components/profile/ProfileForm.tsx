import { Spinner } from "../../components";
import type { PublicUser, UpdateUserForm } from "../../types";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { useNavigate } from "react-router-dom";

export const ProfileForm = ({
  user,
  register,
  errors,
  isEditRoute,
  setPictureFile,
  saving,
}: {
  user?: PublicUser | null;
  register: UseFormRegister<UpdateUserForm>;
  errors: FieldErrors<UpdateUserForm>;
  isEditRoute: boolean;
  setPictureFile: (f: File | null) => void;
  saving: boolean;
}) => {
  const navigate = useNavigate();
  const handleSubmit = () => {
    navigate("/profile");
  };
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Användarnamn</label>
          <input
            value={user?.username ?? ""}
            readOnly
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">E-post</label>
          <input
            value={user?.email ?? ""}
            readOnly
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Förnamn</label>
          <input
            {...register("firstname")}
            readOnly={!isEditRoute}
            className={`${
              isEditRoute ? "" : "bg-gray-100"
            } w-full border rounded px-3 py-2`}
          />
          {errors.firstname && (
            <p className="text-red-500 text-sm  ">
              {errors.firstname?.message}
            </p>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Efternamn</label>
          <input
            {...register("lastname")}
            readOnly={!isEditRoute}
            className={`${
              isEditRoute ? "" : "bg-gray-100"
            } w-full border rounded px-3 py-2`}
          />
          {errors.lastname && (
            <p className="text-red-500 text-sm  ">{errors.lastname?.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Födelsedatum</label>
          <input
            type="date"
            {...register("dateOfBirth")}
            readOnly={!isEditRoute}
            className={`${
              isEditRoute ? "" : "bg-gray-100"
            } w-full border rounded px-3 py-2`}
          />
          {errors.dateOfBirth && (
            <p className="text-red-500 text-sm  ">
              {errors.dateOfBirth?.message}
            </p>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Registrerad</label>
          <input
            value={
              user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : ""
            }
            readOnly
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Mobilnummer</label>
          <input
            type="number"
            {...register("mobile")}
            readOnly={!isEditRoute}
            className={`${
              isEditRoute ? "" : "bg-gray-100"
            } w-full border rounded px-3 py-2`}
          />
          {errors.mobile && (
            <p className="text-red-500 text-sm  ">{errors.mobile?.message}</p>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Hemnummer</label>
          <input
            type="number"
            {...register("homeNumber")}
            readOnly={!isEditRoute}
            className={`${
              isEditRoute ? "" : "bg-gray-100"
            } w-full border rounded px-3 py-2`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Adress</label>
          <input
            {...register("address")}
            readOnly={!isEditRoute}
            className={`${
              isEditRoute ? "" : "bg-gray-100"
            } w-full border rounded px-3 py-2`}
          />
          {errors.address && (
            <p className="text-red-500 text-sm  ">{errors.address?.message}</p>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Postnummer</label>
          <input
            type="number"
            {...register("zipcode")}
            readOnly={!isEditRoute}
            className={`${
              isEditRoute ? "" : "bg-gray-100"
            } w-full border rounded px-3 py-2`}
          />
          {errors.zipcode && (
            <p className="text-red-500 text-sm  ">{errors.zipcode?.message}</p>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Stad</label>
          <input
            {...register("city")}
            readOnly={!isEditRoute}
            className={`${
              isEditRoute ? "" : "bg-gray-100"
            } w-full border rounded px-3 py-2`}
          />
          {errors.city && (
            <p className="text-red-500 text-sm  ">{errors.city?.message}</p>
          )}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Tjänst</label>
        <input
          type="text"
          {...register("official")}
          readOnly={!isEditRoute}
          className={`${
            isEditRoute ? "" : "bg-gray-100"
          } w-full border rounded px-3 py-2`}
        />
        {errors.official && (
          <p className="text-red-500 text-sm  ">{errors.official?.message}</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Noteringar</label>
        <input
          type="text"
          {...register("notes")}
          readOnly={!isEditRoute}
          className={`${
            isEditRoute ? "" : "bg-gray-100"
          } w-full border rounded px-3 py-2`}
        />
        {errors.notes && (
          <p className="text-red-500 text-sm  ">{errors.notes?.message}</p>
        )}
      </div>

      {isEditRoute ? (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Uppdatera Profilbild
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setPictureFile(e.target.files ? e.target.files[0] : null)
            }
          />
        </div>
      ) : null}

      {isEditRoute ? (
        <div className="flex items-center gap-x-4 py-2 mb-4">
          <button
            type="submit"
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 transition text-white px-4 py-2 rounded"
            disabled={saving}
          >
            Spara
          </button>
          {saving && <Spinner />}
        </div>
      ) : null}
    </>
  );
};
