import React from "react";
import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";

export default function AuthGuard({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
