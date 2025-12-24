import { ROLES } from "./constants";

/**
 * Get the default route for a user based on their role
 * @param {string} role - The user's role
 * @returns {string} - The default route path for the role
 */
export const getDefaultRoute = (role) => {
  switch (role) {
    case ROLES.SUPER_ADMIN:
    case ROLES.ADMIN:
      return "/admin/dashboard";
    
    case ROLES.ITEM_ADDER_ADMIN:
      return "/item-adder/dashboard";
    
    case ROLES.SHOP_OWNER:
      return "/shop-owner/dashboard";
    
    case ROLES.DELIVERY_ADMIN:
      return "/delivery-admin/dashboard";
    
    case ROLES.DELIVERY_PERSON:
      return "/delivery-person/dashboard";
    
    case ROLES.USER:
    default:
      return "/";
  }
};

/**
 * Check if a user has one of the required roles
 * @param {string} userRole - The user's role
 * @param {string[]} requiredRoles - Array of allowed roles
 * @returns {boolean} - True if user has one of the required roles
 */
export const hasRequiredRole = (userRole, requiredRoles = []) => {
  if (!requiredRoles || requiredRoles.length === 0) return true;
  return requiredRoles.includes(userRole);
};

