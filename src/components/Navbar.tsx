import axios from "axios";
import { NavLink, useNavigate } from "react-router";
import { useAuth, useError } from "../context";
import type { ApiError } from "../types";
import { isApiError } from "../types/api";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { setError, clearError } = useError();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      clearError();
      navigate("/login");
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response) {
        const data = e.response.data as ApiError;
        setError(data?.message ?? "Logout failed");
      } else if (isApiError(e)) {
        setError(e.message ?? "Logout failed");
      } else {
        setError(String(e ?? "Logout failed"));
      }
      setTimeout(() => clearError(), 6000);
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
          <NavLink to="/profile">
            {user.firstname ? (
              <span className="p-2 rounded bg-green-600 hover:bg-green-700 transition text-white">
                {user.firstname}
              </span>
            ) : null}
          </NavLink>
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
