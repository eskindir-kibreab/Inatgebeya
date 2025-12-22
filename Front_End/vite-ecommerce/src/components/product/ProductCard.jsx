import React from "react";
import { Link } from "react-router-dom";
import { Star, ShoppingBag } from "lucide-react";
import ProductRating from "./ProductRating";
import { useCart } from "../../context/CartContext";
import toast from "react-hot-toast";

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e) => {
    e.stopPropagation();
    e.preventDefault();

    addToCart(product, 1);
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="group bg-white dark:bg-gray-800 rounded-lg border border-border-default 
               dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all 
               duration-300 hover:-translate-y-1 block"
    >
      {/* Product Image */}
      <div className="relative h-56 bg-gray-100 dark:bg-gray-700 overflow-hidden">
        <img
          src={product.main_image || "/placeholder.jpg"}
          alt={product.product_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform 
                   duration-300"
          loading="lazy"
        />

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 p-2 rounded-full 
                   shadow-lg opacity-0 group-hover:opacity-100 transition-opacity 
                   duration-200 hover:bg-accent hover:text-white"
          aria-label="Add to cart"
        >
          <ShoppingBag className="w-5 h-5" />
        </button>

        {/* Sold Count Badge */}
        {product.sold_count > 0 && (
          <div className="absolute top-4 left-4 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {product.sold_count} sold
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-medium text-text-main dark:text-gray-200 mb-2 line-clamp-1">
          {product.product_name}
        </h3>

        {/* Rating */}
        <div className="flex items-center space-x-2 mb-3">
          <ProductRating rating={product.average_rating || 0} />
          <span className="text-xs text-text-muted">
            ({product.review_count || 0})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-price">
              ETB {product.price}
            </span>
            {product.original_price && (
              <span className="ml-2 text-sm text-text-muted line-through">
                ETB {product.original_price}
              </span>
            )}
          </div>

          {/* Shop Info */}
          {product.shop_name && (
            <span
              className="text-xs text-text-secondary dark:text-gray-400 px-2 py-1 
                           bg-bg-light dark:bg-gray-700 rounded"
            >
              {product.shop_name}
            </span>
          )}
        </div>

        {/* Additional Info */}
        <div className="mt-3 pt-3 border-t border-border-default dark:border-gray-700">
          <p className="text-sm text-text-secondary dark:text-gray-400 line-clamp-2">
            {product.description || "No description available"}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
