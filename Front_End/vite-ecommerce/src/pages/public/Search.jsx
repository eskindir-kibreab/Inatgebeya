import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import ProductGrid from "../../components/product/ProductGrid";
import EmptyState from "../../components/feedback/EmptyState";

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [hasResults, setHasResults] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [filters, setFilters] = useState({
    category_id: searchParams.get("category") || "",
    min_price: searchParams.get("min_price") || "",
    max_price: searchParams.get("max_price") || "",
  });

  useEffect(() => {
    const q = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const min_price = searchParams.get("min_price") || "";
    const max_price = searchParams.get("max_price") || "";

    setSearchQuery(q);
    setFilters({
      category_id: category,
      min_price,
      max_price,
    });

    // If there's a search term, assume results should be filtered by backend.
    // ProductGrid will call /products?search=<q>&... and only show matches.
    setHasResults(true);
  }, [searchParams]);

  const handleClearSearch = () => {
    setSearchQuery("");
    setFilters({
      category_id: "",
      min_price: "",
      max_price: "",
    });
    navigate("/search");
  };

  return (
    <div className="max-w-7xl mx-auto">
      {hasResults ? (
        <ProductGrid
          categoryId={filters.category_id}
          shopId={null}
          minPrice={filters.min_price}
          maxPrice={filters.max_price}
          searchTerm={searchQuery}
        />
      ) : (
        <EmptyState type="search" onAction={handleClearSearch} />
      )}
    </div>
  );
};

export default Search;
