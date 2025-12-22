import React from "react";

const ProductPrice = ({ price, originalPrice, size = "md" }) => {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <div className="flex items-center flex-wrap gap-2">
      <span className={`${sizeClasses[size]} font-bold text-price`}>
        ETB {price.toLocaleString()}
      </span>

      {originalPrice && originalPrice > price && (
        <>
          <span className="text-text-muted line-through">
            ETB {originalPrice.toLocaleString()}
          </span>
          <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded">
            {discount}% OFF
          </span>
        </>
      )}
    </div>
  );
};

export default ProductPrice;
