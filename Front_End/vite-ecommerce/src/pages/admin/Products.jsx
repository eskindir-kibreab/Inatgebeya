import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  Edit,
  Trash2,
  Eye,
  ToggleLeft,
  ToggleRight,
  Plus,
  Upload,
} from "lucide-react";
import { productsAPI } from "../../api/products.api";
import { categoriesAPI } from "../../api/categories.api";
import { shopsAPI } from "../../api/shops.api";
import Input from "../../components/forms/Input";
import Button from "../../components/forms/Button";
import Select from "../../components/forms/Select";
import AdminActiveFilters from "../../components/search/AdminActiveFilters";
import toast from "react-hot-toast";

const Products = () => {
  const [searchParams] = useSearchParams();
  const initialCategoryId = searchParams.get("category_id") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    category_id: initialCategoryId,
    is_active: "",
    include_inactive: true,
    page: 1,
    limit: 5,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0,
  });
  const [categories, setCategories] = useState([]);
  const [shops, setShops] = useState([]);
  const [formData, setFormData] = useState({
    product_name: "",
    category_id: "",
    shop_id: "",
    price: "",
    description: "",
    main_image: null,
  });

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

      // Clean filters to remove empty strings
      const cleanedFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== "" && v !== null)
      );

      console.log("Fetching products with params:", cleanedFilters);
      const response = await productsAPI.getAll({
        ...cleanedFilters,
        page: filters.page,
        limit: 5,
        _t: Date.now() // Cache buster
      });

      if (response.success) {
        const normalizedProducts = response.data.map((p) => ({
          ...p,
          id: p.product_id || p.id,
        }));
        // Strictly limit to 5 products for display
        const slicedProducts = normalizedProducts.slice(0, 5);

        setProducts(slicedProducts);

        const total = response.pagination.total;
        setPagination({
          ...response.pagination,
          total,
          limit: 5,
          totalPages: response.pagination.pages || Math.ceil(total / 5)
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

  const handleToggleStatus = async (productId, currentStatus) => {
    try {
      const response = await productsAPI.toggleStatus(productId, {
        is_active: !currentStatus,
      });
      if (response.success) {
        toast.success(
          `Product ${!currentStatus ? "activated" : "deactivated"}`
        );
        fetchProducts();
      }
    } catch (error) {
      console.error("Toggle status error:", error);
      toast.error(error.response?.data?.message || "Failed to update product status");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;

    try {
      const response = await productsAPI.delete(productId);
      if (response.success) {
        toast.success("Product deleted successfully");
        fetchProducts();
      }
    } catch (error) {
      console.error("Delete product error:", error);
      toast.error(error.response?.data?.message || "Failed to delete product");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, main_image: file }));
    }
  };

  const resetForm = () => {
    setFormData({
      product_name: "",
      category_id: "",
      shop_id: "",
      price: "",
      description: "",
      main_image: null,
    });
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();

    if (parseFloat(formData.price) <= 0) {
      toast.error("The price must be a positive number");
      return;
    }

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null && formData[key] !== "") {
        formDataToSend.append(key, formData[key]);
      }
    });

    try {
      const response = await productsAPI.create(formDataToSend);
      if (response.success) {
        toast.success("Product added successfully");
        setShowAddModal(false);
        resetForm();
        fetchProducts();
      }
    } catch (error) {
      console.error("Add product error:", error);
      toast.error(error.response?.data?.message || "Failed to add product");
    }
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
    // Use relative path to leverage vite proxy
    return path;
  };



  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-main dark:text-gray-200">
              Product Management
            </h1>
            <p className="text-text-secondary dark:text-gray-400 mt-2">
              Manage all products in the marketplace
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)} icon={Plus}>
            Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div
        className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                     dark:border-gray-700 p-6 mb-6"
      >
        <div className="mb-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                icon={Search}
              />
            </div>
          </div>
        </div>

        {/* Active Filters */}
        <AdminActiveFilters
          filters={filters}
          filterLabels={{
            category_id: {
              label: "Category",
              ...Object.fromEntries(
                categories.map((cat) => [cat.id, cat.category_name])
              ),
            },
            is_active: {
              label: "Status",
              true: "Active",
              false: "Inactive",
            },
          }}
          onRemoveFilter={handleRemoveFilter}
        />

        {/* Filter Options */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t 
                       border-border-default dark:border-gray-700"
        >
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
            value={filters.shop_id || ""}
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
      <div
        className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                     dark:border-gray-700 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default dark:border-gray-700">
                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200">
                  ID
                </th>
                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200">
                  Product
                </th>
                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200">
                  Category
                </th>
                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200">
                  Price
                </th>
                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200">
                  Status
                </th>
                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-6">
                    <div className="animate-pulse space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="h-12 bg-gray-200 dark:bg-gray-700 rounded"
                        ></div>
                      ))}
                    </div>
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((product) => (
                  <tr
                    key={product.product_id}
                    className="border-b border-border-default 
                                            dark:border-gray-700 hover:bg-bg-light 
                                            dark:hover:bg-gray-700"
                  >
                    <td className="p-6 font-mono text-xs text-text-secondary">
                      #{product.product_id}
                    </td>
                    <td className="p-6">

                      <div className="flex items-center gap-3">
                        <img
                          src={getImageUrl(product.main_image)}
                          alt={product.product_name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium text-text-main dark:text-gray-200">
                            {product.product_name}
                          </p>
                          <p className="text-sm text-text-secondary dark:text-gray-400">
                            {product.shop_name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="text-text-secondary dark:text-gray-400">
                        {product.category_name}
                      </span>
                    </td>
                    <td className="p-6 font-medium text-price">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="p-6">
                      <button
                        onClick={() =>
                          handleToggleStatus(product.id, product.is_active)
                        }
                        className="flex items-center gap-2"
                      >
                        {product.is_active ? (
                          <>
                            <ToggleRight className="w-6 h-6 text-green-600" />
                            <span className="text-green-600">Active</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-6 h-6 text-gray-400" />
                            <span className="text-gray-400">Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            (window.location.href = `/admin/products/${product.id}`)
                          }
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          title="View/Edit"
                        >
                          <Edit className="w-4 h-4 text-text-secondary" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-12 text-center">
                    <div className="text-4xl mb-4">📦</div>
                    <h3 className="text-lg font-semibold text-text-main dark:text-gray-200 mb-2">
                      No products found
                    </h3>
                    <p className="text-text-secondary dark:text-gray-400">
                      Try adjusting your search or filters
                    </p>
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
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} products
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleFilterChange("page", pagination.page - 1)
                  }
                  disabled={pagination.page <= 1}
                  className="px-4 py-2 border border-border-default dark:border-gray-700 rounded-lg 
                           disabled:opacity-50 disabled:cursor-not-allowed
                           hover:bg-bg-light dark:hover:bg-gray-700 transition-all duration-200
                           text-sm font-medium text-text-main dark:text-gray-200"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    handleFilterChange("page", pagination.page + 1)
                  }
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

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-text-main dark:text-gray-200 mb-6">
                Add New Product
              </h2>

              <form onSubmit={handleAddProduct}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <Input
                    label="Product Name"
                    value={formData.product_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        product_name: e.target.value,
                      }))
                    }
                    required
                  />

                  <Select
                    label="Category"
                    value={formData.category_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        category_id: e.target.value,
                      }))
                    }
                    options={[
                      { value: "", label: "Select Category" },
                      ...categories.map((cat) => ({
                        value: cat.id,
                        label: cat.category_name,
                      })),
                    ]}
                    required
                  />

                  <Select
                    label="Shop"
                    value={formData.shop_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        shop_id: e.target.value,
                      }))
                    }
                    options={[
                      { value: "", label: "Select Shop" },
                      ...shops.map((shop) => ({
                        value: shop.id,
                        label: shop.shop_name,
                      })),
                    ]}
                    required
                  />

                  <Input
                    label="Price (ETB)"
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-text-main dark:text-gray-200 mb-2">
                    Product Image
                  </label>
                  <div
                    className="border-2 border-dashed border-border-default 
                               dark:border-gray-700 rounded-lg p-8 text-center"
                  >
                    {formData.main_image ? (
                      <div>
                        <img
                          src={URL.createObjectURL(formData.main_image)}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-lg mx-auto mb-4"
                        />
                        <p className="text-sm text-text-secondary dark:text-gray-400">
                          {formData.main_image.name}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              main_image: null,
                            }))
                          }
                          className="text-red-600 text-sm mt-2"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-12 h-12 text-text-muted mx-auto mb-4" />
                        <p className="text-text-secondary dark:text-gray-400 mb-2">
                          Click to upload product image
                        </p>
                        <p className="text-xs text-text-muted">
                          PNG, JPG, WEBP up to 5MB
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          id="admin-product-image"
                        />
                        <label
                          htmlFor="admin-product-image"
                          className="inline-block mt-4 px-4 py-2 bg-primary text-white 
                                   rounded-lg cursor-pointer hover:bg-primary-hover"
                        >
                          Choose File
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-text-main dark:text-gray-200 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={4}
                    className="w-full px-4 py-3 border border-border-default 
                             dark:border-gray-700 rounded-lg focus:outline-none 
                             focus:ring-2 focus:ring-accent resize-none bg-white dark:bg-white text-black"
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="flex-1">
                    Add Product
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
