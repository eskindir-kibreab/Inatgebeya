import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Star,
  ShoppingCart,
  Truck,
  Shield,
  ChevronLeft,
  MessageSquare,
  Send,
  User as UserIcon
} from "lucide-react";
import { productsAPI } from "../../api/products.api";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import ProductRating from "../../components/product/ProductRating";
import ProductPrice from "../../components/product/ProductPrice";
import Button from "../../components/forms/Button";
import ErrorState from "../../components/feedback/ErrorState";
import toast from "react-hot-toast";
import { getImageUrl } from "../../utils/image";

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [sizes, setSizes] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);

  // Rating and Review State
  const [userRating, setUserRating] = useState(5);
  const [userReview, setUserReview] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [activeTab, setActiveTab] = useState("description"); // "description" or "reviews"

  useEffect(() => {
    fetchProduct();
    fetchProductSizes();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getById(productId);
      if (response.success) {
        setProduct(response.data);
        fetchRelatedProducts(response.data.category_id);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductSizes = async () => {
    try {
      const response = await productsAPI.getSizes(productId);
      if (response.success) {
        setSizes(response.data);
        if (response.data.length > 0) {
          setSelectedSize(response.data[0].size_label);
        }
      }
    } catch (error) {
      console.error("Error fetching sizes:", error);
    }
  };

  const fetchRelatedProducts = async (categoryId) => {
    try {
      const response = await productsAPI.getAll({
        category_id: categoryId,
        limit: 4,
        exclude: productId,
      });
      if (response.success) {
        setRelatedProducts(response.data);
      }
    } catch (error) {
      console.error("Error fetching related products:", error);
    }
  };

  // Compute available stock for the current selection
  const getAvailableStock = () => {
    if (!product) return 0;
    if (sizes.length > 0) {
      const sizeObj = sizes.find((s) => s.size_label === selectedSize);
      return sizeObj ? (sizeObj.stock || 0) : 0;
    }
    return product.stock || 0;
  };

  const currentAvailableStock = getAvailableStock();

  const handleAddToCart = () => {
    if (!product) return;

    if (sizes.length > 0 && !selectedSize) {
      toast.error("Please select a size");
      return;
    }

    const availableStock = currentAvailableStock;
    if (availableStock <= 0) {
      toast.error("This item is currently out of stock");
      return;
    }

    if (quantity > availableStock) {
      toast.error(`Only ${availableStock} items in stock. Adjusted your selection.`);
      setQuantity(availableStock);
      return;
    }

    const sizeObj = sizes.find((s) => s.size_label === selectedSize);
    addToCart(product, quantity, selectedSize || null, sizeObj?.id || null, availableStock);
  };

  const handleBuyNow = () => {
    if (currentAvailableStock <= 0) {
      toast.error("This item is currently out of stock");
      return;
    }
    handleAddToCart();
    navigate("/cart");
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    const availableStock = currentAvailableStock;

    if (newQuantity < 1) return;

    if (newQuantity > availableStock) {
      toast.error(`Only ${availableStock} items in stock`);
      setQuantity(availableStock);
      return;
    }

    if (newQuantity > 10) {
      toast.error("Maximum limit of 10 items reached");
      return;
    }

    setQuantity(newQuantity);
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please login to rate this product");
      navigate("/login");
      return;
    }

    if (!userRating) {
      toast.error("Please select a rating");
      return;
    }

    try {
      setSubmittingRating(true);
      const response = await productsAPI.rate(productId, {
        rating: userRating,
        review: userReview.trim() || undefined
      });

      if (response.success) {
        toast.success(response.message || "Rating submitted successfully");
        setUserReview("");
        fetchProduct(); // Refresh to update rating and list
      }
    } catch (error) {
      console.error("Error rating product:", error);
      toast.error(error.response?.data?.message || "Failed to submit rating");
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-[500px] bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto">
        <ErrorState
          title="Product Not Found"
          message="The product you're looking for doesn't exist or has been removed."
          actionText="Back to Shopping"
          onAction={() => navigate("/")}
        />
      </div>
    );
  }

  const images = [product.main_image, ...(product.images || [])].filter(
    Boolean
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-text-secondary dark:text-gray-400 
                 hover:text-text-main dark:hover:text-gray-200 mb-6"
      >
        <ChevronLeft className="w-5 h-5" />
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Product Images */}
        <div>
          {/* Main Image */}
          <div
            className="bg-white dark:bg-gray-800 border border-border-default 
                         dark:border-gray-700 rounded-xl p-4 mb-4 shadow-sm"
          >
            <img
              src={getImageUrl(images[activeImage])}
              alt={product.product_name}
              className="w-full h-[450px] object-contain rounded-lg"
            />
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto py-2 no-scrollbar">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(index)}
                  className={`flex-shrink-0 w-20 h-20 border-2 rounded-lg overflow-hidden transition-all
                            ${activeImage === index
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border-default dark:border-gray-700 hover:border-primary/50"
                    }`}
                >
                  <img
                    src={getImageUrl(img)}
                    alt={`${product.product_name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          {/* Breadcrumb */}
          <div className="text-sm text-text-secondary dark:text-gray-400 mb-4 flex items-center gap-2">
            <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate("/")}>Home</span>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate(`/search?category=${product.category_id}`)}>
              {product.category_name}
            </span>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span className="text-text-main dark:text-gray-200 line-clamp-1">{product.product_name}</span>
          </div>

          {/* Product Title */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-text-main dark:text-gray-200 mb-4 tracking-tight">
            {product.product_name}
          </h1>

          {/* Rating and Sold Count */}
          <div className="flex items-center gap-4 mb-6 bg-bg-light dark:bg-gray-800/50 p-2 rounded-lg w-fit">
            <div className="flex items-center gap-2">
              <ProductRating rating={product.average_rating || product.avg_rating || 0} />
              <span className="text-sm font-semibold text-text-secondary dark:text-gray-400">
                ({product.review_count || 0} reviews)
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="mb-8">
            <ProductPrice
              price={product.price}
              originalPrice={null} // Keep clean if no discount
              size="lg"
            />
          </div>

          {/* Shop Card */}
          {product.shop_name && (
            <div className="mb-8 p-4 border border-border-default dark:border-gray-700 rounded-xl flex items-center gap-4 group cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate(`/shops/${product.shop_id}`)}>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-xl shadow-inner">
                🏪
              </div>
              <div className="flex-1">
                <p className="text-xs text-text-secondary dark:text-gray-400 font-medium uppercase tracking-wider">
                  Verified Shop
                </p>
                <p className="font-bold text-lg text-text-main dark:text-gray-200 group-hover:text-primary transition-colors">
                  {product.shop_name}
                </p>
              </div>
              <ChevronLeft className="w-5 h-5 text-text-muted rotate-180 group-hover:translate-x-1 transition-transform" />
            </div>
          )}

          {/* Sizes */}
          {sizes.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-bold text-text-main dark:text-gray-200 mb-4 uppercase tracking-widest text-text-muted">
                Available Sizes
              </h3>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size.size_label)}
                    className={`px-6 py-2.5 border-2 rounded-xl font-bold transition-all relative
                              ${selectedSize === size.size_label
                        ? "border-primary bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                        : "border-border-default dark:border-gray-700 hover:border-primary/50 text-text-secondary dark:text-gray-400"
                      } ${size.stock <= 0 ? "opacity-50 grayscale" : ""}`}
                  >
                    <span className={size.stock <= 0 ? "line-through decoration-2" : ""}>
                      {size.size_label}
                    </span>
                    {size.stock > 0 && size.stock < 5 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ring-2 ring-white dark:ring-gray-900">
                        Only {size.stock}
                      </span>
                    )}
                    {size.stock <= 0 && (
                      <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-[8px] px-1.5 py-0.5 rounded-full ring-2 ring-white dark:ring-gray-900">
                        Out of Stock
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity and CTA */}
          <div className="mt-auto space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 border border-border-default dark:border-gray-700 w-full sm:w-auto">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors disabled:opacity-30"
                  disabled={quantity <= 1}
                >
                  <span className="text-xl font-bold">-</span>
                </button>
                <div className="w-12 text-center font-bold text-lg">
                  {quantity}
                </div>
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors disabled:opacity-30"
                  disabled={quantity >= 10}
                >
                  <span className="text-xl font-bold">+</span>
                </button>
              </div>

              <div className="flex-1 flex gap-3 w-full">
                {(() => {
                  const currentSize = sizes.find(s => s.size_label === selectedSize);
                  const isOutOfStock = sizes.length > 0
                    ? !selectedSize || (currentSize && currentSize.stock <= 0)
                    : (product.stock || 0) <= 0;

                  return (
                    <>
                      <Button
                        variant="primary"
                        size="lg"
                        className="flex-1 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 py-4 h-auto text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleAddToCart}
                        disabled={isOutOfStock}
                      >
                        <ShoppingCart className="w-5 h-5 mr-3" />
                        {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="px-6 rounded-xl hover:bg-bg-light transition-all border-2 font-bold py-4 h-auto flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleBuyNow}
                        disabled={isOutOfStock}
                      >
                        Buy Now
                      </Button>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4 pb-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100/50 dark:border-blue-900/20">
                <Truck className="w-5 h-5 text-blue-600" />
                <div className="text-xs">
                  <p className="font-bold text-blue-900 dark:text-blue-200">Express Delivery</p>
                  <p className="text-blue-600/80">Within 24-48 hours</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50/50 dark:bg-green-900/10 rounded-xl border border-green-100/50 dark:border-green-900/20">
                <Shield className="w-5 h-5 text-green-600" />
                <div className="text-xs">
                  <p className="font-bold text-green-900 dark:text-green-200">Guaranteed</p>
                  <p className="text-green-600/80">7-Day Money Back</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="border-t border-border-default dark:border-gray-700">
        <div className="flex gap-8 mb-8 pt-6">
          <button
            onClick={() => setActiveTab("description")}
            className={`text-lg font-bold pb-4 border-b-2 transition-all
                      ${activeTab === "description"
                ? "text-primary border-primary"
                : "text-text-muted border-transparent hover:text-text-main"
              }`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`text-lg font-bold pb-4 border-b-2 transition-all flex items-center gap-2
                      ${activeTab === "reviews"
                ? "text-primary border-primary"
                : "text-text-muted border-transparent hover:text-text-main"
              }`}
          >
            Reviews
            <span className="bg-bg-light dark:bg-gray-800 px-2 py-0.5 rounded-full text-xs">
              {product.review_count || 0}
            </span>
          </button>
        </div>

        <div className="min-h-[300px]">
          {activeTab === "description" ? (
            <div className="prose max-w-none dark:prose-invert">
              <div className="text-lg text-text-secondary dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                {product.description || "No detailed description available for this product."}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Reviews Summary/List */}
              <div className="lg:col-span-2 space-y-8">
                {product.ratings?.length > 0 ? (
                  product.ratings.map((review) => (
                    <div key={review.rating_id} className="bg-bg-light dark:bg-gray-800/20 p-6 rounded-2xl border border-border-default dark:border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                            <UserIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-text-main dark:text-gray-200">{review.user_name || "Guest"}</p>
                            <p className="text-xs text-text-muted">
                              {new Date(review.created_at).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        <ProductRating rating={review.rating} size="sm" />
                      </div>
                      <p className="text-text-secondary dark:text-gray-300 leading-relaxed italic">
                        "{review.review || "No comments provided."}"
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-bg-light dark:bg-gray-800/20 rounded-2xl border-2 border-dashed border-border-default dark:border-gray-700">
                    <MessageSquare className="w-12 h-12 text-text-muted mx-auto mb-4" />
                    <p className="text-text-muted font-medium">No reviews yet. Be the first to share your experience!</p>
                  </div>
                )}
              </div>

              {/* Submit Rating Form */}
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-border-default dark:border-gray-700 shadow-xl shadow-black/5 sticky top-24">
                  <h3 className="text-xl font-bold text-text-main dark:text-gray-200 mb-6">Write a Review</h3>

                  {isAuthenticated ? (
                    <form onSubmit={handleRatingSubmit} className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-text-muted uppercase tracking-widest mb-4">
                          Rating
                        </label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setUserRating(star)}
                              className="focus:outline-none transition-transform hover:scale-110"
                            >
                              <Star
                                className={`w-8 h-8 ${star <= userRating
                                  ? "fill-accent text-accent"
                                  : "text-gray-300 dark:text-gray-600"
                                  }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-text-muted uppercase tracking-widest mb-4">
                          Your Review
                        </label>
                        <textarea
                          value={userReview}
                          onChange={(e) => setUserReview(e.target.value)}
                          placeholder="Share your experience with this product..."
                          className="w-full px-4 py-3 rounded-xl border border-border-default dark:border-gray-700 
                                   focus:ring-2 focus:ring-primary focus:border-transparent outline-none
                                   bg-white dark:bg-gray-900 transition-all resize-none h-32 text-black dark:text-white"
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        variant="primary"
                        className="w-full rounded-xl py-4 font-bold"
                        loading={submittingRating}
                        icon={Send}
                      >
                        Submit Review
                      </Button>
                    </form>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-text-secondary dark:text-gray-400 mb-6">
                        Please log in to share your rating and review with others.
                      </p>
                      <Button
                        variant="outline"
                        className="w-full rounded-xl border-2 py-4 font-bold"
                        onClick={() => navigate("/login")}
                      >
                        Log In Now
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-20 pt-12 border-t border-border-default dark:border-gray-700">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-extrabold text-text-main dark:text-gray-200 tracking-tight">
              You May Also Like
            </h2>
            <button className="text-primary font-bold hover:underline" onClick={() => navigate(`/search?category=${product.category_id}`)}>
              Explore All →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {relatedProducts.map((p) => (
              <div
                key={p.id || p.product_id}
                onClick={() => navigate(`/products/${p.product_id || p.id}`)}
                className="group bg-white dark:bg-gray-800 border border-border-default 
                         dark:border-gray-700 rounded-2xl p-4 hover:shadow-2xl 
                         hover:-translate-y-2 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="aspect-square rounded-xl overflow-hidden mb-4 bg-bg-light dark:bg-gray-900">
                  <img
                    src={getImageUrl(p.main_image)}
                    alt={p.product_name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <h3 className="font-bold text-text-main dark:text-gray-200 mb-2 truncate group-hover:text-primary transition-colors">
                  {p.product_name}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black text-price">
                    ETB {p.price}
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-accent text-accent" />
                    <span className="text-xs font-bold text-text-muted">
                      {Number(p.average_rating || p.avg_rating || 0).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
