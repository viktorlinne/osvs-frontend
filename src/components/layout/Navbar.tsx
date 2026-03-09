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

type DropdownKey = "public" | "members" | "archive";

const navButtonBase =
  "block rounded-md px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2";

const dropdownButtonBase =
  "inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2";

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

type DropdownProps = {
  id: DropdownKey;
  label: string;
  activeDropdown: DropdownKey | null;
  setActiveDropdown: React.Dispatch<React.SetStateAction<DropdownKey | null>>;
  closeAllMenus: () => void;
  children: React.ReactNode;
};

const Dropdown: React.FC<DropdownProps> = ({
  id,
  label,
  activeDropdown,
  setActiveDropdown,
  closeAllMenus,
  children,
}) => {
  const isOpen = activeDropdown === id;

  return (
    <div
      className="relative"
      onMouseEnter={() => setActiveDropdown(id)}
      onMouseLeave={() => {
        if (isOpen) setActiveDropdown(null);
      }}
    >
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setActiveDropdown((prev) => (prev === id ? null : id))}
        className={dropdownButtonBase}
      >
        {label}
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

      {isOpen && (
        <div className="absolute left-0 top-full z-30 w-52 rounded-md border border-neutral-200 bg-white shadow-card">
          <div
            onClick={closeAllMenus}
            className="max-h-[70vh] overflow-y-auto overflow-x-hidden"
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { setError, clearError } = useError();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<DropdownKey | null>(
    null,
  );
  const navRef = useRef<HTMLElement | null>(null);

  const closeAllMenus = () => {
    setOpen(false);
    setActiveDropdown(null);
  };

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!navRef.current) return;
      if (e.target instanceof Node && !navRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setActiveDropdown(null);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      clearError();
      closeAllMenus();
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
        <nav ref={navRef} className="container" aria-label="Top">
          <div className="flex w-full min-w-0 items-center justify-between gap-2 py-3 lg:gap-4">
            <div className="flex min-w-0 items-center gap-2 lg:gap-3">
              <NavLink
                to="/"
                onClick={closeAllMenus}
                className="text-2xl font-bold text-primary-600 transition hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
              >
                OSVS
              </NavLink>

              <div className="hidden min-w-0 items-center gap-1 lg:flex lg:gap-2">
                <Dropdown
                  id="public"
                  label="Publika sidor"
                  activeDropdown={activeDropdown}
                  setActiveDropdown={setActiveDropdown}
                  closeAllMenus={closeAllMenus}
                >
                  <NavButton to="/" onClick={closeAllMenus}>
                    Hem
                  </NavButton>
                  <NavButton to="/about" onClick={closeAllMenus}>
                    Om VS
                  </NavButton>
                  <NavButton to="/lodges" onClick={closeAllMenus}>
                    Loger
                  </NavButton>
                  <NavButton to="/gdpr" onClick={closeAllMenus}>
                    GDPR
                  </NavButton>
                  <NavButton to="/contact" onClick={closeAllMenus}>
                    Kontakt
                  </NavButton>
                </Dropdown>

                {user && (
                  <Dropdown
                    id="members"
                    label="Medlemssidor"
                    activeDropdown={activeDropdown}
                    setActiveDropdown={setActiveDropdown}
                    closeAllMenus={closeAllMenus}
                  >
                    <NavButton to="/posts" onClick={closeAllMenus}>
                      Nyheter
                    </NavButton>
                    <NavButton to="/members" onClick={closeAllMenus}>
                      Medlemmar
                    </NavButton>
                    <NavButton to="/events" onClick={closeAllMenus}>
                      Möten
                    </NavButton>
                    <NavButton to="/regalia" onClick={closeAllMenus}>
                      Regalier
                    </NavButton>
                    <NavButton to="/map" onClick={closeAllMenus}>
                      Karta
                    </NavButton>
                  </Dropdown>
                )}

                {user && (
                  <Dropdown
                    id="archive"
                    label="Arkiv"
                    activeDropdown={activeDropdown}
                    setActiveDropdown={setActiveDropdown}
                    closeAllMenus={closeAllMenus}
                  >
                    <NavButton to="/documents" onClick={closeAllMenus}>
                      Dokument
                    </NavButton>
                    <NavButton to="/revisions" onClick={closeAllMenus}>
                      Revisioner
                    </NavButton>
                  </Dropdown>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 lg:gap-3">
              <div className="hidden items-center gap-2 lg:flex">
                {!user ? (
                  <NavButton to="/login" onClick={closeAllMenus}>
                    Logga in
                  </NavButton>
                ) : (
                  <>
                    <NavButton to="/profile" onClick={closeAllMenus}>
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

              <button
                type="button"
                aria-expanded={open}
                aria-label="Toggle navigation"
                onClick={() => {
                  setActiveDropdown(null);
                  setOpen((state) => !state);
                }}
                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md p-2 text-neutral-700 transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 lg:hidden"
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
            <div className="border-t border-neutral-200 pb-4 pt-3 lg:hidden">
              <div className="space-y-1 px-2">
                <NavButton to="/" onClick={closeAllMenus}>
                  Hem
                </NavButton>
                <NavButton to="/about" onClick={closeAllMenus}>
                  Om VS
                </NavButton>
                <NavButton to="/lodges" onClick={closeAllMenus}>
                  Loger
                </NavButton>
                <NavButton to="/gdpr" onClick={closeAllMenus}>
                  GDPR
                </NavButton>
                <NavButton to="/contact" onClick={closeAllMenus}>
                  Kontakt
                </NavButton>

                {user ? (
                  <>
                    <NavButton to="/posts" onClick={closeAllMenus}>
                      Nyheter
                    </NavButton>
                    <NavButton to="/members" onClick={closeAllMenus}>
                      Medlemmar
                    </NavButton>
                    <NavButton to="/events" onClick={closeAllMenus}>
                      Möten
                    </NavButton>
                    <NavButton to="/regalia" onClick={closeAllMenus}>
                      Regalier
                    </NavButton>
                    <NavButton to="/map" onClick={closeAllMenus}>
                      Karta
                    </NavButton>
                    <NavButton to="/documents" onClick={closeAllMenus}>
                      Dokument
                    </NavButton>
                    <NavButton to="/revisions" onClick={closeAllMenus}>
                      Revisioner
                    </NavButton>
                  </>
                ) : null}

                {!user ? (
                  <NavButton to="/login" onClick={closeAllMenus}>
                    Logga in
                  </NavButton>
                ) : (
                  <>
                    <NavButton to="/profile" onClick={closeAllMenus}>
                      Profil
                    </NavButton>
                    <button
                      onClick={() => {
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
