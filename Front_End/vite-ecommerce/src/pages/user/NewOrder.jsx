import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { ordersAPI } from "../../api/orders.api";
import { paymentsAPI } from "../../api/payments.api";
import { CheckCircle, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import CartSummary from "../../components/cart/CartSummary";
import Button from "../../components/forms/Button";

const NewOrder = () => {
  const { cartItems, getCartTotal, getCartCount, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mobile_banking");
  const [orderNote, setOrderNote] = useState("");

  // Load user's default shipping address if available
  useEffect(() => {
    if (user?.shippingAddress) {
      setShippingAddress(user.shippingAddress);
    }
  }, [user]);

  // Redirect if cart is empty
  useEffect(() => {
    if (getCartCount() === 0) {
      toast.error("Your cart is empty");
      navigate("/cart");
    }
  }, [getCartCount, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!shippingAddress) {
      toast.error("Please provide a shipping address");
      return;
    }

    // MANDATORY: Check for profile completion (Phone, ID Number, ID Image)
    const hasPhone = !!user?.phone;
    const hasIDNumber = !!user?.identification?.fan_number;
    const hasIDImage = !!user?.identification?.id_image_url;

    if (!hasPhone || !hasIDNumber || !hasIDImage) {
      toast.error("Please complete your profile (Phone, National ID, and ID Image) before ordering.");
      navigate("/profile");
      return;
    }

    // Check if cart is empty
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setLoading(true);

    try {
      // Group items by shop_id
      const ordersByShop = {};

      cartItems.forEach((item) => {
        const shopId = item.shop_id || 1; // Default to 1 if shop_id is not available
        if (!ordersByShop[shopId]) {
          ordersByShop[shopId] = {
            shop_id: shopId,
            delivery_address: shippingAddress,
            items: [],
          };
        }

        ordersByShop[shopId].items.push({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
          size_id: item.size_id || 1, // Default to 1 if size_id is not available
        });
      });

      // Create an order for each shop
      const orderPromises = Object.values(ordersByShop).map((orderData) => {
        return ordersAPI.create(orderData);
      });

      // Wait for all orders to be created
      const responses = await Promise.all(orderPromises);

      // Check if all orders were created successfully
      const allSuccessful = responses.every((response) => response?.success);

      if (allSuccessful) {
        // If it's a mobile banking order, we need to initialize Chapa
        if (paymentMethod === "mobile_banking") {
          toast.loading("Initializing secure payment...");
          try {
            // Initialize using the first order ID (assuming single payment session for multiple shop orders)
            // Note: In a multi-vendor split, typically we pay only for one or handle split payments.
            // Current implementation takes the first order.
            const firstOrderId = responses[0].data.orderId || responses[0].data.id;

            const payment = await paymentsAPI.initialize(firstOrderId);

            if (payment.success && payment.data.checkout_url) {
              clearCart();
              window.location.href = payment.data.checkout_url;
              return; // Stop execution as we are redirecting
            } else {
              throw new Error("Failed to get checkout URL from payment gateway");
            }
          } catch (payError) {
            console.error("Payment init error:", payError);
            const errMsg = payError.response?.data?.message || payError.message || "Payment initialization failed.";
            toast.error(`Order created, but payment failed: ${errMsg}`);
            // Fallback: navigate to orders page so user can retry payment from there
            navigate("/orders");
            return;
          }
        }

        // Clear the cart after successful order (for non-payment methods)
        clearCart();
        // Show success message
        toast.success("Order placed successfully!");
        // Redirect to orders page
        navigate("/orders");
      } else {
        throw new Error("Some orders could not be placed. Please try again.");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error(error.message || "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (getCartCount() === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Your cart is empty
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Add some items to your cart before proceeding to checkout.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Checkout
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Complete your order
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Form */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Shipping Information
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label
                  htmlFor="shipping-address"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Shipping Address
                </label>
                <textarea
                  id="shipping-address"
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-white text-black"
                  placeholder="Enter your full shipping address"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  required
                />
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Payment Method
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      id="mobile-banking"
                      name="payment-method"
                      type="radio"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                      checked={paymentMethod === "mobile_banking"}
                      onChange={() => setPaymentMethod("mobile_banking")}
                    />
                    <label
                      htmlFor="mobile-banking"
                      className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Mobile Banking
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="credit-card"
                      name="payment-method"
                      type="radio"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                      checked={paymentMethod === "credit_card"}
                      onChange={() => setPaymentMethod("credit_card")}
                      disabled
                    />
                    <label
                      htmlFor="credit-card"
                      className="ml-3 block text-sm font-medium text-gray-500 dark:text-gray-400"
                    >
                      Credit/Debit Card (Coming Soon)
                    </label>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label
                  htmlFor="order-notes"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Order Notes (Optional)
                </label>
                <textarea
                  id="order-notes"
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-white text-black"
                  placeholder="Special instructions for your order..."
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                />
              </div>

              <div className="mt-8 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Cart
                </button>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || getCartCount() === 0}
                  className="px-8 py-3 text-base"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="-ml-1 mr-2 h-5 w-5" />
                      Place Order
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Need Help?
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Have questions about your order or need assistance? Our customer
              service team is here to help.
            </p>
            <div className="space-y-2">
              <a
                href="tel:+251900123456"
                className="flex items-center text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                +251 900 123 456
              </a>
              <a
                href="mailto:support@inatgebeya.com"
                className="flex items-center text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                support@inatgebeya.com
              </a>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 sticky top-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Order Summary
            </h2>

            <CartSummary />

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Secure Payment
              </h3>
              <div className="flex space-x-2">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                  <svg
                    className="h-6 w-6 text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11V11.99z" />
                  </svg>
                </div>
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                  <svg
                    className="h-6 w-6 text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                  </svg>
                </div>
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                  <svg
                    className="h-6 w-6 text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.97 1.39 2.8 3.35 3.31 1.55.4 2.14.9 2.14 1.75 0 .56-.47 1.14-1.85 1.14-1.53 0-2.08-.75-2.18-1.67H8.13c.1 1.46 1.12 2.4 2.77 2.75V19h2.34v-1.73c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.38z" />
                  </svg>
                </div>
              </div>

              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                Your personal data will be used to process your order, support
                your experience throughout this website, and for other purposes
                described in our privacy policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewOrder;
