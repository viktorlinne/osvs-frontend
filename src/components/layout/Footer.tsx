import { NavLink } from "react-router-dom";
import { useAuth } from "../../context";

export const Footer: React.FC = () => {
  const { user } = useAuth();

  return (
    <footer className="bg-white border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start text-gray-700">
          <div className="text-center md:text-left">
            <NavLink to="/" className="text-lg font-bold text-green-700">
              OSVS
            </NavLink>
            <p className="text-sm mt-2">
              &copy; {new Date().getFullYear()} Ordensamfundet VS
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex flex-wrap justify-center gap-2">
              <NavLink
                to="/"
                className="px-3 py-1 text-sm rounded-md hover:bg-gray-100"
              >
                Hem
              </NavLink>
              <NavLink
                to="/about"
                className="px-3 py-1 text-sm rounded-md hover:bg-gray-100"
              >
                Om VS
              </NavLink>
              <NavLink
                to="/gdpr"
                className="px-3 py-1 text-sm rounded-md hover:bg-gray-100"
              >
                GDPR
              </NavLink>
              <NavLink
                to="/contact"
                className="px-3 py-1 text-sm rounded-md hover:bg-gray-100"
              >
                Kontakt
              </NavLink>
              {user ? (
                <>
                  <NavLink
                    to="/news"
                    className="px-3 py-1 text-sm rounded-md hover:bg-gray-100"
                  >
                    Nyheter
                  </NavLink>
                  <NavLink
                    to="/members"
                    className="px-3 py-1 text-sm rounded-md hover:bg-gray-100"
                  >
                    Medlemmar
                  </NavLink>
                  <NavLink
                    to="/lodges"
                    className="px-3 py-1 text-sm rounded-md hover:bg-gray-100"
                  >
                    Lodger
                  </NavLink>
                </>
              ) : null}
            </div>
          </div>

          <div className="text-center md:text-right">
            <a
              href="mailto:info@osvs.se"
              className="block text-sm hover:underline"
            >
              info@osvs.se
            </a>
            <a
              href="http://www.osvs.se"
              className="block text-sm hover:underline"
            >
              osvs.se
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
