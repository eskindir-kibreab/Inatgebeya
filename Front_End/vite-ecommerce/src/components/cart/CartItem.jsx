import React from "react";
import { Trash2, Plus, Minus } from "lucide-react";
import { useCart } from "../../context/CartContext";

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  const handleIncrease = () => {
    updateQuantity(item.id, item.quantity + 1, item.size);
  };

  const handleDecrease = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1, item.size);
    } else {
      removeFromCart(item.id, item.size);
    }
  };

  const handleRemove = () => {
    removeFromCart(item.id, item.size);
  };

  return (
    <div
      className="flex items-center p-4 border border-border-default dark:border-gray-700 
                   rounded-lg bg-white dark:bg-gray-800"
    >
      {/* Product Image */}
      <div className="w-20 h-20 flex-shrink-0">
        <img
          src={item.image || "/placeholder.jpg"}
          alt={item.name}
          className="w-full h-full object-cover rounded"
        />
      </div>

      {/* Product Info */}
      <div className="flex-1 ml-4">
        <h4 className="font-medium text-text-main dark:text-gray-200">
          {item.name}
        </h4>

        {item.size && (
          <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
            Size: {item.size}
          </p>
        )}

        <p className="text-price font-semibold mt-2">
          ETB {item.price.toLocaleString()}
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center space-x-4">
        <div
          className="flex items-center border border-border-default dark:border-gray-700 
                       rounded-lg"
        >
          <button
            onClick={handleDecrease}
            className="p-2 hover:bg-bg-light dark:hover:bg-gray-700 transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="w-4 h-4" />
          </button>

          <span className="px-4 py-2 text-text-main dark:text-gray-200 font-medium">
            {item.quantity}
          </span>

          <button
            onClick={handleIncrease}
            className="p-2 hover:bg-bg-light dark:hover:bg-gray-700 transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Remove Button */}
        <button
          onClick={handleRemove}
          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 
                   rounded-lg transition-colors"
          aria-label="Remove item"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default CartItem;
