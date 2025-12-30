import React, { useState } from "react";
import ProductGrid from "../../components/product/ProductGrid";

const Landing = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);

  return (
    <div className="animate-fade-in space-y-8 pb-12 pt-8">
      {/* Products Section */}
      <div className="container mx-auto">
        <ProductGrid categoryId={selectedCategory} />
      </div>
    </div>
  );
};

export default Landing;
