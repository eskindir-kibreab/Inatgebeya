import React, { useEffect } from "react";
import { Navigate, useNavigationType } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PageLoader from "./PageLoader";
import { getDefaultRoute } from "../../utils/navigation";
import { ROLES } from "../../utils/constants";

/**
 * PublicRoute component that redirects authenticated users with specific roles
 * to their dashboards, while allowing regular users and unauthenticated users
 * to access public pages.
 * 
 * Special handling: If an authenticated user navigates back (POP) to a public 
 * route (like Login/Register), it triggers a logout for security.
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, role, loading, logout } = useAuth();
  const navigationType = useNavigationType();

  useEffect(() => {
    // If authenticated and the user hits the "Back" button (POP) to get to a public route
    if (isAuthenticated && navigationType === "POP") {
      logout("Please login again");
    }
  }, [isAuthenticated, navigationType, logout]);

  if (loading) {
    return <PageLoader />;
  }

  // If authenticated and has a role that should redirect to dashboard (not regular user)
  // Only redirect if NOT a POP navigation (to allow the logout effect above to run)
  if (isAuthenticated && role && role !== ROLES.USER && navigationType !== "POP") {
    const defaultRoute = getDefaultRoute(role);
    return <Navigate to={defaultRoute} replace />;
  }

  return children;
};

export default PublicRoute;

