import React, { useState } from "react";
import axios from "axios";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth, useError } from "../context";
import type { ApiError } from "../types";
import { isApiError } from "../types/api";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { setError, clearError } = useError();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

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

  const NavButton: React.FC<{
    to: string;
    children: React.ReactNode;
  }> = ({ to, children }) => (
    <NavLink
      to={to}
      onClick={() => setOpen(false)}
      className={({ isActive }) =>
        `block px-3 py-2 rounded-md text-sm font-medium transition ${
          isActive
            ? "bg-green-600 text-white"
            : "text-gray-700 hover:bg-gray-100"
        }`
      }
    >
      {children}
    </NavLink>
  );

  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="w-full py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <NavLink to="/" className="text-2xl font-bold text-green-700">
              OSVS
            </NavLink>
            <div className="hidden md:flex items-center space-x-2">
              <NavButton to="/">Hem</NavButton>
              <NavButton to="/about">Om VS</NavButton>
              <NavButton to="/gdpr">GDPR</NavButton>
              <NavButton to="/contact">Kontakt</NavButton>
              {user ? (
                <>
                  <NavButton to="/news">Nyheter</NavButton>
                  <NavButton to="/events">Möten</NavButton>
                  <NavButton to="/members">Medlemmar</NavButton>
                  <NavButton to="/lodges">Loger</NavButton>
                </>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2">
              {!user ? (
                <NavButton to="/login">Logga in</NavButton>
              ) : (
                <>
                  <NavButton to="/profile">Profil</NavButton>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition"
                  >
                    Logga ut
                  </button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              aria-expanded={open}
              aria-label="Toggle navigation"
              onClick={() => setOpen((s) => !s)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-100 transition"
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                {open ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden pb-4">
            <div className="px-2 space-y-1">
              <NavButton to="/">Hem</NavButton>
              <NavButton to="/about">Om VS</NavButton>
              <NavButton to="/gdpr">GDPR</NavButton>
              <NavButton to="/contact">Kontakt</NavButton>
              {user ? (
                <>
                  <NavButton to="/news">Nyheter</NavButton>
                  <NavButton to="/events">Möten</NavButton>
                  <NavButton to="/members">Medlemmar</NavButton>
                  <NavButton to="/lodges">Loger</NavButton>
                </>
              ) : null}
              {!user ? (
                <NavButton to="/login">Logga in</NavButton>
              ) : (
                <>
                  <NavButton to="/profile">Profil</NavButton>
                  <button
                    onClick={() => {
                      setOpen(false);
                      void handleLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-gray-100"
                  >
                    Logga ut
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
