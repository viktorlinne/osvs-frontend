import React from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../context";
import { Spinner } from "../components";

type Props = {
  children: React.ReactElement;
  /** Required roles — user must have at least one of these to access */
  roles?: string | string[];
};

export default function AuthGuard({ children, roles }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div><Spinner /></div>;

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
