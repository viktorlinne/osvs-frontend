import { Link } from "react-router-dom";
import type { PublicUser } from "../../types";

export const ProfileHeader = ({
  user,
  isEditRoute,
}: {
  user?: PublicUser | null;
  isEditRoute: boolean;
}) => (
  <div className="flex w-full flex-col items-stretch gap-2 md:flex-row md:items-start md:justify-between">
    <Link to=".." relative="path" className="ui-link w-fit">
      â† Tillbaka
    </Link>
    <div className="flex flex-col gap-2 sm:flex-row">
      {user && !isEditRoute && (
        <Link to="/profile/edit" className="ui-btn ui-btn-primary w-full sm:w-auto">
          Redigera
        </Link>
      )}
      {user && (
        <Link to="/profile/attended" className="ui-btn ui-btn-primary w-full sm:w-auto">
          NÃ¤rvaro
        </Link>
      )}
      <Link to="/profile/memberships" className="ui-btn ui-btn-primary w-full sm:w-auto">
        Medlemskap
      </Link>
    </div>
  </div>
);
