import React from "react";
import { useCart } from "../../context/CartContext";
import { Link } from "react-router-dom";

const CartSummary = () => {
  const { getCartTotal, getCartCount } = useCart();
  const subtotal = getCartTotal();
  const shipping = subtotal > 10000 ? 0 : 50; // Free shipping over ETB 10000
  const total = subtotal + shipping;

  return (
    <div
      className="bg-white dark:bg-gray-800 border border-border-default 
                   dark:border-gray-700 rounded-lg p-6"
    >
      <h3 className="text-lg font-semibold text-text-main dark:text-gray-200 mb-4">
        Order Summary
      </h3>

      <div className="space-y-3">
        <div className="flex justify-between text-text-secondary dark:text-gray-400">
          <span>Subtotal ({getCartCount()} items)</span>
          <span className="font-medium">ETB {subtotal.toLocaleString()}</span>
        </div>

        <div className="flex justify-between text-text-secondary dark:text-gray-400">
          <span>Shipping</span>
          <span
            className={shipping === 0 ? "text-status-success font-medium" : ""}
          >
            {shipping === 0 ? "FREE" : `ETB ${shipping}`}
          </span>
        </div>

        {subtotal < 10000 && (
          <div className="text-sm text-status-success">
            Add ETB {(10000 - subtotal).toLocaleString()} more for free shipping!
          </div>
        )}

        <div className="border-t border-border-default dark:border-gray-700 pt-3 mt-3">
          <div className="flex justify-between text-lg font-bold text-text-main dark:text-gray-200">
            <span>Total</span>
            <span>ETB {total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-text-muted mt-4 text-center">
        Prices include VAT. Shipping calculated at checkout.
      </p>
    </div>
  );
};

export default CartSummary;
