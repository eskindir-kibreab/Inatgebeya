export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  DELIVERY_ADMIN: "delivery_admin",
  ITEM_ADDER_ADMIN: "item_adder_admin",
  SHOP_OWNER: "shop_owner",
  DELIVERY_PERSON: "delivery_person",
  USER: "user",
};

export const ORDER_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  DELIVERING: "delivering",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

export const DELIVERY_STATUS = {
  ASSIGNED: "assigned",
  PICKED: "picked",
  DELIVERED: "delivered",
  RETURNED: "returned",
};

export const PAYMENT_METHODS = [
  { value: "cash_on_delivery", label: "Cash on Delivery" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "mobile_banking", label: "Mobile Banking" },
];

export const CATEGORIES = [
  { id: 1, name: "All", icon: "🛍️" },
  { id: 2, name: "Clothing", icon: "👕" },
  { id: 3, name: "Food", icon: "🍎" },
  { id: 4, name: "Electronics", icon: "📱" },
  { id: 5, name: "Home & Garden", icon: "🏠" },
  { id: 6, name: "Beauty", icon: "💄" },
  { id: 7, name: "Sports", icon: "⚽" },
  { id: 8, name: "Books", icon: "📚" },
];
