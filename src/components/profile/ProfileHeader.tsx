import { Link } from "react-router-dom";
import type { PublicUser } from "../../types";

export const ProfileHeader = ({
  user,
  isEditRoute,
}: {
  user?: PublicUser | null;
  isEditRoute: boolean;
}) => (
  <div className="w-full flex flex-row items-center md:items-start justify-between gap-2">
    <Link to=".." relative="path" className="text-sm text-green-600 hover:text-green-700 hover:underline">
      ← Tillbaka
    </Link>
    <div className="flex flex-col md:flex-row items-center gap-2">
      {user && !isEditRoute && (
        <Link
          to="/profile/edit"
          className="w-full text-sm font-medium text-white text-center bg-green-600 hover:bg-green-700 transition px-3 py-2 rounded-md"
        >
          Redigera
        </Link>
      )}
      {user && (
        <Link
          to="/profile/attended"
          className="w-full text-sm font-medium text-white text-center bg-green-600 hover:bg-green-700 transition px-3 py-2 rounded-md"
        >
          Närvaro
        </Link>
      )}
      <Link
        to="/profile/memberships"
        className="w-full text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition px-3 py-2 rounded-md"
      >
        Medlemskap
      </Link>
    </div>
  </div>
);
