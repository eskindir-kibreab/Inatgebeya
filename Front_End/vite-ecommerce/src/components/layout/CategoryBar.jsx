import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { categoriesAPI } from "../../api/categories.api";

const CategoryBar = ({ onCategorySelect }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = React.useRef(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Sync active category with URL search param
    const searchParams = new URLSearchParams(location.search);
    const categoryId = searchParams.get("category");
    if (categoryId) {
      setActiveCategory(parseInt(categoryId));
    } else if (location.pathname === "/") {
      // On landing page, if no category in URL, no category is active (optional)
      // setActiveCategory(null); 
    }
  }, [location.search, location.pathname]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      if (response.success) {
        setCategories(response.data);
        // Default to first category if on landing page and none selected? 
        // Or leave it to show all. The user's landing page shows "Products" header.
        /* 
        if (response.data.length > 0 && !activeCategory) {
          // setActiveCategory(response.data[0].category_id);
        }
        */
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId) => {
    setActiveCategory(categoryId);
    if (onCategorySelect) {
      onCategorySelect(categoryId);
    } else {
      // Global behavior: navigate to search
      navigate(`/search?category=${categoryId}`);
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 border-b border-border-default dark:border-gray-700">
        <div className="container mx-auto px-4 py-3">
          <div className="flex space-x-4 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div key={`loading-category-${i}`} className="animate-pulse">
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-16 z-40 bg-white dark:bg-gray-800 border-b border-border-default dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center py-2">
          <button
            onClick={scrollLeft}
            className="p-2 mr-2 rounded-full hover:bg-bg-light dark:hover:bg-gray-700 
                     transition-colors flex-shrink-0"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 text-text-muted" />
          </button>

          <div
            ref={scrollContainerRef}
            className="flex space-x-4 overflow-x-auto scrollbar-hide py-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {categories.map((category, index) => (
              <div key={index} className="flex-shrink-0">
                <button
                  onClick={() => handleCategoryClick(category.category_id)}
                  className={`px-6 py-2 rounded-full whitespace-nowrap transition-all duration-200 
                           ${activeCategory == category.category_id
                      ? "bg-primary text-white font-medium"
                      : "bg-bg-light dark:bg-gray-700 text-text-secondary dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                >
                  {category.category_name}
                  {category.product_count > 0 && (
                    <span className="ml-2 text-xs opacity-75">
                      ({category.product_count})
                    </span>
                  )}
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={scrollRight}
            className="p-2 ml-2 rounded-full hover:bg-bg-light dark:hover:bg-gray-700 
                     transition-colors flex-shrink-0"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-text-muted" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryBar;
