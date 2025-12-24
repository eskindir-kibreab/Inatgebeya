import React, { useState } from "react";
import ProductGrid from "../../components/product/ProductGrid";

const Landing = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);

  return (
    <div className="animate-fade-in">
      {/* Products Only Landing */}
      <div>
        <h2 className="text-2xl font-bold text-text-main dark:text-gray-200 mb-6">
          Products
        </h2>
        <ProductGrid categoryId={selectedCategory} />
      </div>
    </div>
  );
};

export default Landing;
