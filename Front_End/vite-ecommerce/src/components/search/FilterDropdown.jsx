import React, { useState, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import { categoriesAPI } from "../../api/categories.api";
import { areasAPI } from "../../api/areas.api";

const FilterDropdown = ({ onFilterChange, currentFilters }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState({
    categories: false,
    areas: false,
  });
  const [filters, setFilters] = useState({
    category_id: currentFilters.category_id || "",
    area_id: currentFilters.area_id || "",
    min_price: currentFilters.min_price || "",
    max_price: currentFilters.max_price || "",
    sort_by: currentFilters.sort_by || "newest",
  });

  useEffect(() => {
    fetchFiltersData();
  }, []);

  const fetchFiltersData = async () => {
    try {
      setLoading((prev) => ({ ...prev, categories: true }));
      const categoriesRes = await categoriesAPI.getAll();
      if (categoriesRes.success) {
        setCategories(categoriesRes.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading((prev) => ({ ...prev, categories: false }));
    }

    try {
      setLoading((prev) => ({ ...prev, areas: true }));
      const areasRes = await areasAPI.getAll();
      if (areasRes.success) {
        setAreas(areasRes.data);
      }
    } catch (error) {
      console.error("Error fetching areas:", error);
    } finally {
      setLoading((prev) => ({ ...prev, areas: false }));
    }
  };

  const handleFilterChange = (name, value) => {
    const updatedFilters = { ...filters, [name]: value };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      category_id: "",
      area_id: "",
      min_price: "",
      max_price: "",
      sort_by: "newest",
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters = () => {
    return (
      filters.category_id ||
      filters.area_id ||
      filters.min_price ||
      filters.max_price ||
      filters.sort_by !== "newest"
    );
  };

  return (
    <div className="relative">
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors
                   ${
                     hasActiveFilters()
                       ? "border-primary bg-primary/10 text-primary"
                       : "border-border-default dark:border-gray-700 hover:border-primary"
                   }`}
      >
        <span>Filters</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
        {hasActiveFilters() && (
          <span className="w-2 h-2 bg-primary rounded-full"></span>
        )}
      </button>

      {/* Filter Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 
                      rounded-xl border border-border-default dark:border-gray-700 
                      shadow-lg z-50 animate-slide-down"
        >
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text-main dark:text-gray-200">
                Filter Products
              </h3>
              <div className="flex items-center gap-2">
                {hasActiveFilters() && (
                  <button
                    onClick={handleClearFilters}
                    className="text-sm text-primary hover:text-primary-hover"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Category Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-main dark:text-gray-200 mb-2">
                Category
              </label>
              {loading.categories ? (
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <select
                  value={filters.category_id}
                  onChange={(e) =>
                    handleFilterChange("category_id", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-border-default dark:border-gray-700 
                           rounded-lg bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.category_name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Area Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-main dark:text-gray-200 mb-2">
                Area
              </label>
              {loading.areas ? (
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <select
                  value={filters.area_id}
                  onChange={(e) =>
                    handleFilterChange("area_id", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-border-default dark:border-gray-700 
                           rounded-lg bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="">All Areas</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.area_name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Price Range */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-main dark:text-gray-200 mb-2">
                Price Range (ETB)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.min_price}
                    onChange={(e) =>
                      handleFilterChange("min_price", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-border-default dark:border-gray-700 
                             rounded-lg text-sm"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.max_price}
                    onChange={(e) =>
                      handleFilterChange("max_price", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-border-default dark:border-gray-700 
                             rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Sort By */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-main dark:text-gray-200 mb-2">
                Sort By
              </label>
              <select
                value={filters.sort_by}
                onChange={(e) => handleFilterChange("sort_by", e.target.value)}
                className="w-full px-3 py-2 border border-border-default dark:border-gray-700 
                         rounded-lg bg-white dark:bg-gray-800 text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters() && (
              <div className="mt-4 p-3 bg-bg-light dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-text-secondary dark:text-gray-400 mb-2">
                  Active filters:
                </p>
                <div className="flex flex-wrap gap-2">
                  {filters.category_id && (
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                      Category:{" "}
                      {
                        categories.find((c) => c.id === filters.category_id)
                          ?.category_name
                      }
                    </span>
                  )}
                  {filters.area_id && (
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                      Area:{" "}
                      {areas.find((a) => a.id === filters.area_id)?.area_name}
                    </span>
                  )}
                  {filters.min_price && (
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                      Min: ETB {filters.min_price}
                    </span>
                  )}
                  {filters.max_price && (
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                      Max: ETB {filters.max_price}
                    </span>
                  )}
                  {filters.sort_by !== "newest" && (
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                      Sort: {filters.sort_by.replace("_", " ")}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Close on click outside */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};

export default FilterDropdown;
