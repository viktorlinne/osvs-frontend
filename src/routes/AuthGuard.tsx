import React from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../context";

type Props = {
  children: React.ReactElement;
  /** Required roles — user must have at least one of these to access */
  roles?: string | string[];
};

export default function AuthGuard({ children, roles }: Props) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // not authenticated — redirect to login and preserve attempted path
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles) {
    const required = Array.isArray(roles) ? roles : [roles];
    const userRoles = user.roles ?? [];
    const has = required.some((r) => userRoles.includes(r));
    if (!has) {
      return <Navigate to="/login" replace state={{ from: location }} />;
    }
  }

  return children;
}
