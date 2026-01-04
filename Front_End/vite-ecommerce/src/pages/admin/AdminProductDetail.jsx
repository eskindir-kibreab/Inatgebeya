import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ChevronLeft,
    Package,
    Store,
    Tag,
    DollarSign,
    Calendar,
    BarChart2,
} from "lucide-react";
import { productsAPI } from "../../api/products.api";
import { categoriesAPI } from "../../api/categories.api";
import { shopsAPI } from "../../api/shops.api";
import Button from "../../components/forms/Button";
import toast from "react-hot-toast";
import { getImageUrl } from "../../utils/image";

const AdminProductDetail = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState(null);
    const [categories, setCategories] = useState([]);
    const [shops, setShops] = useState([]);

    useEffect(() => {
        fetchInitialData();
    }, [productId]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [productRes, categoriesRes, shopsRes] = await Promise.all([
                productsAPI.getById(productId),
                categoriesAPI.getAll(),
                shopsAPI.getAll(),
            ]);

            if (productRes.success) {
                setProduct(productRes.data);
            }

            if (categoriesRes.success) {
                setCategories(categoriesRes.data);
            }

            if (shopsRes.success) {
                setShops(shopsRes.data);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load product details");
        } finally {
            setLoading(false);
        }
    };

    const getCategoryName = (id) => {
        const cat = categories.find(c => (c.category_id || c.id) == id);
        return cat ? cat.category_name : "Unknown";
    };

    const getShopName = (id) => {
        const shop = shops.find(s => (s.shop_id || s.id) == id);
        return shop ? shop.shop_name : "Unknown";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="text-center py-12">
                <p className="text-text-secondary">Product not found</p>
                <Button onClick={() => navigate("/admin/products")} className="mt-4">
                    Back to Products
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/admin/products")}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-text-main dark:text-gray-200"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-text-main dark:text-gray-200">
                            Product Details
                        </h1>
                        <p className="text-text-secondary dark:text-gray-400">
                            Review product information and performance
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-border-default dark:border-gray-700 shadow-sm">
                        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-text-main dark:text-gray-200">
                            <Package className="w-5 h-5 text-primary" />
                            Basic Information
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-1">
                                    Product Name
                                </label>
                                <p className="text-lg font-medium text-text-main dark:text-gray-200">
                                    {product.product_name}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-1">
                                        Category
                                    </label>
                                    <div className="flex items-center gap-2 text-text-main dark:text-gray-200">
                                        <Tag className="w-4 h-4 text-text-muted" />
                                        <span>{getCategoryName(product.category_id)}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-1">
                                        Shop Owner
                                    </label>
                                    <div className="flex items-center gap-2 text-text-main dark:text-gray-200">
                                        <Store className="w-4 h-4 text-text-muted" />
                                        <span>{getShopName(product.shop_id)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-1">
                                        Price
                                    </label>
                                    <div className="flex items-center gap-2 text-text-main dark:text-gray-200">
                                        <DollarSign className="w-4 h-4 text-text-muted" />
                                        <span className="font-semibold text-price">
                                            ETB {product.price?.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-1">
                                        Stock
                                    </label>
                                    <div className="flex items-center gap-2 text-text-main dark:text-gray-200">
                                        <Package className="w-4 h-4 text-text-muted" />
                                        <span className={`font-medium ${(product.stock || 0) > 10
                                            ? "text-green-600"
                                            : (product.stock || 0) > 0
                                                ? "text-yellow-600"
                                                : "text-red-600"
                                            }`}>
                                            {product.stock || 0} in stock
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-1">
                                        Status
                                    </label>
                                    {product.is_active ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Active
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            Inactive
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-1">
                                    Description
                                </label>
                                <p className="text-text-main dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {product.description || "No description provided."}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-border-default dark:border-gray-700 shadow-sm">
                        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-text-main dark:text-gray-200">
                            <BarChart2 className="w-5 h-5 text-primary" />
                            Performance Stats
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-4 bg-bg-light dark:bg-gray-900 rounded-xl">
                                <p className="text-sm text-text-secondary dark:text-gray-400 mb-1">Total Sales</p>
                                <p className="text-2xl font-bold text-text-main dark:text-gray-100">{product.sold_count || 0}</p>
                            </div>
                            <div className="p-4 bg-bg-light dark:bg-gray-900 rounded-xl">
                                <p className="text-sm text-text-secondary dark:text-gray-400 mb-1">Rating</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-2xl font-bold text-text-main dark:text-gray-100">{product.average_rating || 0}</p>
                                    <span className="text-yellow-500">★</span>
                                </div>
                            </div>
                            <div className="p-4 bg-bg-light dark:bg-gray-900 rounded-xl">
                                <p className="text-sm text-text-secondary dark:text-gray-400 mb-1">Reviews</p>
                                <p className="text-2xl font-bold text-text-main dark:text-gray-100">{product.review_count || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-border-default dark:border-gray-700 shadow-sm">
                        <h2 className="text-lg font-semibold mb-6 text-text-main dark:text-gray-200">Product Image</h2>
                        <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900">
                            <img
                                src={getImageUrl(product.main_image)}
                                alt={product.product_name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-border-default dark:border-gray-700 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 text-text-main dark:text-gray-200">Information</h2>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar className="w-4 h-4 text-text-muted" />
                                <div className="flex flex-col">
                                    <span className="text-text-secondary dark:text-gray-400">Created At</span>
                                    <span className="font-medium text-text-main dark:text-gray-200">
                                        {new Date(product.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar className="w-4 h-4 text-text-muted" />
                                <div className="flex flex-col">
                                    <span className="text-text-secondary dark:text-gray-400">Last Updated</span>
                                    <span className="font-medium text-text-main dark:text-gray-200">
                                        {new Date(product.updated_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProductDetail;
