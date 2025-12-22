import React from "react";
import { X } from "lucide-react";

const ActiveFilters = ({ filters, categories, areas, onRemoveFilter }) => {
  const getFilterLabel = (key, value) => {
    switch (key) {
      case "category_id":
        const category = categories?.find((c) => c.id === value);
        return `Category: ${category?.category_name || value}`;
      case "area_id":
        const area = areas?.find((a) => a.id === value);
        return `Area: ${area?.area_name || value}`;
      case "min_price":
        return `Min Price: ETB ${value}`;
      case "max_price":
        return `Max Price: ETB ${value}`;
      case "sort_by":
        return `Sort: ${value.replace("_", " ")}`;
      default:
        return `${key}: ${value}`;
    }
  };

  const activeFilters = Object.entries(filters).filter(([key, value]) => {
    if (key === "sort_by" && value === "newest") return false;
    return value && value !== "";
  });

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {activeFilters.map(([key, value]) => (
        <div
          key={key}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary 
                   rounded-full text-sm"
        >
          <span>{getFilterLabel(key, value)}</span>
          <button
            onClick={() => onRemoveFilter(key)}
            className="hover:bg-primary/20 rounded-full p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ActiveFilters;
