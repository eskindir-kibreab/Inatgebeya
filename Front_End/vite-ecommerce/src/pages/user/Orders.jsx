import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { ordersAPI } from "../../api/orders.api";
import { format, parseISO } from "date-fns";
import {
  Loader2,
  Package,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Info,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Smartphone,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/forms/Button";
import toast from "react-hot-toast";
import OrderStatusBadge from "../../components/orders/OrderStatusBadge";
import OrderDetailsModal from "../../components/orders/OrderDetailsModal";

const ITEMS_PER_PAGE = 5;

const statusFilters = [
  { id: "all", label: "All Orders" },
  { id: "pending", label: "Pending" },
  { id: "processing", label: "Processing" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

const sortOptions = [
  { id: "newest", label: "Newest First" },
  { id: "oldest", label: "Oldest First" },
  { id: "price_high", label: "Total: High to Low" },
  { id: "price_low", label: "Total: Low to High" },
];

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Filters and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [totalPages, setTotalPages] = useState(1); // Added totalPages state

  // Fetch orders with error handling and loading states
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching orders for user:", user);
      const response = await ordersAPI.getMyOrders({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        status: statusFilter === "all" ? undefined : statusFilter, // Changed to statusFilter
        search: searchQuery, // Kept search
        sort: sortBy, // Kept sort
      });
      console.log("Orders API response:", response);

      if (response.success) {
        // The API returns orders directly in response.data (array)
        const ordersData = Array.isArray(response.data) ? response.data : (response.data.orders || []);
        setOrders(ordersData);
        setFilteredOrders(ordersData);
        setTotalPages(response.pagination?.totalPages || 1);
      } else {
        throw new Error(response.message || "Failed to load orders");
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      console.error("Error response:", err.response?.data);
      setError(err.response?.data?.message || "Failed to load orders");
      toast.error(err.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, sortBy, currentPage]);

  // Initial fetch and on filter/sort changes
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Filter and sort orders client-side if not handled by API
  useEffect(() => {
    let result = [...orders];

    // Apply filters
    if (statusFilter !== "all") {
      result = result.filter(
        (order) => order.status.toLowerCase() === statusFilter
      );
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (order) =>
          order.id.toString().includes(query) ||
          order.items?.some((item) =>
            item.product?.name?.toLowerCase().includes(query)
          )
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at) - new Date(a.created_at);
        case "oldest":
          return new Date(a.created_at) - new Date(b.created_at);
        case "price_high":
          return b.total - a.total;
        case "price_low":
          return a.total - b.total;
        default:
          return 0;
      }
    });

    setFilteredOrders(result);
    setCurrentPage(1); // Reset to first page on filter/sort change
  }, [orders, statusFilter, searchQuery, sortBy]);

  // Handle order details view
  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    try {
      setCancelling(orderId);
      const response = await ordersAPI.cancel(orderId);

      if (response.success) {
        toast.success("Order cancelled successfully");
        // Refresh orders
        fetchOrders();
      } else {
        toast.error(response.message || "Failed to cancel order");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Failed to cancel order. Please try again.");
    } finally {
      setCancelling(null);
    }
  };

  const handleConfirmReceipt = async (orderId) => {
    if (!window.confirm("Confirm that you have received this order?")) return;

    try {
      setLoading(true);
      const response = await ordersAPI.updateStatus(orderId, { status: "completed" });

      if (response.success) {
        toast.success("Order confirmed as received");
        fetchOrders();
      } else {
        toast.error(response.message || "Failed to confirm receipt");
      }
    } catch (error) {
      console.error("Error confirming receipt:", error);
      toast.error("Failed to confirm receipt. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center p-6 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error loading orders
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={fetchOrders} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Calculate pagination from filtered orders
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Orders
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              View and manage your orders
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => fetchOrders()}
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Search and Filter Bar */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:text-white"
                placeholder="Search orders by ID or product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter & Sort
                {showFilters ? (
                  <ChevronUp className="ml-2 h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-2 h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Order Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {statusFilters.map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setStatusFilter(filter.id)}
                        className={`px-3 py-1.5 text-sm rounded-full flex items-center ${statusFilter === filter.id
                          ? "bg-primary-100 text-primary-800 border border-primary-300 dark:bg-primary-900/20 dark:text-primary-300"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                          }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sort By
                  </label>
                  <select
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    {sortOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No orders yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You haven't placed any orders yet.
          </p>
          <Link to="/" className="inline-block">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedOrders.map((order) => {
            const orderDate = parseISO(order.created_at);
            const totalItems =
              order.items?.reduce(
                (sum, item) => sum + (item.quantity || 0),
                0
              ) || 0;

            return (
              <div
                key={order.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex flex-wrap justify-between items-center">
                  <div className="mb-2 sm:mb-0">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Order #{order.id}
                      </span>
                      <OrderStatusBadge
                        status={order.status}
                        className="ml-2"
                      />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Placed on {format(orderDate, "MMM d, yyyy")} •{" "}
                      {order.items?.length || 0}{" "}
                      {order.items?.length === 1 ? "item" : "items"}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    ETB {order.total?.toLocaleString()}
                  </div>
                </div>

                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Delivery Address
                      </h4>
                      <div className="text-sm text-gray-900 dark:text-gray-200 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                        {order.delivery_address ? (
                          <>
                            <p className="font-medium">
                              {order.customer_name || "No name provided"}
                            </p>
                            <p>{order.delivery_address}</p>
                            <p className="mt-1 text-gray-600 dark:text-gray-400">
                              {order.area_name && `Area: ${order.area_name}`}
                            </p>
                          </>
                        ) : (
                          <p className="text-gray-500 italic">
                            No shipping address provided
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Payment Method
                      </h4>
                      <div className="text-sm p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                        {order.payment_method ? (
                          <div className="flex items-center">
                            <div className="bg-white dark:bg-gray-800 p-1.5 rounded-md border border-gray-200 dark:border-gray-700 mr-3">
                              {order.payment_method === "credit_card" ? (
                                <CreditCard className="h-5 w-5 text-blue-500" />
                              ) : order.payment_method === "mobile_banking" ? (
                                <Smartphone className="h-5 w-5 text-purple-500" />
                              ) : (
                                <DollarSign className="h-5 w-5 text-green-500" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium dark:text-white">
                                {order.payment_method === "credit_card"
                                  ? "Credit/Debit Card"
                                  : order.payment_method === "mobile_banking"
                                    ? "Mobile Banking"
                                    : "Cash on Delivery"}
                              </p>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${order.payment_status === "paid"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                                  }`}
                              >
                                {order.payment_status?.charAt(0).toUpperCase() +
                                  order.payment_status?.slice(1) || "Pending"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">
                            No payment method selected
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Order Summary
                      </h4>
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md text-sm">
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Subtotal ({totalItems} items):
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              ETB {order.subtotal?.toLocaleString() || "0.00"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Shipping:
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              ETB{" "}
                              {order.shipping_fee?.toLocaleString() || "0.00"}
                            </span>
                          </div>
                          {order.discount > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">
                                Discount:
                              </span>
                              <span className="text-green-600 dark:text-green-400">
                                -ETB{" "}
                                {order.discount?.toLocaleString() || "0.00"}
                              </span>
                            </div>
                          )}
                          <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                          <div className="flex justify-between font-medium">
                            <span className="dark:text-white">Total:</span>
                            <span className="text-lg dark:text-white">
                              ETB {order.total?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Order Items
                    </h4>
                    <div className="space-y-4">
                      {order.items?.map((item) => (
                        <div
                          key={item.order_item_id}
                          className="flex items-start"
                        >
                          <div className="flex-shrink-0 w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden">
                            {item.main_image ? (
                              <img
                                src={item.main_image}
                                alt={item.product_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-600">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="flex justify-between">
                              <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                                {item.product_name || "Product not available"}
                              </h5>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                ETB {item.price?.toLocaleString()}
                              </p>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Qty: {item.quantity}
                              {item.size_label && ` • Size: ${item.size_label}`}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Total: ETB{" "}
                              {(item.price * item.quantity).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap justify-between items-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {order.updated_at && (
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>
                            Last updated:{" "}
                            {format(
                              parseISO(order.updated_at),
                              "MMM d, yyyy h:mm a"
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/coming-soon")}
                      >
                        <Info className="w-4 h-4 mr-1.5" />
                        View Details
                      </Button>

                      {order.status?.toLowerCase() === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                          onClick={() => handleCancelOrder(order.order_id)}
                          disabled={cancelling === order.order_id}
                        >
                          <XCircle className="w-4 h-4 mr-1.5" />
                          {cancelling === order.order_id
                            ? "Cancelling..."
                            : "Cancel Order"}
                        </Button>
                      )}

                      {order.status?.toLowerCase() !== "cancelled" && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate("/coming-soon")}
                        >
                          <Truck className="w-4 h-4 mr-1.5" />
                          Track Order
                        </Button>
                      )}

                      {order.status?.toLowerCase() === "delivered" && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
                          onClick={() => handleConfirmReceipt(order.order_id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1.5" />
                          Confirm Receipt
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing{" "}
                <span className="font-medium">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(
                    currentPage * ITEMS_PER_PAGE,
                    filteredOrders.length
                  )}
                </span>{" "}
                of <span className="font-medium">{filteredOrders.length}</span>{" "}
                results
              </p>
            </div>
            <div>
              <nav
                className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                aria-label="Pagination"
              >
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 dark:text-gray-500 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show first page, last page, current page, and pages around current page
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  if (i === 3 && currentPage < totalPages - 3) {
                    return (
                      <span
                        key="ellipsis"
                        className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
                      >
                        ...
                      </span>
                    );
                  }
                  if (i === 1 && currentPage > 4) {
                    return (
                      <span
                        key="ellipsis-start"
                        className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
                      >
                        ...
                      </span>
                    );
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === pageNum
                        ? "z-10 bg-primary-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                        : "text-gray-900 dark:text-gray-300 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-offset-0"
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 dark:text-gray-500 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        order={selectedOrder}
        onCancelOrder={handleCancelOrder}
        cancelling={cancelling}
      />
    </div>
  );
};

export default Orders;
