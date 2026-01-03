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
const ComingSoon = lazy(() => import("../pages/public/ComingSoon.jsx"));
const AboutUs = lazy(() => import("../pages/public/AboutUs.jsx"));
const PrivacyPolicy = lazy(() => import("../pages/public/PrivacyPolicy.jsx"));
const TermsAndConditions = lazy(() =>
  import("../pages/public/TermsAndConditions.jsx")
);

// User pages
const Cart = lazy(() => import("../pages/user/Cart.jsx"));
const Checkout = lazy(() => import("../pages/user/Checkout.jsx"));
const OrderDetail = lazy(() => import("../pages/common/OrderDetail.jsx"));
const Profile = lazy(() => import("../pages/user/Profile.jsx"));
const Orders = lazy(() => import("../pages/user/Orders.jsx"));
const NewOrder = lazy(() => import("../pages/user/NewOrder.jsx"));
const PaymentSuccess = lazy(() => import("../pages/user/PaymentSuccess.jsx"));

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
const AdminOrders = lazy(() => import("../pages/admin/Orders.jsx"));

// Shop Owner pages
const ShopOwnerDashboard = lazy(() =>
  import("../pages/shop-owner/Dashboard.jsx")
);
const ShopOwnerOrders = lazy(() =>
  import("../pages/shop-owner/Orders.jsx")
);
const ShopOwnerProducts = lazy(() =>
  import("../pages/shop-owner/Products.jsx")
);
const ShopOwnerProductDetail = lazy(() =>
  import("../pages/shop-owner/ShopProductDetail.jsx")
);

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
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/verify-otp"
          element={
            <PublicRoute>
              <VerifyOTP />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route path="/coming-soon" element={<ComingSoon />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/contact" element={<ComingSoon />} />

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
              <OrderDetail />
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
        <Route
          path="/checkout/success"
          element={
            <ProtectedRoute>
              <PaymentSuccess />
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
          path="/admin/orders"
          element={
            <ProtectedRoute roles={["admin", "super_admin"]}>
              <AdminOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders/:orderId"
          element={
            <ProtectedRoute roles={["admin", "super_admin"]}>
              <OrderDetail />
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
          path="/shop-owner/orders/:orderId"
          element={
            <ProtectedRoute roles={["shop_owner"]}>
              <OrderDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shop-owner/orders"
          element={
            <ProtectedRoute roles={["shop_owner"]}>
              <ShopOwnerOrders />
            </ProtectedRoute>
          }
        />
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
              <ShopOwnerProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shop-owner/inventory/:productId"
          element={
            <ProtectedRoute roles={["shop_owner"]}>
              <ShopOwnerProductDetail />
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
