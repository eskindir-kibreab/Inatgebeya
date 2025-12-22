import React from "react";
import { ShoppingBag, Package, Search } from "lucide-react";

const EmptyState = ({
  type = "cart",
  title,
  message,
  actionText,
  onAction,
}) => {
  const config = {
    cart: {
      icon: ShoppingBag,
      defaultTitle: "Your cart is empty",
      defaultMessage:
        "Looks like you haven't added any items to your cart yet.",
      defaultAction: "Start Shopping",
    },
    products: {
      icon: Package,
      defaultTitle: "No products found",
      defaultMessage:
        "Try adjusting your search or filter to find what you're looking for.",
      defaultAction: "Browse All Products",
    },
    search: {
      icon: Search,
      defaultTitle: "No results found",
      defaultMessage: "We couldn't find any products matching your search.",
      defaultAction: "Clear Search",
    },
  };

  const {
    icon: Icon,
    defaultTitle,
    defaultMessage,
    defaultAction,
  } = config[type];

  return (
    <div className="text-center py-12">
      <div
        className="inline-flex items-center justify-center w-20 h-20 
                     bg-bg-light dark:bg-gray-800 rounded-full mb-6"
      >
        <Icon className="w-10 h-10 text-text-secondary dark:text-gray-400" />
      </div>

      <h3 className="text-xl font-semibold text-text-main dark:text-gray-200 mb-2">
        {title || defaultTitle}
      </h3>

      <p className="text-text-secondary dark:text-gray-400 mb-6 max-w-md mx-auto">
        {message || defaultMessage}
      </p>

      {onAction && (
        <button onClick={onAction} className="btn-primary">
          {actionText || defaultAction}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
