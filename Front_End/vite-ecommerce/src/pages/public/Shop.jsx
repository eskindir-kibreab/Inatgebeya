import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Star, Package, Users, Calendar } from "lucide-react";
import ProductGrid from "../../components/product/ProductGrid";
import { shopsAPI } from "../../api/shops.api";
import ErrorState from "../../components/feedback/ErrorState";
import ProductRating from "../../components/product/ProductRating";

const Shop = () => {
  const { shopId } = useParams();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchShop();
  }, [shopId]);

  const fetchShop = async () => {
    try {
      setLoading(true);
      const response = await shopsAPI.getById(shopId);
      if (response.success) {
        setShop(response.data);
      } else {
        setError("Shop not found");
      }
    } catch (error) {
      setError("Failed to load shop");
      console.error("Error fetching shop:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl mb-8"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="max-w-7xl mx-auto">
        <ErrorState
          title="Shop Not Found"
          message="The shop you're looking for doesn't exist or has been removed."
          actionText="Back to Home"
          onAction={() => (window.location.href = "/")}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Shop Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary-hover/10 rounded-2xl p-8 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Shop Logo/Image */}
          <div
            className="w-24 h-24 bg-white dark:bg-gray-800 rounded-full 
                         flex items-center justify-center shadow-lg"
          >
            <div className="text-3xl">🏪</div>
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <h1 className="text-3xl font-bold text-text-main dark:text-gray-200">
                {shop.shop_name}
              </h1>

              {shop.is_verified && (
                <span
                  className="px-3 py-1 bg-status-success/20 text-status-success 
                               text-sm font-medium rounded-full"
                >
                  ✓ Verified Seller
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-text-secondary dark:text-gray-400">
              {shop.area_name && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{shop.area_name}</span>
                </div>
              )}

              {shop.owner_name && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Owner: {shop.owner_name}</span>
                </div>
              )}

              {shop.created_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Member since {new Date(shop.created_at).getFullYear()}
                  </span>
                </div>
              )}
            </div>

            {/* Shop Rating */}
            {(shop.average_rating > 0 || shop.avg_rating > 0) && (
              <div className="mt-4 flex items-center gap-2">
                <ProductRating rating={shop.average_rating || shop.avg_rating || 0} />
                <span className="text-text-secondary dark:text-gray-400">
                  ({shop.review_count} reviews)
                </span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Shop Description */}
      {shop.description && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-text-main dark:text-gray-200 mb-4">
            About This Shop
          </h2>
          <div
            className="bg-white dark:bg-gray-800 border border-border-default 
                         dark:border-gray-700 rounded-lg p-6"
          >
            <p className="text-text-secondary dark:text-gray-400 whitespace-pre-line">
              {shop.description}
            </p>
          </div>
        </div>
      )}

      {/* Shop Products */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text-main dark:text-gray-200">
            Shop Products
          </h2>
          <Link
            to={`/search?shop=${shopId}`}
            className="text-primary hover:text-primary-hover font-medium"
          >
            View All Products →
          </Link>
        </div>

        <ProductGrid shopId={shopId} />
      </div>

      {/* Shop Policies */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          className="bg-white dark:bg-gray-800 border border-border-default 
                       dark:border-gray-700 rounded-lg p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-text-main dark:text-gray-200">
              Shipping Policy
            </h3>
          </div>
          <p className="text-sm text-text-secondary dark:text-gray-400">
            Ships within 1-3 business days. Free shipping on orders over ETB
            500.
          </p>
        </div>

        <div
          className="bg-white dark:bg-gray-800 border border-border-default 
                       dark:border-gray-700 rounded-lg p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-semibold text-text-main dark:text-gray-200">
              Return Policy
            </h3>
          </div>
          <p className="text-sm text-text-secondary dark:text-gray-400">
            7-day return policy. Items must be in original condition with tags.
          </p>
        </div>

        <div
          className="bg-white dark:bg-gray-800 border border-border-default 
                       dark:border-gray-700 rounded-lg p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-status-success/10 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-status-success" />
            </div>
            <h3 className="font-semibold text-text-main dark:text-gray-200">
              Seller Rating
            </h3>
          </div>
          <p className="text-sm text-text-secondary dark:text-gray-400">
            {(shop.average_rating > 0 || shop.avg_rating > 0) ? (
              <>
                Rated {Number(shop.average_rating || shop.avg_rating || 0).toFixed(1)} out of 5 stars from{" "}
                {shop.review_count} customer reviews.
              </>
            ) : (
              "No ratings yet. Be the first to review this shop!"
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Shop;
