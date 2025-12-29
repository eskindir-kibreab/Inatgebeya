import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PageLoader from "../components/layout/PageLoader";
import ProtectedRoute from "../components/layout/ProtectedRoute";
import PublicRoute from "../components/layout/PublicRoute";

// Public pages
const Landing = lazy(() => import("../pages/public/Landing.jsx"));
const Login = lazy(() => import("../pages/public/Login.jsx"));
const Register = lazy(() => import("../pages/public/Register.jsx"));
const ForgotPassword = lazy(() => import("../pages/public/ForgotPassword"));
const VerifyOTP = lazy(() => import("../pages/public/VerifyOTP"));
const ResetPassword = lazy(() => import("../pages/public/ResetPassword"));
const Search = lazy(() => import("../pages/public/Search.jsx"));
const Shop = lazy(() => import("../pages/public/Shop.jsx"));
const ProductDetail = lazy(() => import("../pages/public/ProductDetail.jsx"));

// User pages
const Cart = lazy(() => import("../pages/user/Cart.jsx"));
const Checkout = lazy(() => import("../pages/user/Checkout.jsx"));
const OrderTracking = lazy(() => import("../pages/user/OrderTracking.jsx"));
const Profile = lazy(() => import("../pages/user/Profile.jsx"));
const Orders = lazy(() => import("../pages/user/Orders.jsx"));
const NewOrder = lazy(() => import("../pages/user/NewOrder.jsx"));

// Admin pages
const AdminDashboard = lazy(() => import("../pages/admin/Dashboard.jsx"));
const AdminUsers = lazy(() => import("../pages/admin/Users.jsx"));
const AdminCategories = lazy(() => import("../pages/admin/Categories.jsx"));
const AdminProducts = lazy(() => import("../pages/admin/Products.jsx"));
const AdminDeliveries = lazy(() => import("../pages/admin/Deliveries.jsx"));
const AdminTeam = lazy(() => import("../pages/admin/Team.jsx"));
const AdminAssign = lazy(() => import("../pages/admin/AdminAssign.jsx"));
const AdminProductDetail = lazy(() =>
  import("../pages/admin/AdminProductDetail.jsx")
);
const AdminShops = lazy(() => import("../pages/admin/Shops.jsx"));
const AdminAreas = lazy(() => import("../pages/admin/Areas.jsx"));


// Shop Owner pages
const ShopOwnerDashboard = lazy(() =>
  import("../pages/shop-owner/Dashboard.jsx")
);
const ShopOwnerInventory = lazy(() =>
  import("../pages/shop-owner/Inventory.jsx")
);
const ShopOwnerReturns = lazy(() => import("../pages/shop-owner/Returns.jsx"));

// Delivery Admin pages (keeping these for backward compatibility)
const DeliveryAdminDashboard = lazy(() =>
  import("../pages/admin/Dashboard.jsx")
);
const DeliveryAdminTeam = lazy(() => import("../pages/admin/Team.jsx"));
const DeliveryAdminAssign = lazy(() =>
  import("../pages/admin/AdminAssign.jsx")
);

// Delivery Person pages
const DeliveryPersonDashboard = lazy(() =>
  import("../pages/delivery-person/Dashboard.jsx")
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Landing />
            </PublicRoute>
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/search" element={<Search />} />
        <Route path="/shops/:shopId" element={<Shop />} />
        <Route path="/products/:productId" element={<ProductDetail />} />

        {/* User Routes */}
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:orderId"
          element={
            <ProtectedRoute>
              <OrderTracking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/new"
          element={
            <ProtectedRoute>
              <NewOrder />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute roles={["admin", "super_admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={["admin", "super_admin"]}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute roles={["admin", "super_admin"]}>
              <AdminCategories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute roles={["admin", "super_admin"]}>
              <AdminProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products/:productId"
          element={
            <ProtectedRoute roles={["admin", "super_admin"]}>
              <AdminProductDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/deliveries"
          element={
            <ProtectedRoute roles={["admin", "super_admin"]}>
              <AdminDeliveries />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/shops"
          element={
            <ProtectedRoute roles={["admin", "super_admin"]}>
              <AdminShops />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/areas"
          element={
            <ProtectedRoute roles={["admin", "super_admin"]}>
              <AdminAreas />
            </ProtectedRoute>
          }
        />



        {/* Shop Owner Routes */}
        <Route
          path="/shop-owner/dashboard"
          element={
            <ProtectedRoute roles={["shop_owner"]}>
              <ShopOwnerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shop-owner/inventory"
          element={
            <ProtectedRoute roles={["shop_owner"]}>
              <ShopOwnerInventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shop-owner/returns"
          element={
            <ProtectedRoute roles={["shop_owner"]}>
              <ShopOwnerReturns />
            </ProtectedRoute>
          }
        />

        {/* Delivery Management Routes - Now under Admin */}
        <Route
          path="/admin/team"
          element={
            <ProtectedRoute roles={["admin", "super_admin"]}>
              <AdminTeam />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/assign"
          element={
            <ProtectedRoute roles={["admin", "super_admin"]}>
              <AdminAssign />
            </ProtectedRoute>
          }
        />

        {/* Delivery Person Routes */}
        <Route
          path="/delivery-person/dashboard"
          element={
            <ProtectedRoute roles={["delivery_person"]}>
              <DeliveryPersonDashboard />
            </ProtectedRoute>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
