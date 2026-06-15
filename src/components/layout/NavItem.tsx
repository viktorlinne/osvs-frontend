import React from "react";
import { NavLink } from "react-router-dom";

export function NavItem({
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

export default NavItem;
