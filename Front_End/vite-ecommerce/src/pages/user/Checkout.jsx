import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, CreditCard, Shield } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { ordersAPI } from "../../api/orders.api";
import { useAuth } from "../../context/AuthContext";
import Input from "../../components/forms/Input";
import Select from "../../components/forms/Select";
import Button from "../../components/forms/Button";
import toast from "react-hot-toast";
import PaymentModal from "../../components/checkout/PaymentModal";

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [newAddress, setNewAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cash_on_delivery");
  const [orderNote, setOrderNote] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const subtotal = getCartTotal();
  const shipping = subtotal > 10000 ? 0 : 50;
  const tax = subtotal * 0.15;
  const total = subtotal + shipping + tax;

  useEffect(() => {
    // TODO: Integrate real saved addresses API when available.
    // For now, start with an empty list and let the user add addresses.
    setAddresses([]);
  }, []);

  const handlePlaceOrder = async (isSimulatedPay = false) => {
    if (!selectedAddress && !newAddress.street) {
      toast.error("Please select or enter a delivery address");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    // If mobile banking and not yet simulated, show modal first
    console.log("Payment method:", paymentMethod, "isSimulatedPay:", isSimulatedPay);
    if ((paymentMethod === 'mobile_banking' || paymentMethod === 'bank_transfer') && !isSimulatedPay) {
      console.log("Should show payment modal!");
      setShowPaymentModal(true);
      return;
    }

    setLoading(true);
    try {
      // DEBUG: Check the items being processed
      const debugItems = cartItems.map(i => ({ id: i.id, type: typeof i.id, product_id: i.product_id }));
      console.log("Debug Items:", debugItems);
      // NOTE: Remove this visible debugging after fixing
      // setVisibleError(`Debug Items: ${JSON.stringify(debugItems)}`); 


      // Group items by shop
      const itemsByShop = {};
      cartItems.forEach((item) => {
        console.log("Processing cart item:", JSON.stringify(item, null, 2));
        console.log("item.id:", item.id, "typeof:", typeof item.id);
        if (!itemsByShop[item.shop_id]) {
          itemsByShop[item.shop_id] = [];
        }

        // Ensure product ID is valid
        const pId = parseInt(item.id);
        if (isNaN(pId)) {
          throw new Error(`Invalid Product ID for item: ${item.name || 'Unknown'}`);
        }

        itemsByShop[item.shop_id].push({
          product_id: pId,
          quantity: parseInt(item.quantity) || 1,
          price: parseFloat(item.price),
          size_id: item.size_id ? parseInt(item.size_id) : null,
        });
      });

      console.log("Items by shop:", itemsByShop);

      // Create orders for each shop
      const orderPromises = Object.entries(itemsByShop).map(
        ([shopId, items]) => {
          const deliveryAddress = selectedAddress
            ? addresses.find((addr) => addr.id === selectedAddress)?.address
            : `${newAddress.street}, ${newAddress.city}`;

          return ordersAPI.create({
            shop_id: parseInt(shopId),
            delivery_address: deliveryAddress,
            items,
            payment_method: paymentMethod,
          });
        }
      );

      const results = await Promise.all(orderPromises);
      const allSuccess = results.every((result) => result.success);

      if (allSuccess) {
        toast.success("Order placed successfully!");
        clearCart();
        navigate("/orders");
      } else {
        toast.error("Some orders failed to process");
      }
    } catch (error) {
      console.error("Place order error details:", error.response?.data || error);
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || "Failed to place order.";

      if (errorData?.errors && Array.isArray(errorData.errors)) {
        // Detailed validation error (e.g. from express-validator)
        const detailedMsg = errorData.errors.map(e => e.msg).join(", ");
        toast.error(`Error: ${detailedMsg}`);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewAddress = () => {
    if (newAddress.street && newAddress.city) {
      const newAddr = {
        id: Date.now().toString(),
        name: "New Address",
        address: `${newAddress.street}, ${newAddress.city}, ${newAddress.state} ${newAddress.zipCode}`,
      };
      setAddresses([...addresses, newAddr]);
      setSelectedAddress(newAddr.id);
      setNewAddress({ street: "", city: "", state: "", zipCode: "" });
      toast.success("Address added successfully");
    } else {
      toast.error("Please enter street address and city");
    }
  };

  const formatCurrency = (amount) => {
    return `ETB ${amount.toLocaleString()}`;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-main dark:text-gray-200">
          Checkout
        </h1>
        <div className="flex items-center gap-2 mt-2 text-text-secondary dark:text-gray-400">
          <Shield className="w-5 h-5 text-status-success" />
          <span>Secure checkout powered by SSL encryption</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div
            className="bg-white dark:bg-gray-800 rounded-xl border 
                         border-border-default dark:border-gray-700 p-6"
          >
            <h2 className="text-xl font-semibold text-text-main dark:text-gray-200 mb-4">
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Full Name" value={user?.full_name || ""} readOnly />
              <Input label="Email" value={user?.email || ""} readOnly />
              <Input
                label="Phone Number"
                value={user?.phone || "Not provided"}
                readOnly
              />
            </div>
          </div>

          {/* Shipping Address */}
          <div
            className="bg-white dark:bg-gray-800 rounded-xl border 
                         border-border-default dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-text-main dark:text-gray-200">
                Shipping Address
              </h2>
              <MapPin className="w-5 h-5 text-primary" />
            </div>

            {/* Saved Addresses */}
            <div className="mb-6">
              <h3 className="font-medium text-text-main dark:text-gray-200 mb-3">
                Select Address
              </h3>
              <div className="space-y-3">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    onClick={() => setSelectedAddress(address.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors
                              ${selectedAddress === address.id
                        ? "border-primary bg-primary/5"
                        : "border-border-default dark:border-gray-700 hover:border-primary"
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                                    ${selectedAddress === address.id
                            ? "border-primary bg-primary"
                            : "border-border-default dark:border-gray-700"
                          }`}
                      >
                        {selectedAddress === address.id && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-text-main dark:text-gray-200">
                          {address.name}
                        </p>
                        <p className="text-text-secondary dark:text-gray-400">
                          {address.address}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* New Address Form */}
            <div>
              <h3 className="font-medium text-text-main dark:text-gray-200 mb-4">
                Or Add New Address
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Input
                  label="Street Address"
                  value={newAddress.street}
                  onChange={(e) =>
                    setNewAddress((prev) => ({
                      ...prev,
                      street: e.target.value,
                    }))
                  }
                  placeholder="Enter street address"
                />
                <Input
                  label="City"
                  value={newAddress.city}
                  onChange={(e) =>
                    setNewAddress((prev) => ({ ...prev, city: e.target.value }))
                  }
                  placeholder="Enter city"
                />
                <Input
                  label="State/Region"
                  value={newAddress.state}
                  onChange={(e) =>
                    setNewAddress((prev) => ({
                      ...prev,
                      state: e.target.value,
                    }))
                  }
                  placeholder="Enter state/region"
                />
                <Input
                  label="ZIP Code"
                  value={newAddress.zipCode}
                  onChange={(e) =>
                    setNewAddress((prev) => ({
                      ...prev,
                      zipCode: e.target.value,
                    }))
                  }
                  placeholder="Enter ZIP code"
                />
              </div>
              <button
                onClick={handleAddNewAddress}
                className="px-6 py-3 border border-primary text-primary 
                         hover:bg-primary/10 rounded-lg font-medium"
              >
                Add New Address
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div
            className="bg-white dark:bg-gray-800 rounded-xl border 
                         border-border-default dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-text-main dark:text-gray-200">
                Payment Method
              </h2>
              <CreditCard className="w-5 h-5 text-primary" />
            </div>

            <div className="space-y-4">
              {[
                {
                  id: "cash_on_delivery",
                  label: "Cash on Delivery",
                  icon: "💰",
                },
                { id: "bank_transfer", label: "Bank Transfer", icon: "🏦" },
                { id: "mobile_banking", label: "Mobile Banking", icon: "📱" },
              ].map((method) => (
                <div
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors
                            ${paymentMethod === method.id
                      ? "border-primary bg-primary/5"
                      : "border-border-default dark:border-gray-700 hover:border-primary"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                                  ${paymentMethod === method.id
                          ? "border-primary bg-primary"
                          : "border-border-default dark:border-gray-700"
                        }`}
                    >
                      {paymentMethod === method.id && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="text-2xl">{method.icon}</span>
                    <div>
                      <p className="font-medium text-text-main dark:text-gray-200">
                        {method.label}
                      </p>
                      {method.id === "cash_on_delivery" && (
                        <p className="text-sm text-text-secondary dark:text-gray-400">
                          Pay when you receive your order
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Note */}
            <div className="mt-6">
              <h3 className="font-medium text-text-main dark:text-gray-200 mb-3">
                Order Note (Optional)
              </h3>
              <textarea
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="Add special instructions for your order..."
                className="w-full h-32 px-4 py-3 border border-border-default 
                         dark:border-gray-700 rounded-lg resize-none 
                         focus:outline-none focus:ring-2 focus:ring-accent bg-white dark:bg-white text-black"
              />
            </div>
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div>
          <div className="sticky top-24">
            <div
              className="bg-white dark:bg-gray-800 rounded-xl border 
                           border-border-default dark:border-gray-700 p-6 mb-4"
            >
              <h2 className="text-xl font-semibold text-text-main dark:text-gray-200 mb-4">
                Order Summary
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-text-secondary dark:text-gray-400">
                    Subtotal ({cartItems.length} items)
                  </span>
                  <span className="font-medium">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-text-secondary dark:text-gray-400">
                    Shipping
                  </span>
                  <span
                    className={
                      shipping === 0 ? "text-status-success font-medium" : ""
                    }
                  >
                    {shipping === 0 ? "FREE" : `ETB ${shipping}`}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-text-secondary dark:text-gray-400">
                    Tax (15%)
                  </span>
                  <span className="font-medium">{formatCurrency(tax)}</span>
                </div>

                <div className="border-t border-border-default dark:border-gray-700 pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handlePlaceOrder(false)}
                loading={loading}
                fullWidth
                className="mt-6"
                disabled={cartItems.length === 0}
              >
                Place Order
              </Button>

              <p className="text-xs text-text-muted mt-4 text-center">
                By placing your order, you agree to our Terms of Service
              </p>
            </div>

            {/* Security Info */}
            <div
              className="bg-green-50 dark:bg-green-900/20 rounded-xl border 
                           border-green-200 dark:border-green-800 p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-5 h-5 text-status-success" />
                <h3 className="font-semibold text-green-800 dark:text-green-300">
                  Secure Payment
                </h3>
              </div>
              <p className="text-sm text-green-700 dark:text-green-400 mb-4">
                Your payment information is encrypted and secure. We never store
                your card details.
              </p>
              <div className="flex items-center gap-2">
                <div className="text-2xl">🔒</div>
                <div className="text-2xl">🛡️</div>
                <div className="text-2xl">✓</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Simulation Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentSuccess={() => {
          setShowPaymentModal(false);
          handlePlaceOrder(true);
        }}
        amount={total}
        method={paymentMethod}
      />
    </div>
  );
};

export default Checkout;
