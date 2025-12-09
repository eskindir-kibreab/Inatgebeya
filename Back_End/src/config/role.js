const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  ITEM_ADDER_ADMIN: "item_adder_admin",
  SHOP_OWNER: "shop_owner",
  DELIVERY_ADMIN: "delivery_admin",
  DELIVERY_PERSON: "delivery_person",
  USER: "user",
};

const hierarchy = {
  super_admin: 7,
  admin: 6,
  delivery_admin: 5,
  item_adder_admin: 4,
  shop_owner: 3,
  delivery_person: 2,
  user: 1,
};

export const hasPermission = (userRole, requiredRole) => {
  return hierarchy[userRole] >= hierarchy[requiredRole];
};

export const getRoleHierarchy = () => hierarchy;
export const getRoles = () => ROLES;

export default {
  ...ROLES,
  hasPermission,
  getRoleHierarchy,
  getRoles,
};
