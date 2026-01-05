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
    <Link to="/news" className="text-sm text-green-600 underline">
      ← Tillbaka
    </Link>
    {user && !isEditRoute && (
      <Link
        to="/profile/edit"
        className="text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition px-3 py-2 rounded-md"
      >
        Redigera
      </Link>
    )}
  </div>
);
