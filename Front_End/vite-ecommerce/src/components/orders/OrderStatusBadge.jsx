import React from "react";
import {
  Clock,
  CheckCircle,
  Truck,
  Home,
  XCircle,
  Package,
} from "lucide-react";

const OrderStatusBadge = ({ status, className = "" }) => {
  const statusConfig = {
    pending: {
      icon: Clock,
      text: "Pending",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
      textColor: "text-yellow-800 dark:text-yellow-300",
      iconColor: "text-yellow-600 dark:text-yellow-400",
    },
    confirmed: {
      icon: CheckCircle,
      text: "Confirmed",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      textColor: "text-blue-800 dark:text-blue-300",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    processing: {
      icon: Package,
      text: "Processing",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
      textColor: "text-purple-800 dark:text-purple-300",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    shipped: {
      icon: Truck,
      text: "Shipped",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
      textColor: "text-orange-800 dark:text-orange-300",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
    delivered: {
      icon: Home,
      text: "Delivered",
      bgColor: "bg-green-100 dark:bg-green-900/20",
      textColor: "text-green-800 dark:text-green-300",
      iconColor: "text-green-600 dark:text-green-400",
    },
    paid: {
      icon: CheckCircle,
      text: "Paid",
      bgColor: "bg-green-100 dark:bg-green-900/20",
      textColor: "text-green-800 dark:text-green-300",
      iconColor: "text-green-600 dark:text-green-400",
    },
    admin_approved: {
      icon: CheckCircle,
      text: "Approved",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      textColor: "text-blue-800 dark:text-blue-300",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    delivery_assigned: {
      icon: Truck,
      text: "Delivery Assigned",
      bgColor: "bg-indigo-100 dark:bg-indigo-900/20",
      textColor: "text-indigo-800 dark:text-indigo-300",
      iconColor: "text-indigo-600 dark:text-indigo-400",
    },
    picked_up: {
      icon: Package,
      text: "Picked Up",
      bgColor: "bg-teal-100 dark:bg-teal-900/20",
      textColor: "text-teal-800 dark:text-teal-300",
      iconColor: "text-teal-600 dark:text-teal-400",
    },
    cancelled: {
      icon: XCircle,
      text: "Cancelled",
      bgColor: "bg-red-100 dark:bg-red-900/20",
      textColor: "text-red-800 dark:text-red-300",
      iconColor: "text-red-600 dark:text-red-400",
    },
  };

  const statusKey = status?.toLowerCase()?.replace(" ", "_") || "pending";
  const config = statusConfig[statusKey] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor} ${className}`}
    >
      <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
      {config.text}
    </span>
  );
};

export default OrderStatusBadge;
