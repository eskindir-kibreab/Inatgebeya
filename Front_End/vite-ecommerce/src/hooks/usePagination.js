import { useState, useMemo } from "react";

export const usePagination = (data = [], itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(itemsPerPage);

  const totalPages = Math.ceil(data.length / perPage);

  const currentData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    return data.slice(start, end);
  }, [data, currentPage, perPage]);

  const goToPage = (page) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  };

  const nextPage = () => {
    goToPage(currentPage + 1);
  };

  const prevPage = () => {
    goToPage(currentPage - 1);
  };

  const resetPagination = () => {
    setCurrentPage(1);
  };

  return {
    currentPage,
    currentData,
    totalPages,
    perPage,
    setPerPage,
    goToPage,
    nextPage,
    prevPage,
    resetPagination,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
};
