import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth, useError } from "../../context";
import type { ApiError } from "../../types";
import { isApiError } from "../../types/api";
import { Banner } from "./Banner";

type NavButtonProps = {
  to: string;
  children: React.ReactNode;
  onClick?: () => void;
};

const navButtonBase =
  "block rounded-md px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2";

const NavButton: React.FC<NavButtonProps> = ({ to, children, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `${navButtonBase} ${
        isActive
          ? "bg-primary-600 text-white"
          : "text-neutral-700 hover:bg-neutral-100"
      }`
    }
  >
    {children}
  </NavLink>
);

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { setError, clearError } = useError();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (e.target instanceof Node && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

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
    <>
      <header className="border-b border-neutral-200 bg-white shadow-sm">
        <nav className="container" aria-label="Top">
          <div className="flex w-full items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-4">
              <NavLink
                to="/"
                className="text-2xl font-bold text-primary-600 transition hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
              >
                OSVS
              </NavLink>
              <div className="hidden md:flex items-center">
                <div
                  className="relative"
                  ref={menuRef}
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <button
                    type="button"
                    onMouseEnter={() => setMenuOpen(true)}
                    className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                    aria-expanded={menuOpen}
                  >
                    Publika sidor
                    <svg
                      className="ml-2 h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {menuOpen && (
                    <div className="absolute left-0 z-30 w-48 rounded-md border border-neutral-200 bg-white shadow-card">
                      <div>
                        <NavButton
                          to="/"
                          onClick={() => {
                            setOpen(false);
                            setMenuOpen(false);
                          }}
                        >
                          Hem
                        </NavButton>
                        <NavButton
                          to="/about"
                          onClick={() => {
                            setOpen(false);
                            setMenuOpen(false);
                          }}
                        >
                          Om VS
                        </NavButton>
                        <NavButton
                          to="/lodges"
                          onClick={() => {
                            setOpen(false);
                            setMenuOpen(false);
                          }}
                        >
                          Loger
                        </NavButton>
                        <NavButton
                          to="/gdpr"
                          onClick={() => {
                            setOpen(false);
                            setMenuOpen(false);
                          }}
                        >
                          GDPR
                        </NavButton>
                        <NavButton
                          to="/contact"
                          onClick={() => {
                            setOpen(false);
                            setMenuOpen(false);
                          }}
                        >
                          Kontakt
                        </NavButton>
                        {/* only the four public links in this dropdown */}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {user && (
                <div className="hidden md:flex items-center space-x-2">
                  <NavButton to="/posts" onClick={() => setOpen(false)}>
                    Nyheter
                  </NavButton>
                  <NavButton to="/events" onClick={() => setOpen(false)}>
                    Möten
                  </NavButton>
                  <NavButton to="/members" onClick={() => setOpen(false)}>
                    Medlemmar
                  </NavButton>
                  <NavButton to="/revisions" onClick={() => setOpen(false)}>
                    Revisioner
                  </NavButton>
                  <NavButton to="/documents" onClick={() => setOpen(false)}>
                    Dokument
                  </NavButton>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2">
                {!user ? (
                  <NavButton to="/login" onClick={() => setOpen(false)}>
                    Logga in
                  </NavButton>
                ) : (
                  <>
                    <NavButton to="/profile" onClick={() => setOpen(false)}>
                      Profil
                    </NavButton>
                    <button
                      onClick={handleLogout}
                      className="ui-btn ui-btn-sm ui-btn-danger"
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
                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md p-2 text-neutral-700 transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 md:hidden"
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
            <div className="border-t border-neutral-200 pb-4 pt-3 md:hidden">
              <div className="px-2 space-y-1">
                <NavButton to="/" onClick={() => setOpen(false)}>
                  Hem
                </NavButton>
                <NavButton to="/about" onClick={() => setOpen(false)}>
                  Om VS
                </NavButton>
                <NavButton to="/lodges" onClick={() => setOpen(false)}>
                  Loger
                </NavButton>
                <NavButton to="/gdpr" onClick={() => setOpen(false)}>
                  GDPR
                </NavButton>
                <NavButton to="/contact" onClick={() => setOpen(false)}>
                  Kontakt
                </NavButton>
                {user ? (
                  <>
                    <NavButton to="/posts" onClick={() => setOpen(false)}>
                      Nyheter
                    </NavButton>
                    <NavButton to="/events" onClick={() => setOpen(false)}>
                      Möten
                    </NavButton>
                    <NavButton to="/members" onClick={() => setOpen(false)}>
                      Medlemmar
                    </NavButton>
                    <NavButton to="/revisions" onClick={() => setOpen(false)}>
                      Revisioner
                    </NavButton>
                    <NavButton to="/documents" onClick={() => setOpen(false)}>
                      Dokument
                    </NavButton>
                  </>
                ) : null}
                {!user ? (
                  <NavButton to="/login" onClick={() => setOpen(false)}>
                    Logga in
                  </NavButton>
                ) : (
                  <>
                    <NavButton to="/profile" onClick={() => setOpen(false)}>
                      Profil
                    </NavButton>
                    <button
                      onClick={() => {
                        setOpen(false);
                        void handleLogout();
                      }}
                      className="ui-btn ui-btn-sm ui-btn-danger w-full"
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
      <Banner />
    </>
  );
};
