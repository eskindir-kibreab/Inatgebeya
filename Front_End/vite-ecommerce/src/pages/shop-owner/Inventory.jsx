import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Edit,
  Trash2,
  Plus,
  Package,
  AlertCircle,
} from "lucide-react";
import { productsAPI } from "../../api/products.api";
import Input from "../../components/forms/Input";
import Button from "../../components/forms/Button";
import Select from "../../components/forms/Select";
import toast from "react-hot-toast";

const ShopOwnerInventory = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    category_id: "",
    stock_status: "",
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    product_name: "",
    category_id: "",
    price: "",
    description: "",
    stock: "",
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Fetch products for this shop
      const response = await productsAPI.getAll({
        ...filters,
        shop_owner: true,
      });
      if (response.success) {
        setProducts(response.data);
        setPagination(response.pagination || {});
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
        setCategories(response.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();

    try {
      // In a real app, you would use the productsAPI.create method
      // with the shop_id automatically set to the owner's shop
      toast.success("Product added successfully");
      setShowAddModal(false);
      fetchProducts();
      resetForm();
    } catch (error) {
      toast.error("Failed to add product");
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const response = await productsAPI.update(selectedProduct.id, formData);
      if (response.success) {
        toast.success("Product updated successfully");
        setShowEditModal(false);
        fetchProducts();
        resetForm();
      }
    } catch (error) {
      toast.error("Failed to update product");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;

    try {
      // Shop owners can only delete products from their own shop
      const response = await productsAPI.delete(productId);
      if (response.success) {
        toast.success("Product deleted successfully");
        fetchProducts();
      }
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const handleUpdateStock = async (productId, newStock) => {
    try {
      const response = await productsAPI.updateStock(productId, {
        stock: newStock,
      });
      if (response.success) {
        toast.success("Stock updated successfully");
        fetchProducts();
      }
    } catch (error) {
      toast.error("Failed to update stock");
    }
  };

  const resetForm = () => {
    setFormData({
      product_name: "",
      category_id: "",
      price: "",
      description: "",
      stock: "",
    });
    setSelectedProduct(null);
  };

  const categoryOptions = [
    { value: "", label: "All Categories" },
    ...categories.map((cat) => ({
      value: cat.id,
      label: cat.category_name,
    })),
  ];

  const stockStatusOptions = [
    { value: "", label: "All Stock" },
    { value: "low", label: "Low Stock (< 10)" },
    { value: "out", label: "Out of Stock" },
    { value: "in", label: "In Stock" },
  ];

  const lowStockProducts = products.filter((p) => (p.stock || 0) < 10);
  const outOfStockProducts = products.filter((p) => (p.stock || 0) === 0);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-main dark:text-gray-200">
              Inventory Management
            </h1>
            <p className="text-text-secondary dark:text-gray-400 mt-2">
              Manage your shop's products and stock levels
            </p>
          </div>
          <Button onClick={() => navigate("/coming-soon")} icon={Plus}>
            Add Product
          </Button>
        </div>
      </div>

      {/* Stock Alerts */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="mb-6">
          {outOfStockProducts.length > 0 && (
            <div
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 
                          dark:border-red-800 rounded-xl p-6 mb-4"
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                <h3 className="font-semibold text-red-800 dark:text-red-300">
                  Out of Stock Products
                </h3>
              </div>
              <p className="text-red-700 dark:text-red-400 mb-4">
                {outOfStockProducts.length} products are out of stock. Restock
                them to continue selling.
              </p>
              <button
                onClick={() => handleFilterChange("stock_status", "out")}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 
                         text-sm font-medium"
              >
                View Out of Stock
              </button>
            </div>
          )}

          {lowStockProducts.length > 0 && (
            <div
              className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 
                          dark:border-yellow-800 rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">
                  Low Stock Products
                </h3>
              </div>
              <p className="text-yellow-700 dark:text-yellow-400 mb-4">
                {lowStockProducts.length} products have low stock. Consider
                restocking soon.
              </p>
              <button
                onClick={() => handleFilterChange("stock_status", "low")}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 
                         text-sm font-medium"
              >
                View Low Stock
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div
        className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                     dark:border-gray-700 p-6 mb-6"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchProducts();
          }}
          className="mb-4"
        >
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                icon={Search}
              />
            </div>
            <button type="submit" className="btn-primary px-8">
              Search
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 border border-border-default rounded-lg 
                       hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>
        </form>

        {showFilters && (
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t 
                         border-border-default dark:border-gray-700"
          >
            <Select
              label="Category"
              name="category_id"
              value={filters.category_id}
              onChange={(e) =>
                handleFilterChange("category_id", e.target.value)
              }
              options={categoryOptions}
            />
            <Select
              label="Stock Status"
              name="stock_status"
              value={filters.stock_status}
              onChange={(e) =>
                handleFilterChange("stock_status", e.target.value)
              }
              options={stockStatusOptions}
            />
          </div>
        )}
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
                  Product
                </th>
                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200">
                  Category
                </th>
                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200">
                  Price
                </th>
                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200">
                  Stock
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
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.main_image || "/placeholder.jpg"}
                          alt={product.product_name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium text-text-main dark:text-gray-200">
                            {product.product_name}
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
                      ETB {product.price?.toLocaleString()}
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          defaultValue={product.stock || 0}
                          onBlur={(e) =>
                            handleUpdateStock(
                              product.product_id,
                              parseInt(e.target.value)
                            )
                          }
                          className="w-20 px-3 py-1 border border-border-default 
                                   dark:border-gray-700 rounded text-center bg-white dark:bg-white text-black"
                        />
                        <span
                          className={`text-sm px-2 py-1 rounded-full
                                       ${(product.stock || 0) === 0
                              ? "bg-red-100 text-red-800 dark:bg-red-900/20"
                              : (product.stock || 0) < 10
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20"
                                : "bg-green-100 text-green-800 dark:bg-green-900/20"
                            }`}
                        >
                          {product.stock || 0}
                        </span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium
                                     ${(product.stock || 0) === 0
                            ? "bg-red-100 text-red-800 dark:bg-red-900/20"
                            : product.is_active
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                          }`}
                      >
                        {(product.stock || 0) === 0 ? "Out of Stock" : product.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate("/coming-soon")}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-text-secondary" />
                        </button>
                        <button
                          onClick={() => navigate("/coming-soon")}
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
                      {filters.search ||
                        filters.category_id ||
                        filters.stock_status
                        ? "Try adjusting your search or filters"
                        : "Add your first product to start selling"}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
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
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-border-default rounded-lg 
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    handleFilterChange("page", pagination.page + 1)
                  }
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 border border-border-default rounded-lg 
                           disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-text-main dark:text-gray-200 mb-6">
              Add New Product
            </h2>
            <form onSubmit={handleAddProduct}>
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
                options={categoryOptions.slice(1)}
                required
              />
              <Input
                label="Price (ETB)"
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, price: e.target.value }))
                }
                required
              />
              <Input
                label="Stock Quantity"
                type="number"
                value={formData.stock}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, stock: e.target.value }))
                }
                required
              />
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
                  rows={3}
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
                  onClick={() => setShowAddModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-text-main dark:text-gray-200 mb-6">
              Edit Product
            </h2>
            <form onSubmit={handleUpdateProduct}>
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
                options={categoryOptions.slice(1)}
                required
              />
              <Input
                label="Price (ETB)"
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, price: e.target.value }))
                }
                required
              />
              <Input
                label="Stock Quantity"
                type="number"
                value={formData.stock}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, stock: e.target.value }))
                }
                required
              />
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
                  rows={3}
                  className="w-full px-4 py-3 border border-border-default 
                           dark:border-gray-700 rounded-lg focus:outline-none 
                           focus:ring-2 focus:ring-accent resize-none bg-white dark:bg-white text-black"
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" className="flex-1">
                  Update Product
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowEditModal(false);
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
      )}
    </div>
  );
};

export default ShopOwnerInventory;
