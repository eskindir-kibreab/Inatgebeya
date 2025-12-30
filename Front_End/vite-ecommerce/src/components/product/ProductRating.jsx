import React from "react";
import { Star, StarHalf } from "lucide-react";

const ProductRating = ({ rating = 0, size = "md" }) => {
  const numericRating = Number(rating) || 0;
  const fullStars = Math.floor(numericRating);
  const hasHalfStar = numericRating % 1 >= 0.5;
  const emptyStars = Math.max(0, 5 - fullStars - (hasHalfStar ? 1 : 0));

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => (
        <Star
          key={`full-${i}`}
          className={`${sizeClasses[size]} fill-accent text-accent`}
        />
      ))}

      {hasHalfStar && (
        <StarHalf className={`${sizeClasses[size]} fill-accent text-accent`} />
      )}

      {[...Array(emptyStars)].map((_, i) => (
        <Star
          key={`empty-${i}`}
          className={`${sizeClasses[size]} text-gray-300 dark:text-gray-600`}
        />
      ))}

      <span className="ml-1 text-sm font-medium text-text-main dark:text-gray-200">
        {numericRating.toFixed(1)}
      </span>
    </div>
  );
};

export default ProductRating;
