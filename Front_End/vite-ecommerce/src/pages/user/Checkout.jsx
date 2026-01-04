import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, CreditCard, Shield } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { ordersAPI, paymentsAPI, bankTransferAPI } from "../../api";
import { useAuth } from "../../context/AuthContext";
import Input from "../../components/forms/Input";
import Select from "../../components/forms/Select";
import Button from "../../components/forms/Button";
import toast from "react-hot-toast";

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
  const [paymentMethod, setPaymentMethod] = useState("mobile_banking");
  const [selectedBank, setSelectedBank] = useState("awash");
  const [transactionId, setTransactionId] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [orderNote, setOrderNote] = useState("");

  // Clean up object URL when component unmounts or receipt changes
  useEffect(() => {
    if (!receiptFile) {
      setReceiptPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(receiptFile);
    setReceiptPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [receiptFile]);

  const bankDetails = {
    awash: { name: "Awash Bank", accountName: "Inatgebeya", accountNumber: "0132047382901" },
    cbe: { name: "Commercial Bank of Ethiopia (CBE)", accountName: "Inatgebeya", accountNumber: "1000345678901" },
    birhan: { name: "Birhan Bank", accountName: "Inatgebeya", accountNumber: "2501234567890" }
  };

  const subtotal = getCartTotal();
  const shipping = subtotal > 10000 ? 0 : 50;
  const tax = subtotal * 0.15;
  const total = subtotal + shipping + tax;

  useEffect(() => {
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

    // Validation for Bank Transfer
    if (paymentMethod === "bank_transfer") {
      if (!transactionId.trim()) {
        toast.error("Transaction ID is required for bank transfer");
        return;
      }
      if (!receiptFile) {
        toast.error("Receipt screenshot is mandatory for bank transfer");
        return;
      }
    }

    setLoading(true);
    try {
      // Group items by shop
      const itemsByShop = {};
      cartItems.forEach((item) => {
        if (!itemsByShop[item.shop_id]) {
          itemsByShop[item.shop_id] = [];
        }

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
            transaction_id: paymentMethod === 'bank_transfer' ? transactionId : null,
          });
        }
      );

      const results = await Promise.all(orderPromises);
      const allSuccess = results.every((result) => result.success);

      if (allSuccess) {
        const firstOrderId = results[0].data.orderId;

        // 1. Handle Mobile Banking (Chapa)
        if (paymentMethod === "mobile_banking") {
          toast.loading("Initializing secure payment...");
          try {
            const payment = await paymentsAPI.initialize(firstOrderId);
            if (payment.success && payment.data.checkout_url) {
              clearCart();
              window.location.href = payment.data.checkout_url;
              return;
            } else {
              throw new Error("Failed to get checkout URL");
            }
          } catch (payError) {
            console.error("Payment init error:", payError);
            const errMsg = payError.response?.data?.message || "Payment initialization failed.";
            toast.error(`Order created, but: ${errMsg}`);
            navigate("/orders");
            return;
          }
        }

        // 2. Handle Bank Transfer
        if (paymentMethod === "bank_transfer") {
          toast.loading("Submitting payment details...");
          try {
            const formData = new FormData();
            formData.append("bank", selectedBank);
            formData.append("order_id", firstOrderId);
            formData.append("transaction_id", transactionId);
            formData.append("amount", total);
            formData.append("receipt", receiptFile);

            const bankResult = await bankTransferAPI.submit(formData);
            if (bankResult.success) {
              toast.success("Payment submitted for verification!");
              clearCart();
              navigate("/orders");
              return;
            } else {
              throw new Error(bankResult.message || "Failed to submit bank transfer");
            }
          } catch (bankError) {
            console.error("Bank Transfer submission error:", bankError);
            toast.error(`Order created, but payment submission failed: ${bankError.message}`);
            navigate("/orders");
            return;
          }
        }

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
      toast.error(errorMessage);
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
                { id: "mobile_banking", label: "Mobile Banking", icon: "📱" },
                { id: "bank_transfer", label: "Bank Transfer", icon: "🏦" },
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
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bank Transfer Details Section */}
            {paymentMethod === "bank_transfer" && (
              <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-primary/30 space-y-6">
                <div>
                  <h3 className="font-medium text-text-main dark:text-gray-200 mb-3">
                    Select Your Bank
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {Object.entries(bankDetails).map(([key, bank]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedBank(key)}
                        className={`p-3 text-sm font-medium border rounded-lg transition-all
                          ${selectedBank === key
                            ? "bg-primary text-white border-primary shadow-lg scale-105"
                            : "bg-white dark:bg-gray-800 text-text-main dark:text-gray-300 border-border-default dark:border-gray-700 hover:border-primary"
                          }`}
                      >
                        {bank.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm font-semibold text-primary mb-2">Account Details:</p>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-text-secondary dark:text-gray-400">Account Name:</span> <span className="font-bold dark:text-white">{bankDetails[selectedBank].accountName}</span></p>
                    <p><span className="text-text-secondary dark:text-gray-400">Account Number:</span> <span className="font-bold tracking-wider dark:text-white uppercase">{bankDetails[selectedBank].accountNumber}</span></p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Transaction ID (Mandatory)"
                    placeholder="Enter the transaction ID from your bank app"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-text-main dark:text-gray-300 mb-1">
                      Upload Receipt Screenshot (Mandatory)
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border-default dark:border-gray-700 border-dashed rounded-lg hover:border-primary transition-colors cursor-pointer relative overflow-hidden group">
                      <div className="space-y-1 text-center">
                        {receiptPreview ? (
                          <div className="relative inline-block">
                            <img
                              src={receiptPreview}
                              alt="Receipt Preview"
                              className="max-h-48 rounded-lg shadow-md mb-2 group-hover:opacity-75 transition-opacity"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold">Change Receipt</p>
                            </div>
                          </div>
                        ) : (
                          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        <div className="flex text-sm text-gray-600 dark:text-gray-400">
                          <label className="relative cursor-pointer bg-transparent rounded-md font-medium text-primary hover:text-primary-focus">
                            <span>{receiptFile ? receiptFile.name : "Upload a file"}</span>
                            <input
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={(e) => setReceiptFile(e.target.files[0])}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                      </div>
                      <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept="image/*"
                        onChange={(e) => setReceiptFile(e.target.files[0])}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

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

    </div>
  );
};

export default Checkout;
