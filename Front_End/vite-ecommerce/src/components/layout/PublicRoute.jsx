import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PageLoader from "./PageLoader";
import { getDefaultRoute } from "../../utils/navigation";
import { ROLES } from "../../utils/constants";

/**
 * PublicRoute component that redirects authenticated users with specific roles
 * to their dashboards, while allowing regular users and unauthenticated users
 * to access public pages.
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  // If authenticated and has a role that should redirect to dashboard (not regular user)
  if (isAuthenticated && role && role !== ROLES.USER) {
    const defaultRoute = getDefaultRoute(role);
    return <Navigate to={defaultRoute} replace />;
  }

  return children;
};

export default PublicRoute;

