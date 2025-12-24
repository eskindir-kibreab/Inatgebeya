import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useCart } from "../../context/CartContext";
import CartItem from "../../components/cart/CartItem";
import CartSummary from "../../components/cart/CartSummary";
import EmptyState from "../../components/feedback/EmptyState";

const Cart = () => {
  const { cartItems, clearCart, getCartCount, getCartTotal } = useCart();
  const navigate = useNavigate();
  const cartCount = getCartCount();
  const cartTotal = getCartTotal();

  if (cartCount === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <EmptyState
          type="cart"
          actionText="Start Shopping"
          onAction={() => navigate("/")}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-main dark:text-gray-200">
          Shopping Cart
        </h1>
        <p className="text-text-secondary dark:text-gray-400 mt-2">
          You have {cartCount} {cartCount === 1 ? "item" : "items"} in your cart
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div
            className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                         dark:border-gray-700 overflow-hidden"
          >
            <div className="p-6 border-b border-border-default dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-text-main dark:text-gray-200">
                  Cart Items ({cartCount})
                </h2>
                <button
                  onClick={clearCart}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 
                           text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Cart
                </button>
              </div>
            </div>

            <div className="divide-y divide-border-default dark:divide-gray-700">
              {cartItems.map((item, index) => (
                <div key={`${item.id}-${item.size}-${index}`} className="p-6">
                  <CartItem item={item} />
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-border-default dark:border-gray-700">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-primary 
                         hover:text-primary-hover font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Note */}
          <div
            className="mt-6 bg-white dark:bg-gray-800 rounded-xl border 
                         border-border-default dark:border-gray-700 p-6"
          >
            <h3 className="font-semibold text-text-main dark:text-gray-200 mb-4">
              Add Order Note
            </h3>
            <textarea
              placeholder="Add special instructions for your order..."
              className="w-full h-32 px-4 py-3 border border-border-default 
                       dark:border-gray-700 rounded-lg resize-none 
                       focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        {/* Cart Summary */}
        <div className="space-y-4">
          <CartSummary />

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-border-default dark:border-gray-700 p-6">
            <Link
              to="/checkout"
              className={`w-full py-3 rounded-lg font-medium text-center block ${
                cartCount === 0
                  ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-primary hover:bg-primary-hover text-white"
              }`}
              onClick={(e) => cartCount === 0 && e.preventDefault()}
            >
              Continue to Checkout
            </Link>
            <p className="text-xs text-text-muted mt-2 text-center">
              Review your order details before proceeding
            </p>
          </div>

          {/* Promo Code */}
          <div
            className="mt-6 bg-white dark:bg-gray-800 rounded-xl border 
                         border-border-default dark:border-gray-700 p-6"
          >
            <h3 className="font-semibold text-text-main dark:text-gray-200 mb-4">
              Apply Promo Code
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter promo code"
                className="flex-1 px-4 py-3 border border-border-default 
                         dark:border-gray-700 rounded-lg focus:outline-none 
                         focus:ring-2 focus:ring-accent"
              />
              <button
                className="px-6 py-3 border border-primary text-primary 
                               hover:bg-primary/10 rounded-lg font-medium"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Need Help */}
          <div
            className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border 
                         border-blue-200 dark:border-blue-800 p-6"
          >
            <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
              Need Help?
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-400 mb-4">
              Have questions about your order or need assistance?
            </p>
            <div className="space-y-2">
              <a
                href="tel:+251900123456"
                className="block text-blue-600 dark:text-blue-400 hover:underline"
              >
                📞 Call: +251 900 123 456
              </a>
              <a
                href="mailto:support@inatgebeya.com"
                className="block text-blue-600 dark:text-blue-400 hover:underline"
              >
                ✉️ Email: support@inatgebeya.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
