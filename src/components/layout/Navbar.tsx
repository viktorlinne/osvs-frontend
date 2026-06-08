import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth, useError } from "../../context";
import { getApiErrorMessage } from "../../utils/apiErrors";

function formatSessionCountdown(expiresAt: string, nowMs: number) {
  const remainingMs = Math.max(0, Date.parse(expiresAt) - nowMs);
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function NavItem({
  to,
  children,
  onClick,
  inDropdown,
}: {
  to: string;
  children: React.ReactNode;
  onClick?: () => void;
  inDropdown?: boolean;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      role={inDropdown ? "menuitem" : undefined}
      className={({ isActive }) =>
        inDropdown
          ? `block w-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 ${
              isActive
                ? "bg-primary-50 text-primary-700"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            }`
          : `ui-nav-item ${
              isActive
                ? "bg-primary-50 text-primary-700"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            }`
      }
    >
      {children}
    </NavLink>
  );
}

function NavDropdown({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose?: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const handleItemClick = () => {
    setOpen(false);
    onClose?.();
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`ui-nav-item inline-flex items-center gap-1 ${
          open
            ? "bg-primary-50 text-primary-700"
            : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
        }`}
      >
        {label}
        <svg
          className="h-3 w-3 shrink-0"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d={open ? "M2 8l4-4 4 4" : "M2 4l4 4 4-4"}
          />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-1 min-w-[10rem] rounded border border-neutral-200 bg-neutral-50 py-1 shadow-card"
        >
          {React.Children.map(children, (child) =>
            React.isValidElement(child)
              ? React.cloneElement(
                  child as React.ReactElement<{ onClick?: () => void; inDropdown?: boolean }>,
                  { onClick: handleItemClick, inDropdown: true }
                )
              : child
          )}
        </div>
      )}
    </div>
  );
}

