import { NavLink, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      // ignore for now
      navigate("/login");
    }
  };

  return (
    <nav className="flex gap-4 p-4 bg-gray-100 items-center">
      <NavLink
        className="p-2 rounded bg-green-600 hover:bg-green-700 transition text-white"
        to="/"
      >
        Hem
      </NavLink>
      <NavLink
        className="p-2 rounded bg-green-600 hover:bg-green-700 transition text-white"
        to="/about"
      >
        Om VS
      </NavLink>
      <NavLink
        className="p-2 rounded bg-green-600 hover:bg-green-700 transition text-white"
        to="/gdpr"
      >
        GDPR
      </NavLink>
      <NavLink
        className="p-2 rounded bg-green-600 hover:bg-green-700 transition text-white"
        to="/contact"
      >
        Kontakt
      </NavLink>

      {!user ? (
        <NavLink
          className="p-2 rounded bg-green-600 hover:bg-green-700 transition text-white ml-auto"
          to="/login"
        >
          Logga In
        </NavLink>
      ) : (
        <div className="ml-auto flex items-center gap-2">
          {typeof (user as any)?.firstname === "string" ? (
            <span className="text-sm">{(user as any).firstname}</span>
          ) : null}
          <button
            onClick={handleLogout}
            className="p-2 rounded bg-red-600 hover:bg-red-700 transition text-white"
          >
            Logga ut
          </button>
        </div>
      )}
    </nav>
  );
};
