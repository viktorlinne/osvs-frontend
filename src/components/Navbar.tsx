import { NavLink } from "react-router";

export const Navbar = () => {
  return (
    <nav className="">
      <NavLink to="/">Home</NavLink>
      <NavLink to="/about">About</NavLink>
      <NavLink to="/gdpr">GDPR</NavLink>
      <NavLink to="/contact">Contact</NavLink>
      <NavLink to="/login">Login</NavLink>
    </nav>
  );
};
