import React, { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../../context/CartContext";

const CartIcon = () => {
  const { getCartCount } = useCart();
  const [count, setCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const newCount = getCartCount();

    // Trigger animation only when count increases
    if (newCount > count) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }

    setCount(newCount);
  }, [getCartCount]);

  // Hide if cart is empty
  if (count === 0) {
    return null;
  }

  return (
    <div className="relative">
      <ShoppingCart className="w-6 h-6 text-text-main dark:text-gray-200" />
      <span
        className={`absolute -top-2 -right-2 bg-price text-white text-xs font-bold 
                   rounded-full w-5 h-5 flex items-center justify-center
                   ${isAnimating ? "animate-cart-bounce" : ""}`}
      >
        {count}
      </span>
    </div>
  );
};

export default CartIcon;
