import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
    Search,
    Eye,
} from "lucide-react";
import { productsAPI } from "../../api/products.api";
import { categoriesAPI } from "../../api/categories.api";
import { shopsAPI } from "../../api/shops.api";
import Input from "../../components/forms/Input";
import Select from "../../components/forms/Select";
import AdminActiveFilters from "../../components/search/AdminActiveFilters";
import toast from "react-hot-toast";

const AdminProducts = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialCategoryId = searchParams.get("category_id") || "";

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: "",
        category_id: initialCategoryId,
        shop_id: "",
        is_active: "",
        page: 1,
        limit: 10,
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });
    const [categories, setCategories] = useState([]);
    const [shops, setShops] = useState([]);

    useEffect(() => {
        fetchProducts();
    }, [filters]);

    useEffect(() => {
        fetchCategories();
        fetchShops();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);

            const cleanedFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== "" && v !== null)
            );

            const response = await productsAPI.getAll({
                ...cleanedFilters,
                page: filters.page,
                limit: filters.limit,
                _t: Date.now()
            });

            if (response.success) {
                const normalizedProducts = response.data.map((p) => ({
                    ...p,
                    id: p.product_id || p.id,
                }));

                setProducts(normalizedProducts);

                setPagination({
                    ...response.pagination,
                    totalPages: response.pagination.pages || Math.ceil(response.pagination.total / filters.limit)
                });
            }
        } catch (error) {
            toast.error("Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await categoriesAPI.getAll();
            if (response.success) {
                const normalized = response.data.map(cat => ({
                    ...cat,
                    id: cat.category_id || cat.id
                }));
                setCategories(normalized);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const fetchShops = async () => {
        try {
            const response = await shopsAPI.getAll();
            if (response.success) {
                const normalized = response.data.map(shop => ({
                    ...shop,
                    id: shop.shop_id || shop.id
                }));
                setShops(normalized);
            }
        } catch (error) {
            console.error("Error fetching shops:", error);
        }
    };

    const handleFilterChange = (name, value) => {
        setFilters((prev) => ({
            ...prev,
            [name]: value,
            page: name === "page" ? value : 1,
        }));
    };

    const handleRemoveFilter = (key) => {
        setFilters((prev) => ({ ...prev, [key]: "", page: 1 }));
    };

    const categoryOptions = [
        { value: "", label: "All Categories" },
        ...categories.map((cat) => ({
            value: cat.id,
            label: cat.category_name,
        })),
    ];

    const shopOptions = [
        { value: "", label: "All Shops" },
        ...shops.map((shop) => ({
            value: shop.id,
            label: shop.shop_name,
        })),
    ];

    const statusOptions = [
        { value: "", label: "All Status" },
        { value: "true", label: "Active" },
        { value: "false", label: "Inactive" },
    ];

    const formatCurrency = (amount) => {
        return `ETB ${amount?.toLocaleString() || "0"}`;
    };

    const getImageUrl = (path) => {
        if (!path) return "/placeholder.jpg";
        if (path.startsWith("http")) return path;
        return path;
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text-main dark:text-gray-200">
                        Product Catalog
                    </h1>
                    <p className="text-text-secondary dark:text-gray-400 mt-2">
                        View and monitor all products across the marketplace
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-border-default dark:border-gray-700 p-6 mb-6">
                <div className="mb-4">
                    <Input
                        placeholder="Search products..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange("search", e.target.value)}
                        icon={Search}
                    />
                </div>

                <AdminActiveFilters
                    filters={filters}
                    filterLabels={{
                        category_id: {
                            label: "Category",
                            ...Object.fromEntries(categories.map((cat) => [cat.id, cat.category_name])),
                        },
                        shop_id: {
                            label: "Shop",
                            ...Object.fromEntries(shops.map((shop) => [shop.id, shop.shop_name])),
                        },
                        is_active: {
                            label: "Status",
                            true: "Active",
                            false: "Inactive",
                        },
                    }}
                    onRemoveFilter={handleRemoveFilter}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border-default dark:border-gray-700">
                    <Select
                        label="Category"
                        name="category_id"
                        value={filters.category_id}
                        onChange={(e) => handleFilterChange("category_id", e.target.value)}
                        options={categoryOptions}
                    />
                    <Select
                        label="Shop"
                        name="shop_id"
                        value={filters.shop_id}
                        onChange={(e) => handleFilterChange("shop_id", e.target.value)}
                        options={shopOptions}
                    />
                    <Select
                        label="Status"
                        name="is_active"
                        value={filters.is_active}
                        onChange={(e) => handleFilterChange("is_active", e.target.value)}
                        options={statusOptions}
                    />
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-border-default dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border-default dark:border-gray-700">
                                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200">ID</th>
                                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200">Product</th>
                                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200">Shop</th>
                                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200">Category</th>
                                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200">Price</th>
                                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200">Status</th>
                                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-6">
                                        <div className="animate-pulse space-y-4">
                                            {[...Array(5)].map((_, i) => (
                                                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ) : products.length > 0 ? (
                                products.map((product) => (
                                    <tr key={product.id} className="border-b border-border-default dark:border-gray-700 hover:bg-bg-light dark:hover:bg-gray-700">
                                        <td className="p-6 font-mono text-xs text-text-secondary">#{product.id}</td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <img src={getImageUrl(product.main_image)} alt={product.product_name} className="w-12 h-12 object-cover rounded" />
                                                <p className="font-medium text-text-main dark:text-gray-200">{product.product_name}</p>
                                            </div>
                                        </td>
                                        <td className="p-6 text-text-secondary dark:text-gray-400">{product.shop_name}</td>
                                        <td className="p-6 text-text-secondary dark:text-gray-400">{product.category_name}</td>
                                        <td className="p-6 font-medium text-price">{formatCurrency(product.price)}</td>
                                        <td className="p-6">
                                            {product.is_active ? (
                                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>
                                            ) : (
                                                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Inactive</span>
                                            )}
                                        </td>
                                        <td className="p-6">
                                            <button
                                                onClick={() => navigate(`/admin/products/${product.id}`)}
                                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg group"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4 text-text-secondary group-hover:text-primary" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="p-12 text-center">
                                        <div className="text-4xl mb-4">📦</div>
                                        <h3 className="text-lg font-semibold text-text-main dark:text-gray-200 mb-2">No products found</h3>
                                        <p className="text-text-secondary dark:text-gray-400">There are no products matching your criteria</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {products.length > 0 && (
                    <div className="p-6 border-t border-border-default dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <p className="text-text-secondary dark:text-gray-400">
                                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleFilterChange("page", pagination.page - 1)}
                                    disabled={pagination.page <= 1}
                                    className="px-4 py-2 border border-border-default dark:border-gray-700 rounded-lg 
                           disabled:opacity-50 disabled:cursor-not-allowed
                           hover:bg-bg-light dark:hover:bg-gray-700 transition-all duration-200
                           text-sm font-medium text-text-main dark:text-gray-200"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => handleFilterChange("page", pagination.page + 1)}
                                    disabled={pagination.page >= (pagination.totalPages || 1)}
                                    className="px-4 py-2 border border-border-default dark:border-gray-700 rounded-lg 
                           disabled:opacity-50 disabled:cursor-not-allowed
                           hover:bg-bg-light dark:hover:bg-gray-700 transition-all duration-200
                           text-sm font-medium text-text-main dark:text-gray-200"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminProducts;
