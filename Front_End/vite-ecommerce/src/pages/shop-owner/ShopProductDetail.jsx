import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ChevronLeft,
    Save,
    Upload,
    Trash2,
    Package,
    Tag,
    DollarSign,
} from "lucide-react";
import { productsAPI } from "../../api/products.api";
import { categoriesAPI } from "../../api/categories.api";
import Button from "../../components/forms/Button";
import Input from "../../components/forms/Input";
import Select from "../../components/forms/Select";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { getImageUrl } from "../../utils/image";

const ShopProductDetail = () => {
    const { productId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [product, setProduct] = useState(null);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        product_name: "",
        category_id: "",
        price: "",
        stock: "",
        description: "",
        is_active: true,
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [newImage, setNewImage] = useState(null);

    useEffect(() => {
        fetchInitialData();
    }, [productId]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [productRes, categoriesRes] = await Promise.all([
                productsAPI.getById(productId),
                categoriesAPI.getAll(),
            ]);

            if (productRes.success) {
                const prod = productRes.data;

                // Debug logging
                console.log("Product data:", prod);
                console.log("User data:", user);
                console.log("Product shop_id:", prod.shop_id);
                console.log("User shop_id:", user?.shop_id);
                console.log("User role:", user?.role_name);

                // Security check: Ensure product belongs to this shop
                // Backend enforces strict ownership check, so we can relax the frontend check
                // to avoid blocking users due to potential state sync issues
                // if (user?.role_name === "shop_owner" && prod.shop_id != user?.shop_id) {
                //     console.warn("Frontend ID mismatch warning:", prod.shop_id, user?.shop_id);
                // }

                setProduct(prod);
                setFormData({
                    product_name: prod.product_name || "",
                    category_id: prod.category_id || "",
                    price: prod.price || "",
                    stock: prod.stock || 0,
                    description: prod.description || "",
                    is_active: prod.is_active,
                });
                setImagePreview(prod.main_image);
            }

            if (categoriesRes.success) {
                const normalized = categoriesRes.data.map(cat => ({
                    ...cat,
                    id: cat.category_id || cat.id
                }));
                setCategories(normalized);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load product details");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.product_name.trim().length < 3) {
            toast.error("Product name must be at least 3 characters");
            return;
        }

        if (parseFloat(formData.price) <= 0) {
            toast.error("The price must be a positive number");
            return;
        }

        try {
            setSaving(true);

            const submitData = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== null && formData[key] !== undefined && formData[key] !== "") {
                    submitData.append(key, formData[key]);
                }
            });

            if (newImage) {
                submitData.append("main_image", newImage);
            }

            // Don't send shop_id - backend validates ownership based on auth token
            // The product already belongs to a shop and can't be transferred

            const response = await productsAPI.update(productId, submitData);

            if (response.success) {
                toast.success("Product updated successfully");
                fetchInitialData();
            }
        } catch (error) {
            console.error("Update error:", error);
            toast.error(error.response?.data?.message || "Failed to update product");
        } finally {
            setSaving(false);
        }
    };

    const categoryOptions = categories.map((cat) => ({
        value: cat.id,
        label: cat.category_name,
    }));

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-12">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/shop-owner/inventory")}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-text-main dark:text-gray-200"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-text-main dark:text-gray-200">
                            Edit Product
                        </h1>
                        <p className="text-text-secondary dark:text-gray-400">
                            Update product details and manage availability
                        </p>
                    </div>
                </div>
                <Button
                    onClick={handleSubmit}
                    loading={saving}
                    icon={Save}
                >
                    Save Changes
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-border-default dark:border-gray-700 shadow-sm">
                        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-text-main dark:text-gray-200">
                            <Package className="w-5 h-5 text-primary" />
                            Basic Information
                        </h2>

                        <div className="space-y-4">
                            <Input
                                label="Product Name"
                                name="product_name"
                                value={formData.product_name}
                                onChange={handleInputChange}
                                required
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    label="Category"
                                    name="category_id"
                                    value={formData.category_id}
                                    onChange={handleInputChange}
                                    options={categoryOptions}
                                    required
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Price (ETB)"
                                        name="price"
                                        type="number"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        icon={DollarSign}
                                        required
                                    />
                                    <Input
                                        label="Stock"
                                        name="stock"
                                        type="number"
                                        value={formData.stock}
                                        onChange={handleInputChange}
                                        icon={Package}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-main dark:text-gray-200 mb-2">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={6}
                                    className="w-full px-4 py-3 border border-border-default 
                           dark:border-gray-700 rounded-lg focus:outline-none 
                           focus:ring-2 focus:ring-accent resize-none bg-white dark:bg-gray-900 text-text-main"
                                    placeholder="Tell customers more about this product..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-border-default dark:border-gray-700 shadow-sm">
                        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-text-main dark:text-gray-200">
                            <Tag className="w-5 h-5 text-primary" />
                            Settings
                        </h2>

                        <div className="flex items-center justify-between p-4 bg-bg-light dark:bg-gray-900 rounded-lg">
                            <div>
                                <p className="font-medium text-text-main dark:text-gray-200">Product Status</p>
                                <p className="text-sm text-text-secondary dark:text-gray-400">
                                    Visible to customers when active
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    checked={formData.is_active}
                                    onChange={handleInputChange}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
                                peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full 
                                peer dark:bg-gray-700 peer-checked:after:translate-x-full 
                                peer-checked:after:border-white after:content-[''] after:absolute 
                                after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 
                                after:border after:rounded-full after:h-5 after:w-5 after:transition-all 
                                dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-border-default dark:border-gray-700 shadow-sm">
                        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-text-main dark:text-gray-200">
                            <Upload className="w-5 h-5 text-primary" />
                            Product Image
                        </h2>

                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-border-default dark:border-gray-700 rounded-xl p-4 text-center">
                                {imagePreview ? (
                                    <div className="relative group">
                                        <img
                                            src={getImageUrl(imagePreview)}
                                            alt="Product Preview"
                                            className="w-full h-48 object-cover rounded-lg"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                            <label htmlFor="image-upload" className="p-2 bg-white rounded-full cursor-pointer hover:bg-gray-100">
                                                <Upload className="w-5 h-5 text-gray-800" />
                                            </label>
                                        </div>
                                    </div>
                                ) : (
                                    <label htmlFor="image-upload" className="cursor-pointer">
                                        <div className="py-8">
                                            <Upload className="w-12 h-12 text-text-muted mx-auto mb-2" />
                                            <p className="text-sm text-text-secondary dark:text-gray-400">Click to upload image</p>
                                        </div>
                                    </label>
                                )}
                                <input
                                    id="image-upload"
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                            </div>
                            <p className="text-xs text-text-muted text-center">
                                Recommended size: 800x800px. JPG, PNG or WEBP.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-border-default dark:border-gray-700 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 text-text-main dark:text-gray-200">Quick Stats</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-text-secondary dark:text-gray-400">Total Sales</span>
                                <span className="font-medium text-text-main dark:text-gray-200">{product?.sold_count || 0}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-text-secondary dark:text-gray-400">Rating</span>
                                <span className="font-medium text-yellow-500">
                                    ★ {product?.average_rating || 0} ({product?.review_count || 0})
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-text-secondary dark:text-gray-400">Created At</span>
                                <span className="font-medium text-text-main dark:text-gray-200">
                                    {product?.created_at ? new Date(product.created_at).toLocaleDateString() : ""}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-6 border border-red-100 dark:border-red-900/20 shadow-sm">
                        <h2 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
                            <Trash2 className="w-5 h-5" />
                            Danger Zone
                        </h2>
                        <p className="text-sm text-red-600/80 mb-4">
                            Once you delete a product, it cannot be recovered. Please be certain.
                        </p>
                        <Button
                            variant="outline"
                            className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20"
                            onClick={async () => {
                                if (window.confirm("Are you sure you want to delete this product?")) {
                                    try {
                                        const response = await productsAPI.delete(productId);
                                        if (response.success) {
                                            toast.success("Product deleted successfully");
                                            navigate("/shop-owner/inventory");
                                        }
                                    } catch (error) {
                                        toast.error("Failed to delete product");
                                    }
                                }
                            }}
                        >
                            Delete Product
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShopProductDetail;
