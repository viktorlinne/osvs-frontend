import { useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useAuth, useError } from "../context";
import { Navbar, Footer } from "../components";
import {
  registerUnauthorizedHandler,
  unregisterUnauthorizedHandler,
} from "../services/globalAuth";

export function AppLayout() {
  const { clearUser } = useAuth();
  const { setError } = useError();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectingRef = useRef(false);

  useEffect(() => {
    if (location.pathname === "/login") {
      redirectingRef.current = false;
    }
  }, [location.pathname]);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      setError("Vänligen logga in");
      clearUser();
      if (location.pathname === "/login") return;
      if (redirectingRef.current) return;
      redirectingRef.current = true;
      navigate("/login", {
        replace: true,
        state: {
          from: {
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
          },
        },
      });
    });
    return () => unregisterUnauthorizedHandler();
  }, [
    setError,
    clearUser,
    navigate,
    location.pathname,
    location.search,
    location.hash,
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