export const Navbar: React.FC = () => {
  const { user, session, logout } = useAuth();
  const { setError, clearError } = useError();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const countdown =
    user && session
      ? formatSessionCountdown(session.inactivityExpiresAt, nowMs)
      : null;

  const closeMenu = () => {
    setOpen(false);
    setConfirmingLogout(false);
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!user || !session) return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [user, session]);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      clearError();
      closeMenu();
      navigate("/login");
    } catch (error: unknown) {
      setError(getApiErrorMessage(error) ?? "Kunde inte logga ut");
      setTimeout(() => clearError(), 6000);
    }
  };

  const handleLogoutClick = () => {
    if (!confirmingLogout) {
      setConfirmingLogout(true);
      confirmTimerRef.current = setTimeout(() => setConfirmingLogout(false), 3000);
      return;
    }
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    setConfirmingLogout(false);
    void handleLogout();
  };

  return (
    <header>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-neutral-900 focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:uppercase focus:tracking-widest focus:text-neutral-50"
      >
        Hoppa till innehåll
      </a>
      {/* Masthead */}
      <div className="border-b border-neutral-200 bg-neutral-100">
        <div className="container grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-4">
          {/* Left: mobile hamburger */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              aria-expanded={open}
              aria-label={open ? "Stäng meny" : "Öppna meny"}
              onClick={() => setOpen((s) => !s)}
              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md p-2 text-neutral-700 transition-colors hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
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

          {/* Center: seal + org name */}
          <div className="flex flex-col items-center gap-1 text-center">
            <NavLink
              to="/"
              onClick={closeMenu}
              className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
            >
              <img
                src="/osvs.png"
                alt="Ordensamfundet VS logotyp"
                className="mx-auto h-14 object-contain"
              />
            </NavLink>
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-700">
              Ordensamfundet VS
            </p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-neutral-400">
              est. MCMXXIV
            </p>
          </div>

          {/* Right: auth controls (desktop) */}
          <div className="hidden items-center justify-end gap-3 lg:flex">
            {countdown && (
              <span className="text-xs font-medium tabular-nums text-neutral-500">
                {countdown}
              </span>
            )}
            {user ? (
              <>
                <NavLink
                  to="/profile"
                  onClick={closeMenu}
                  className="text-xs font-semibold uppercase tracking-widest text-neutral-600 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                >
                  Profil
                </NavLink>
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className={`ui-btn ui-btn-sm ${confirmingLogout ? "ui-btn-danger" : "ui-btn-secondary"}`}
                >
                  {confirmingLogout ? "Bekräfta?" : "Logga ut"}
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                onClick={closeMenu}
                className="text-xs font-semibold uppercase tracking-widest text-neutral-600 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
              >
                Logga in
              </NavLink>
            )}
          </div>

          {/* Right spacer on mobile (balances hamburger) */}
          <div className="lg:hidden" />
        </div>
      </div>

      {/* Flat nav bar (desktop) */}
      <nav
        aria-label="Primär navigering"
        className="border-b border-neutral-200 bg-neutral-50"
      >
        <div className="container hidden items-center gap-0.5 py-1.5 lg:flex">
          <NavItem to="/" onClick={closeMenu}>
            Hem
          </NavItem>
          <NavItem to="/about" onClick={closeMenu}>
            Om VS
          </NavItem>
          <NavItem to="/lodges" onClick={closeMenu}>
            Loger
          </NavItem>
          <NavItem to="/contact" onClick={closeMenu}>
            Kontakt
          </NavItem>
          <NavItem to="/gdpr" onClick={closeMenu}>
            GDPR
          </NavItem>

          {user && (
            <>
              <span className="mx-2 select-none text-neutral-300" aria-hidden>
                ·
              </span>
              <NavItem to="/posts" onClick={closeMenu}>
                Nyheter
              </NavItem>
              <NavItem to="/members" onClick={closeMenu}>
                Medlemmar
              </NavItem>
              <NavItem to="/events" onClick={closeMenu}>
                Möten
              </NavItem>
              <NavItem to="/regalia" onClick={closeMenu}>
                Regalier
              </NavItem>
              <NavItem to="/map" onClick={closeMenu}>
                Karta
              </NavItem>
              <span className="mx-2 select-none text-neutral-300" aria-hidden>
                ·
              </span>
              <NavDropdown label="Arkiv" onClose={closeMenu}>
                <NavItem to="/documents">Dokument</NavItem>
                <NavItem to="/revisions">Revisioner</NavItem>
              </NavDropdown>
            </>
          )}
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="border-b border-neutral-200 bg-neutral-50 lg:hidden">
          <div className="container space-y-0.5 py-3">
            <NavItem to="/" onClick={closeMenu}>
              Hem
            </NavItem>
            <NavItem to="/about" onClick={closeMenu}>
              Om VS
            </NavItem>
            <NavItem to="/lodges" onClick={closeMenu}>
              Loger
            </NavItem>
            <NavItem to="/contact" onClick={closeMenu}>
              Kontakt
            </NavItem>
            <NavItem to="/gdpr" onClick={closeMenu}>
              GDPR
            </NavItem>

            {user && (
              <>
                <div className="my-2 border-t border-neutral-200" />
                <NavItem to="/posts" onClick={closeMenu}>
                  Nyheter
                </NavItem>
                <NavItem to="/members" onClick={closeMenu}>
                  Medlemmar
                </NavItem>
                <NavItem to="/events" onClick={closeMenu}>
                  Möten
                </NavItem>
                <NavItem to="/regalia" onClick={closeMenu}>
                  Regalier
                </NavItem>
                <NavItem to="/map" onClick={closeMenu}>
                  Karta
                </NavItem>
                <div className="my-2 border-t border-neutral-200" />
                <NavItem to="/documents" onClick={closeMenu}>
                  Dokument
                </NavItem>
                <NavItem to="/revisions" onClick={closeMenu}>
                  Revisioner
                </NavItem>
                <div className="my-2 border-t border-neutral-200" />
                {countdown && (
                  <p className="px-2.5 py-1.5 text-xs font-medium tabular-nums text-neutral-500">
                    {countdown}
                  </p>
                )}
                <NavItem to="/profile" onClick={closeMenu}>
                  Profil
                </NavItem>
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className={`ui-btn ui-btn-sm mt-2 w-full ${confirmingLogout ? "ui-btn-danger" : "ui-btn-secondary"}`}
                >
                  {confirmingLogout ? "Bekräfta utloggning?" : "Logga ut"}
                </button>
              </>
            )}

            {!user && (
              <>
                <div className="my-2 border-t border-neutral-200" />
                <NavItem to="/login" onClick={closeMenu}>
                  Logga in
                </NavItem>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
