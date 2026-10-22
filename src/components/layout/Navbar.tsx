import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router";
import { useAuth, useError } from "../../context";
import { getApiErrorMessage } from "../../utils/apiErrors";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { NavDropdown } from "./NavDropdown";
import { NavItem } from "./NavItem";

function formatSessionCountdown(expiresAt: string, nowMs: number) {
  const remainingMs = Math.max(0, Date.parse(expiresAt) - nowMs);
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function NavbarUserMenu({
  countdown,
  onLogoutClick,
  onClose,
  mobile = false,
}: {
  countdown: string | null;
  onLogoutClick: () => void;
  onClose: () => void;
  mobile?: boolean;
}) {
  if (mobile) {
    return (
      <>
        {countdown ? (
          <p className="px-2.5 py-1.5 text-xs font-medium tabular-nums text-neutral-600">
            {countdown}
          </p>
        ) : null}
        <NavItem to="/profile" onClick={onClose}>
          Profil
        </NavItem>
        <button
          type="button"
          onClick={onLogoutClick}
          className="ui-btn ui-btn-sm ui-btn-secondary mt-2 w-full"
        >
          Logga ut
        </button>
      </>
    );
  }

  return (
    <>
      {countdown ? (
        <span className="text-xs font-medium tabular-nums text-neutral-600">
          {countdown}
        </span>
      ) : null}
      <NavLink
        to="/profile"
        onClick={onClose}
        className="text-xs font-semibold uppercase tracking-widest text-neutral-600 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
      >
        Profil
      </NavLink>
      <button
        type="button"
        onClick={onLogoutClick}
        className="ui-btn ui-btn-sm ui-btn-secondary"
      >
        Logga ut
      </button>
    </>
  );
}

function canManageGroups(user: { roles?: string[] }) {
  return (user.roles ?? []).some((role) => role === "Admin" || role === "Editor");
}

function NavbarLinks({
  user,
  onClose,
}: {
  user: { roles?: string[] } | null;
  onClose: () => void;
}) {
  return (
    <>
      <NavItem to="/" onClick={onClose}>
        Hem
      </NavItem>
      <NavItem to="/about" onClick={onClose}>
        Om VS
      </NavItem>
      <NavItem to="/lodges" onClick={onClose}>
        Loger
      </NavItem>
      <NavItem to="/contact" onClick={onClose}>
        Kontakt
      </NavItem>
      <NavItem to="/gdpr" onClick={onClose}>
        GDPR
      </NavItem>

      {user ? (
        <>
          <span className="mx-2 hidden select-none text-neutral-300 lg:inline" aria-hidden>
            ·
          </span>
          <NavItem to="/posts" onClick={onClose}>
            Nyheter
          </NavItem>
          <NavItem to="/members" onClick={onClose}>
            Medlemmar
          </NavItem>
          <NavItem to="/events" onClick={onClose}>
            Möten
          </NavItem>
          <NavItem to="/regalia" onClick={onClose}>
            Regalier
          </NavItem>
          <NavItem to="/map" onClick={onClose}>
            Karta
          </NavItem>
          <span className="mx-2 hidden select-none text-neutral-300 lg:inline" aria-hidden>
            ·
          </span>
          <div className="hidden lg:contents">
            <NavDropdown label="Arkiv" onClose={onClose}>
              <NavItem to="/documents">Dokument</NavItem>
              <NavItem to="/revisions">Revisioner</NavItem>
              {canManageGroups(user) ? (
                <NavItem to="/admin/groups">Grupper</NavItem>
              ) : null}
              {(user.roles ?? []).includes("Admin") ? (
                <NavItem to="/admin/membership-payments">Medlemsavgifter</NavItem>
              ) : null}
              {canManageGroups(user) ? (
                <NavItem to="/admin/event-payments">Mötesavgifter</NavItem>
              ) : null}
            </NavDropdown>
          </div>
        </>
      ) : null}
    </>
  );
}

export const Navbar: React.FC = () => {
  const { user, session, logout } = useAuth();
  const { setError, clearError } = useError();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  // Read by the document-level Escape handler: while the logout dialog is
  // open, Escape belongs to the dialog and must not also close the menu
  // (that would unmount the button focus should return to).
  const logoutDialogOpenRef = useRef(false);
  useEffect(() => {
    logoutDialogOpenRef.current = logoutDialogOpen;
  }, [logoutDialogOpen]);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const countdown =
    user && session
      ? formatSessionCountdown(session.inactivityExpiresAt, nowMs)
      : null;

  const closeMenu = () => {
    setOpen(false);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || logoutDialogOpenRef.current) return;
      // Return focus to the toggle when Escape closes the mobile menu from
      // inside it, so keyboard users are not dropped at the top of the page.
      const focusInMobileMenu = mobileMenuRef.current?.contains(document.activeElement);
      closeMenu();
      if (focusInMobileMenu) menuButtonRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!user || !session) return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [user, session]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      clearError();
    } catch (error: unknown) {
      // The local session is cleared either way (see AuthProvider.logout).
      const reason = getApiErrorMessage(error);
      setError(
        `Servern kunde inte bekräfta utloggningen${reason ? ` (${reason})` : ""}. ` +
          "Stäng webbläsaren om du använder en delad dator.",
      );
    } finally {
      setLoggingOut(false);
      setLogoutDialogOpen(false);
      closeMenu();
      navigate("/login");
    }
  };

  const handleLogoutClick = () => setLogoutDialogOpen(true);

  return (
    <header>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-neutral-900 focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:uppercase focus:tracking-widest focus:text-neutral-50"
      >
        Hoppa till innehåll
      </a>
      <div className="border-b border-neutral-200 bg-neutral-100">
        <div className="container grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-4">
          {/* Always rendered so the logo stays in the middle column on desktop. */}
          <div className="flex items-center">
            <button
              ref={menuButtonRef}
              type="button"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Stäng meny" : "Öppna meny"}
              onClick={() => setOpen((s) => !s)}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md p-2 text-neutral-700 lg:hidden transition-colors hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          <div className="flex flex-col items-center gap-1 text-center">
            <NavLink
              to="/"
              onClick={closeMenu}
              className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
            >
              <img
                src="/osvs.png"
                alt="Ordenssamfundet VS logotyp"
                className="mx-auto h-14 object-contain"
              />
            </NavLink>
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-700">
              Ordenssamfundet VS
            </p>
            <p className="text-[10px] font-medium uppercase tracking-widest text-neutral-600">
              est. MCMXXIV
            </p>
          </div>

          <div className="hidden items-center justify-end gap-3 lg:flex">
            {user ? (
              <NavbarUserMenu
                countdown={countdown}
                onLogoutClick={handleLogoutClick}
                onClose={closeMenu}
              />
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

          <div className="lg:hidden" />
        </div>
      </div>

      <nav
        aria-label="Primär navigering"
        className="border-b border-neutral-200 bg-neutral-50"
      >
        <div className="container hidden items-center gap-0.5 py-1.5 lg:flex">
          <NavbarLinks user={user} onClose={closeMenu} />
        </div>
      </nav>

      {open ? (
        <div
          id="mobile-menu"
          ref={mobileMenuRef}
          className="border-b border-neutral-200 bg-neutral-50 lg:hidden"
        >
          {/* 44px touch targets for every link in the mobile menu. */}
          <div className="container space-y-0.5 py-3 [&_.ui-nav-item]:flex [&_.ui-nav-item]:min-h-11 [&_.ui-nav-item]:items-center">
            <NavbarLinks user={user} onClose={closeMenu} />
            {user ? (
              <>
                <div className="my-2 border-t border-neutral-200 lg:hidden" />
                <NavItem to="/documents" onClick={closeMenu}>
                  Dokument
                </NavItem>
                <NavItem to="/revisions" onClick={closeMenu}>
                  Revisioner
                </NavItem>
                {canManageGroups(user) ? (
                  <NavItem to="/admin/groups" onClick={closeMenu}>
                    Grupper
                  </NavItem>
                ) : null}
                {(user.roles ?? []).includes("Admin") ? (
                  <NavItem to="/admin/membership-payments" onClick={closeMenu}>
                    Medlemsavgifter
                  </NavItem>
                ) : null}
                {canManageGroups(user) ? (
                  <NavItem to="/admin/event-payments" onClick={closeMenu}>
                    Mötesavgifter
                  </NavItem>
                ) : null}
                <div className="my-2 border-t border-neutral-200" />
                <NavbarUserMenu
                  countdown={countdown}
                  onLogoutClick={handleLogoutClick}
                  onClose={closeMenu}
                  mobile
                />
              </>
            ) : (
              <>
                <div className="my-2 border-t border-neutral-200" />
                <NavItem to="/login" onClick={closeMenu}>
                  Logga in
                </NavItem>
              </>
            )}
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        title="Logga ut?"
        variant="primary"
        confirmLabel="Logga ut"
        pendingLabel="Loggar ut…"
        pending={loggingOut}
        onConfirm={() => void handleLogout()}
      />
    </header>
  );
};

export default Navbar;
