import React from "react";
import {
  X,
  Package,
  MapPin,
  CreditCard,
  Clock,
  User,
  Truck,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import OrderStatusBadge from "./OrderStatusBadge";
import Button from "../forms/Button";
import { getImageUrl } from "../../utils/image";

const OrderDetailsModal = ({
  isOpen,
  onClose,
  order,
  onCancelOrder,
  cancelling,
}) => {
  if (!isOpen || !order) return null;

  const calculateItemTotal = (item) => item.price * item.quantity;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Order #{order.id} Details
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Placed on {format(parseISO(order.created_at), "PPP")}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Status Section */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Package className="w-5 h-5 text-gray-500" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Order Status
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <OrderStatusBadge status={order.status} />
                        {order.delivery?.delivery_person_name && (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            • Assigned to: {order.delivery.delivery_person_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="inline w-4 h-4 mr-1" />
                    Last updated: {format(parseISO(order.updated_at), "PPp")}
                  </div>
                </div>
              </div>

              {/* Customer & Shipping Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                      <User className="w-5 h-5 mr-2 text-gray-500" />
                      Customer Information
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {order.customer_email}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                      <MapPin className="w-5 h-5 mr-2 text-gray-500" />
                      Shipping Address
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <p className="text-gray-700 dark:text-gray-300">
                        {order.delivery_address}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Shop: {order.shop_name} • Area: {order.area_name}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                      <CreditCard className="w-5 h-5 mr-2 text-gray-500" />
                      Payment Information
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600 dark:text-gray-400">
                          Payment Method
                        </span>
                        <span className="font-medium">
                          {order.payment_method === "cash_on_delivery"
                            ? "Cash on Delivery"
                            : order.payment_method === "mobile_banking"
                              ? "Mobile Banking"
                              : order.payment_method === "bank_transfer"
                                ? "Bank Transfer"
                                : "Online Payment"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Payment Status
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full 
                          ${order.payment_status === 'paid'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'}`}>
                          {order.payment_status?.toUpperCase() || "PENDING"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {order.delivery && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                        <Truck className="w-5 h-5 mr-2 text-gray-500" />
                        Delivery Information
                      </h4>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">
                            Status:
                          </span>
                          <span className="font-medium">
                            {order.delivery.status}
                          </span>
                        </div>
                        {order.delivery.delivery_person_name && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Assigned To:
                            </span>
                            <span className="font-medium">
                              {order.delivery.delivery_person_name}
                            </span>
                          </div>
                        )}
                        {order.delivery.estimated_delivery && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Estimated Delivery:
                            </span>
                            <span className="font-medium">
                              {format(
                                parseISO(order.delivery.estimated_delivery),
                                "PP"
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Order Items
                </h4>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {order.items?.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0">
                                  <img
                                    className="h-10 w-10 rounded object-cover"
                                    src={getImageUrl(item.main_image)}
                                    alt={item.product_name}
                                  />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {item.product_name}
                                  </div>
                                  {item.size_label && (
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                      Size: {item.size_label}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              ETB {item.price?.toFixed(2) || "0.00"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              ETB {calculateItemTotal(item).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                  Order Summary
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Subtotal:
                    </span>
                    <span className="font-medium">
                      ETB {order.subtotal?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Shipping:
                    </span>
                    <span className="font-medium">
                      ETB {order.shipping_fee?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Discount:
                      </span>
                      <span className="font-medium text-green-600">
                        -ETB {order.discount?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>ETB {order.total?.toFixed(2) || "0.00"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <div className="flex space-x-3">
              {order.status?.toLowerCase() === "pending" && (
                <Button
                  variant="danger"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to cancel this order?"
                      )
                    ) {
                      onCancelOrder(order.id);
                      onClose();
                    }
                  }}
                  disabled={cancelling === order.id}
                >
                  {cancelling === order.id ? "Cancelling..." : "Cancel Order"}
                </Button>
              )}

              {order.delivery && order.delivery.delivery_person_id && (
                <Button
                  variant="primary"
                  onClick={() =>
                    (window.location.href = `/delivery/track/${order.id}`)
                  }
                >
                  Track Delivery
                </Button>
              )}

              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
