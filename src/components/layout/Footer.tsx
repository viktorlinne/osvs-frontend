import { NavLink } from "react-router-dom";
import { useAuth } from "../../context";

export const Footer: React.FC = () => {
  const { user } = useAuth();
  const footerLinkClass =
    "rounded-md px-3 py-1 text-sm text-neutral-700 transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2";

  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="container py-8">
        <div className="grid grid-cols-1 items-start gap-6 text-neutral-700 md:grid-cols-3">
          <div className="text-center md:text-left">
            <NavLink
              to="/"
              className="text-lg font-bold text-primary-600 transition hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
            >
              OSVS
            </NavLink>
            <p className="mt-2 text-sm">
              &copy; {new Date().getFullYear()} Ordensamfundet VS
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex flex-wrap justify-center gap-2">
              <NavLink to="/" className={footerLinkClass}>
                Hem
              </NavLink>
              <NavLink to="/about" className={footerLinkClass}>
                Om VS
              </NavLink>
              <NavLink to="/lodges" className={footerLinkClass}>
                Loger
              </NavLink>
              <NavLink to="/gdpr" className={footerLinkClass}>
                GDPR
              </NavLink>
              <NavLink to="/contact" className={footerLinkClass}>
                Kontakt
              </NavLink>

              {user ? (
                <>
                  <NavLink to="/posts" className={footerLinkClass}>
                    Nyheter
                  </NavLink>
                  <NavLink to="/events" className={footerLinkClass}>
                    Möten
                  </NavLink>
                  <NavLink to="/members" className={footerLinkClass}>
                    Medlemmar
                  </NavLink>
                  <NavLink to="/revisions" className={footerLinkClass}>
                    Revisioner
                  </NavLink>
                  <NavLink to="/documents" className={footerLinkClass}>
                    Dokument
                  </NavLink>
                </>
              ) : null}
            </div>
          </div>

          <div className="text-center md:text-right">
            <a
              href="mailto:info@osvs.se"
              className="block text-sm transition hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
            >
              info@osvs.se
            </a>
            <a
              href="http://www.osvs.se"
              className="mt-2 block text-sm transition hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
            >
              osvs.se
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
