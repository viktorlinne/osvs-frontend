import { Outlet } from "react-router";
import { Navbar, Footer } from "../components";

export function AppLayout() {
  return (
    <div className="flex flex-col">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
}
