import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Package,
  CheckCircle,
  Truck,
  Home,
  Clock,
  User,
  ArrowLeft,
} from "lucide-react";
import { ordersAPI } from "../../api/orders.api";
import Button from "../../components/forms/Button";
import ErrorState from "../../components/feedback/ErrorState";
import OrderStatusBadge from "../../components/orders/OrderStatusBadge";

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getById(orderId);
      if (response.success) {
        setOrder(response.data);
      } else {
        setOrder(null);
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    setUpdatingStatus(true);
    try {
      const response = await ordersAPI.cancel(orderId);
      if (response.success) {
        fetchOrder();
        alert("Order cancelled successfully");
      }
    } catch (error) {
      alert("Failed to cancel order");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusSteps = () => {
    const steps = [
      { id: "pending", label: "Ordered", icon: Package },
      { id: "confirmed", label: "Confirmed", icon: CheckCircle },
      { id: "processing", label: "Processing", icon: Package },
      { id: "shipped", label: "Shipped", icon: Truck },
      { id: "delivered", label: "Delivered", icon: Home },
    ];

    const currentStepIndex = steps.findIndex(
      (step) => step.id === order?.status
    );

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentStepIndex,
      current: index === currentStepIndex,
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-ET", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-8"></div>
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl mb-6"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto">
        <ErrorState
          title="Order Not Found"
          message="The order you're looking for doesn't exist or you don't have permission to view it."
          actionText="Back to Orders"
          onAction={() => navigate("/orders")}
        />
      </div>
    );
  }

  const statusSteps = getStatusSteps();
  const canCancel = ["pending", "confirmed"].includes(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate("/orders")}
        className="flex items-center text-primary hover:text-primary-hover mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Orders
      </button>

      {/* Order Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-main dark:text-gray-200">
          Order #{order.order_id || order.id}
        </h1>
        <p className="text-text-secondary dark:text-gray-400 mt-2">
          Placed on {formatDate(order.created_at)}
        </p>
      </div>

      {/* Status Timeline */}
      <div
        className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                     dark:border-gray-700 p-6 mb-8"
      >
        <h2 className="text-xl font-semibold text-text-main dark:text-gray-200 mb-6">
          Order Status
        </h2>

        <div className="relative">
          {/* Progress Line */}
          <div
            className="absolute top-5 left-0 right-0 h-0.5 bg-border-default 
                         dark:bg-gray-700 z-0"
          ></div>

          <div className="relative flex justify-between z-10">
            {statusSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className="flex flex-col items-center text-center"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2
                                ${step.completed
                        ? "bg-status-success text-white"
                        : step.current
                          ? "bg-primary text-white"
                          : "bg-bg-light dark:bg-gray-700 text-text-muted"
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-sm font-medium
                                  ${step.completed || step.current
                        ? "text-text-main dark:text-gray-200"
                        : "text-text-muted"
                      }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text-main dark:text-gray-200">
                Current Status: <OrderStatusBadge status={order.status} />
              </p>
              <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
                Last updated: {formatDate(order.updated_at)}
              </p>
            </div>

            {canCancel && (
              <Button
                variant="danger"
                loading={updatingStatus}
                onClick={handleCancelOrder}
              >
                Cancel Order
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Details */}
        <div className="lg:col-span-2">
          {/* Items */}
          <div
            className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                         dark:border-gray-700 p-6 mb-6"
          >
            <h2 className="text-xl font-semibold text-text-main dark:text-gray-200 mb-6">
              Order Items
            </h2>

            <div className="space-y-4">
              {order.items?.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 border 
                                         border-border-default dark:border-gray-700 rounded-lg"
                >
                  <img
                    src={item.main_image || "/placeholder.jpg"}
                    alt={item.product_name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-text-main dark:text-gray-200">
                      {item.product_name}
                    </h3>
                    {item.size_label && (
                      <p className="text-sm text-text-secondary dark:text-gray-400">
                        Size: {item.size_label}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-price">
                      ETB {item.price?.toLocaleString()}
                    </p>
                    <p className="text-sm text-text-secondary dark:text-gray-400">
                      Qty: {item.quantity}
                    </p>
                    <p className="text-sm text-text-secondary dark:text-gray-400">
                      Total: ETB{" "}
                      {(item.price * item.quantity)?.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Info */}
          <div
            className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                         dark:border-gray-700 p-6"
          >
            <h2 className="text-xl font-semibold text-text-main dark:text-gray-200 mb-6">
              Shipping Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-text-main dark:text-gray-200 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Delivery Address
                </h3>
                <div className="text-text-secondary dark:text-gray-400">
                  <p>{order.delivery_address}</p>
                  {order.area_name && (
                    <p className="mt-1">Area: {order.area_name}</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-text-main dark:text-gray-200 mb-3 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Shipping Details
                </h3>
                <div className="text-text-secondary dark:text-gray-400 space-y-1">
                  <p>Method: Standard Delivery</p>
                  <p>Estimated Delivery: 3-5 business days</p>
                  {order.delivery?.delivery_person_name && (
                    <p>Assigned to: {order.delivery.delivery_person_name}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div
            className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                         dark:border-gray-700 p-6 sticky top-24"
          >
            <h2 className="text-xl font-semibold text-text-main dark:text-gray-200 mb-6">
              Order Summary
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-text-secondary dark:text-gray-400">
                  Subtotal
                </span>
                <span className="font-medium">
                  ETB {order.subtotal?.toLocaleString() || "0.00"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-text-secondary dark:text-gray-400">
                  Shipping
                </span>
                <span className="font-medium">
                  {order.shipping_fee === 0
                    ? "FREE"
                    : `ETB ${order.shipping_fee?.toLocaleString() || "0.00"}`}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-text-secondary dark:text-gray-400">
                  Tax
                </span>
                <span className="font-medium">
                  ETB {order.tax?.toLocaleString() || "0.00"}
                </span>
              </div>

              <div className="border-t border-border-default dark:border-gray-700 pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>ETB {order.total?.toLocaleString() || "0.00"}</span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="mt-6 pt-6 border-t border-border-default dark:border-gray-700">
              <h3 className="font-medium text-text-main dark:text-gray-200 mb-3">
                Payment Information
              </h3>
              <div className="text-text-secondary dark:text-gray-400 space-y-1">
                <p>
                  Method:{" "}
                  {order.payment_method?.replace(/_/g, " ").toUpperCase() ||
                    "CASH ON DELIVERY"}
                </p>
                <p>
                  Status:{" "}
                  <span className={`${order.payment_status === 'paid' ? 'text-status-success' : 'text-status-warning'} capitalize`}>
                    {order.payment_status || 'Pending'}
                  </span>
                </p>
                {order.payment_status === 'paid' ? (
                  <p>Paid on: {formatDate(order.created_at)}</p>
                ) : (
                  <p>Payment required upon delivery</p>
                )}
              </div>
            </div>

            {/* Help Section */}
            <div className="mt-6 p-4 bg-bg-light dark:bg-gray-700 rounded-lg">
              <h3 className="font-medium text-text-main dark:text-gray-200 mb-2">
                Need Help?
              </h3>
              <p className="text-sm text-text-secondary dark:text-gray-400 mb-3">
                Contact our support team for any questions about your order.
              </p>
              <button
                onClick={() =>
                  (window.location.href = "mailto:support@inatgebeya.com")
                }
                className="w-full py-2 border border-primary text-primary 
                               hover:bg-primary/10 rounded-lg text-sm font-medium"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
