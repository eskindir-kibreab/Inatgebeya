import React from "react";
import { Toaster } from "react-hot-toast";
import Header from "./components/layout/Header";
import CategoryBar from "./components/layout/CategoryBar";
import Footer from "./components/layout/Footer";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ThemeProvider } from "./context/ThemeContext";

const AppLayout = () => {
  const { role } = useAuth();

  // Show CategoryBar only for guests and regular users
  const showCategoryBar = !role || role === "user";

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Header />
      {showCategoryBar && <CategoryBar />}

      <main className="flex-1 container mx-auto px-4 py-8">
        <AppRoutes />
      </main>

      <Footer />

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            style: {
              background: "#10B981",
            },
          },
          error: {
            style: {
              background: "#EF4444",
            },
          },
        }}
      />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <AppLayout />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
