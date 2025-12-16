import React from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";

type Props = {
  children: React.ReactElement;
  /** Required roles — user must have at least one of these to access */
  roles?: string | string[];
};

export default function AuthGuard({ children, roles }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    // not authenticated — redirect to login and preserve attempted path
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles) {
    const required = Array.isArray(roles) ? roles : [roles];
    const userRoles = (user as any)?.roles ?? [];
    const has = required.some((r) => userRoles.includes(r));
    if (!has) {
      // Authenticated but missing required role — redirect to login (or show 403 page)
      return <Navigate to="/login" replace state={{ from: location }} />;
    }
  }

  return children;
}
