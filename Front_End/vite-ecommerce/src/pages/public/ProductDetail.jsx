import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Star,
  ShoppingCart,
  Truck,
  Shield,
  ChevronLeft,
  Share2,
  Heart,
} from "lucide-react";
import { productsAPI } from "../../api/products.api";
import { useCart } from "../../context/CartContext";
import ProductRating from "../../components/product/ProductRating";
import ProductPrice from "../../components/product/ProductPrice";
import Button from "../../components/forms/Button";
import ErrorState from "../../components/feedback/ErrorState";
import toast from "react-hot-toast";

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [sizes, setSizes] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);

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

  const handleAddToCart = () => {
    if (!product) return;

    if (sizes.length > 0 && !selectedSize) {
      toast.error("Please select a size");
      return;
    }

    addToCart(product, quantity, selectedSize || null);
    toast.success("Added to cart!");
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/cart");
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity);
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div>
          {/* Main Image */}
          <div
            className="bg-white dark:bg-gray-800 border border-border-default 
                         dark:border-gray-700 rounded-xl p-4 mb-4"
          >
            <img
              src={images[activeImage] || "/placeholder.jpg"}
              alt={product.product_name}
              className="w-full h-[400px] object-contain rounded-lg"
            />
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto py-2">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(index)}
                  className={`flex-shrink-0 w-20 h-20 border-2 rounded-lg overflow-hidden
                            ${
                              activeImage === index
                                ? "border-primary"
                                : "border-border-default dark:border-gray-700"
                            }`}
                >
                  <img
                    src={img}
                    alt={`${product.product_name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              className="flex-1 py-3 border border-border-default 
                             dark:border-gray-700 rounded-lg hover:bg-gray-50 
                             dark:hover:bg-gray-800 flex items-center justify-center gap-2"
            >
              <Heart className="w-5 h-5" />
              Save
            </button>
            <button
              className="flex-1 py-3 border border-border-default 
                             dark:border-gray-700 rounded-lg hover:bg-gray-50 
                             dark:hover:bg-gray-800 flex items-center justify-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              Share
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div>
          {/* Breadcrumb */}
          <div className="text-sm text-text-secondary dark:text-gray-400 mb-4">
            <span className="hover:text-primary cursor-pointer">Home</span>
            {" > "}
            <span className="hover:text-primary cursor-pointer">
              {product.category_name}
            </span>
            {" > "}
            <span>{product.product_name}</span>
          </div>

          {/* Product Title */}
          <h1 className="text-3xl font-bold text-text-main dark:text-gray-200 mb-4">
            {product.product_name}
          </h1>

          {/* Rating and Sold Count */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <ProductRating rating={product.average_rating || 0} />
              <span className="text-text-secondary dark:text-gray-400">
                ({product.review_count || 0} reviews)
              </span>
            </div>
            <div className="h-4 w-px bg-border-default dark:bg-gray-700"></div>
            <span className="text-text-secondary dark:text-gray-400">
              🧾 {product.sold_count || 0} sold
            </span>
          </div>

          {/* Price */}
          <div className="mb-6">
            <ProductPrice
              price={product.price}
              originalPrice={product.original_price}
              size="lg"
            />
          </div>

          {/* Shop Info */}
          {product.shop_name && (
            <div className="mb-6 p-4 bg-bg-light dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary dark:text-gray-400">
                    Sold by
                  </p>
                  <p className="font-medium text-text-main dark:text-gray-200">
                    {product.shop_name}
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/shops/${product.shop_id}`)}
                  className="text-primary hover:text-primary-hover font-medium"
                >
                  Visit Shop →
                </button>
              </div>
            </div>
          )}

          {/* Sizes */}
          {sizes.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-text-main dark:text-gray-200 mb-3">
                Select Size
              </h3>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size.size_label)}
                    className={`px-4 py-2 border rounded-lg transition-colors
                              ${
                                selectedSize === size.size_label
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border-default dark:border-gray-700 hover:border-primary"
                              }`}
                  >
                    {size.size_label}
                    {size.stock !== undefined && (
                      <span className="text-xs text-text-muted ml-2">
                        ({size.stock} left)
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-6">
            <h3 className="font-semibold text-text-main dark:text-gray-200 mb-3">
              Quantity
            </h3>
            <div className="flex items-center gap-4">
              <div
                className="flex items-center border border-border-default 
                           dark:border-gray-700 rounded-lg"
              >
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="px-6 py-3 text-lg font-medium">
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                  disabled={quantity >= 10}
                >
                  +
                </button>
              </div>
              <span className="text-sm text-text-secondary dark:text-gray-400">
                Only {product.stock || 10} items left
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-8">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add to Cart
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={handleBuyNow}
            >
              Buy Now
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg 
                           flex items-center justify-center"
              >
                <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-text-main dark:text-gray-200">
                  Free Delivery
                </p>
                <p className="text-sm text-text-secondary dark:text-gray-400">
                  On orders over ETB 500
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg 
                           flex items-center justify-center"
              >
                <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-text-main dark:text-gray-200">
                  7-Day Returns
                </p>
                <p className="text-sm text-text-secondary dark:text-gray-400">
                  Money back guarantee
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-text-main dark:text-gray-200 mb-4">
                Description
              </h3>
              <div className="prose max-w-none text-text-secondary dark:text-gray-400">
                {product.description.split("\n").map((line, i) => (
                  <p key={i} className="mb-3">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-text-main dark:text-gray-200 mb-6">
            Related Products
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => navigate(`/products/${product.id}`)}
                className="bg-white dark:bg-gray-800 border border-border-default 
                         dark:border-gray-700 rounded-lg p-4 hover:shadow-lg 
                         transition-all cursor-pointer"
              >
                <img
                  src={product.main_image || "/placeholder.jpg"}
                  alt={product.product_name}
                  className="w-full h-48 object-cover rounded-lg mb-3"
                />
                <h3 className="font-medium text-text-main dark:text-gray-200 mb-2">
                  {product.product_name}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-price">
                    ETB {product.price}
                  </span>
                  <ProductRating
                    rating={product.average_rating || 0}
                    size="sm"
                  />
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
