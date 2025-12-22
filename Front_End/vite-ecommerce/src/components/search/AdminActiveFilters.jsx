import React from "react";
import { X } from "lucide-react";

const AdminActiveFilters = ({ filters, filterLabels = {}, onRemoveFilter }) => {
  const getFilterLabel = (key, value) => {
    // Check if we have custom labels for this filter
    if (filterLabels[key]) {
      const labelConfig = filterLabels[key];
      if (labelConfig[value]) {
        return `${labelConfig.label}: ${labelConfig[value]}`;
      }
      // If value exists but not in config, use default format
      if (labelConfig.label) {
        return `${labelConfig.label}: ${value}`;
      }
    }
    
    // Default labels
    switch (key) {
      case "role":
        return `Role: ${value}`;
      case "is_active":
        return `Status: ${value === "true" ? "Active" : value === "false" ? "Inactive" : value}`;
      case "category_id":
        return `Category: ${value}`;
      case "search":
        return null; // Don't show search as a filter badge
      default:
        return `${key}: ${value}`;
    }
  };

  const activeFilters = Object.entries(filters).filter(([key, value]) => {
    // Don't show page, limit, or search as active filters
    if (key === "page" || key === "limit" || key === "search") return false;
    return value && value !== "";
  });

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {activeFilters.map(([key, value]) => {
        const label = getFilterLabel(key, value);
        if (!label) return null;
        
        return (
          <div
            key={key}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary 
                     rounded-full text-sm"
          >
            <span>{label}</span>
            <button
              onClick={() => onRemoveFilter(key)}
              className="hover:bg-primary/20 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default AdminActiveFilters;

