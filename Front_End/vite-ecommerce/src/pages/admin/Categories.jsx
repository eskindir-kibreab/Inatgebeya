import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Package, Search } from "lucide-react";
import { categoriesAPI } from "../../api/categories.api";
import Input from "../../components/forms/Input";
import Button from "../../components/forms/Button";
import toast from "react-hot-toast";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    category_name: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = categories.filter((cat) =>
        cat.category_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
  }, [searchQuery, categories]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoriesAPI.getAll({ stats: true });
      if (response.success) {
        setCategories(response.data);
        setFilteredCategories(response.data);
      }
    } catch (error) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const response = await categoriesAPI.create(formData);
      if (response.success) {
        toast.success("Category created successfully");
        setShowCreateModal(false);
        fetchCategories();
        resetForm();
      }
    } catch (error) {
      toast.error("Failed to create category");
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!selectedCategory) return;

    try {
      const response = await categoriesAPI.update(
        selectedCategory.id,
        formData
      );
      if (response.success) {
        toast.success("Category updated successfully");
        setShowEditModal(false);
        fetchCategories();
        resetForm();
      }
    } catch (error) {
      toast.error("Failed to update category");
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm("Are you sure you want to delete this category?"))
      return;

    try {
      const response = await categoriesAPI.delete(categoryId);
      if (response.success) {
        toast.success("Category deleted successfully");
        fetchCategories();
      }
    } catch (error) {
      toast.error("Failed to delete category");
    }
  };

  const resetForm = () => {
    setFormData({ category_name: "" });
    setSelectedCategory(null);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-main dark:text-gray-200">
              Categories
            </h1>
            <p className="text-text-secondary dark:text-gray-400 mt-2">
              Manage product categories
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} icon={Plus}>
            Add Category
          </Button>
        </div>
      </div>

      {/* Search Filter */}
      <div
        className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                     dark:border-gray-700 p-6 mb-6"
      >
        <Input
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={Search}
        />
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                       dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedCategory(category);
                      setFormData({ category_name: category.category_name });
                      setShowEditModal(true);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <Edit className="w-4 h-4 text-text-secondary" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-text-main dark:text-gray-200 mb-2">
                {category.category_name}
              </h3>

              <div className="mt-4 p-4 bg-bg-light dark:bg-gray-700 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {category.product_count || 0}
                    </div>
                    <div className="text-sm text-text-secondary dark:text-gray-400">
                      Products
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">
                      {category.active_products || 0}
                    </div>
                    <div className="text-sm text-text-secondary dark:text-gray-400">
                      Active
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() =>
                    (window.location.href = `/search?category=${category.id}`)
                  }
                  className="w-full py-2 border border-primary text-primary 
                           hover:bg-primary/10 rounded-lg font-medium"
                >
                  View Products
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-border-default dark:border-gray-700 p-12 text-center">
          <div className="text-4xl mb-4">📁</div>
          <h3 className="text-lg font-semibold text-text-main dark:text-gray-200 mb-2">
            No categories found
          </h3>
          <p className="text-text-secondary dark:text-gray-400">
            {searchQuery
              ? "Try adjusting your search"
              : "Create your first category"}
          </p>
        </div>
      )}

      {/* Create Category Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-text-main dark:text-gray-200 mb-6">
              Create New Category
            </h2>
            <form onSubmit={handleCreateCategory}>
              <Input
                label="Category Name"
                value={formData.category_name}
                onChange={(e) => setFormData({ category_name: e.target.value })}
                placeholder="Enter category name"
                required
              />
              <div className="flex gap-3 mt-6">
                <Button type="submit" className="flex-1">
                  Create Category
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && selectedCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-text-main dark:text-gray-200 mb-6">
              Edit Category
            </h2>
            <form onSubmit={handleUpdateCategory}>
              <Input
                label="Category Name"
                value={formData.category_name}
                onChange={(e) => setFormData({ category_name: e.target.value })}
                placeholder="Enter category name"
                required
              />
              <div className="flex gap-3 mt-6">
                <Button type="submit" className="flex-1">
                  Update Category
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

export default Categories;
