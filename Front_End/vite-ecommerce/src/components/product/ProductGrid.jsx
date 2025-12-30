import React, { useState, useEffect } from "react";
import ProductCard from "./ProductCard";
import { productsAPI } from "../../api/products.api";

const ProductGrid = ({
  categoryId,
  shopId,
  areaId,
  minPrice,
  maxPrice,
  sortBy,
  searchTerm,
}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const fetchProducts = async (reset = false) => {
    const currentPage = reset ? 1 : page;

    if (!reset && loadingMore) return;

    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = {
        page: currentPage,
        limit: 12,
        ...(categoryId && { category_id: categoryId }),
        ...(shopId && { shop_id: shopId }),
        ...(areaId && { area_id: areaId }),
        ...(minPrice && { min_price: minPrice }),
        ...(maxPrice && { max_price: maxPrice }),
        ...(sortBy && { sort_by: sortBy }),
        ...(searchTerm && { search: searchTerm }),
      };

      const response = await productsAPI.getAll(params);

      if (response?.success) {
        // Normalize backend fields (product_id -> id, avg_rating -> average_rating)
        const mapped = Array.isArray(response.data)
          ? response.data.map((p) => ({
            ...p,
            id: p.id ?? p.product_id,
            average_rating: p.average_rating ?? p.avg_rating ?? 0,
            avg_rating: p.avg_rating ?? p.average_rating ?? 0,
          }))
          : [];

        console.log("Landing Page Products Data:", mapped);

        if (reset) {
          setProducts(mapped);
          setPage(2);
        } else {
          setProducts((prev) => [...prev, ...mapped]);
          setPage(currentPage + 1);
        }

        const pagination = response.pagination || {};
        const totalPages = pagination.totalPages || pagination.pages || 1;
        setHasMore(currentPage < totalPages);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };
  useEffect(() => {
    fetchProducts(true);
  }, [categoryId, shopId, areaId, minPrice, maxPrice, sortBy, searchTerm]);

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      fetchProducts();
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64 mb-3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📦</div>
        <h3 className="text-xl font-semibold text-text-main dark:text-gray-200 mb-2">
          No products found
        </h3>
        <p className="text-text-secondary dark:text-gray-400">
          Try adjusting your search or filter to find what you're looking for.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {hasMore && (
        <div className="text-center mt-10">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-6 py-3 bg-primary hover:bg-primary-hover text-white 
                     font-medium rounded-lg transition-colors disabled:opacity-50 
                     disabled:cursor-not-allowed"
          >
            {loadingMore ? "Loading..." : "Load More Products"}
          </button>
        </div>
      )}
    </>
  );
};

export default ProductGrid;
