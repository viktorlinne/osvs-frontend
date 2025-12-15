import { NavLink } from "react-router";

export const Navbar = () => {
  return (
    <nav className="flex gap-4 p-4 bg-gray-100">
      <NavLink className="p-2 rounded bg-green-600 hover:bg-green-700 transition text-white" to="/">Hem</NavLink>
      <NavLink className="p-2 rounded bg-green-600 hover:bg-green-700 transition text-white" to="/about">Om VS</NavLink>
      <NavLink className="p-2 rounded bg-green-600 hover:bg-green-700 transition text-white" to="/gdpr">GDPR</NavLink>
      <NavLink className="p-2 rounded bg-green-600 hover:bg-green-700 transition text-white" to="/contact">Kontakt</NavLink>
      <NavLink className="p-2 rounded bg-green-600 hover:bg-green-700 transition text-white" to="/login">Logga In</NavLink>
    </nav>
  );
};
