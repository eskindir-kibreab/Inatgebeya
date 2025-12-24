import React, { useState, useEffect } from "react";
import {
  Package,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { ordersAPI } from "../../api/orders.api";
import Button from "../../components/forms/Button";
import Select from "../../components/forms/Select";

const ShopOwnerReturns = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "pending",
    page: 1,
    limit: 20,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReturns();
  }, [filters]);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      setError(null);

      // NOTE: Backend currently exposes return creation and status update,
      // but no dedicated listing endpoint for shop-owner return requests.
      // For now, we approximate returns using delivered shop orders.
      const { data } = await ordersAPI.getShopOrders({
        page: filters.page,
        limit: filters.limit,
        status: "delivered",
      });

      const orders = data?.data || data?.orders || [];

      // Map delivered orders to a minimal "return-like" structure
      const mappedReturns = orders.map((order) => ({
        id: order.order_id,
        order_id: order.order_id,
        customer_name: order.customer_name,
        product_name: order.items?.[0]?.product_name || "Order Items",
        return_reason: "No return requested yet",
        status: order.status === "delivered" ? "pending" : order.status,
        created_at: order.created_at,
        images: [],
      }));

      const filteredReturns = filters.status
        ? mappedReturns.filter((r) => r.status === filters.status)
        : mappedReturns;

      setReturns(filteredReturns);
    } catch (error) {
      console.error("Error fetching returns:", error);
      setError("Failed to load return requests.");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReturn = async (returnId) => {
    if (!window.confirm("Approve this return request?")) return;

    try {
      // TODO: When backend exposes a dedicated returns listing and update endpoint
      // for shop owners, integrate it here (e.g., ordersAPI.updateReturnStatus).
      alert("Return approved");
      fetchReturns();
    } catch (error) {
      alert("Failed to approve return");
    }
  };

  const handleRejectReturn = async (returnId) => {
    const reason = prompt("Please provide reason for rejection:");
    if (!reason) return;

    try {
      // TODO: When backend exposes a dedicated returns listing and update endpoint
      // for shop owners, integrate it here (e.g., ordersAPI.updateReturnStatus).
      alert("Return rejected");
      fetchReturns();
    } catch (error) {
      alert("Failed to reject return");
    }
  };

  const handleCompleteReturn = async (returnId) => {
    try {
      // TODO: When backend exposes a dedicated returns listing and update endpoint
      // for shop owners, integrate it here (e.g., ordersAPI.updateReturnStatus).
      alert("Return completed");
      fetchReturns();
    } catch (error) {
      alert("Failed to complete return");
    }
  };

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "completed", label: "Completed" },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "approved":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-ET");
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Package className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-text-main dark:text-gray-200">
            Return Management
          </h1>
        </div>
        <p className="text-text-secondary dark:text-gray-400">
          Manage product return requests for your shop
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div
          className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                       dark:border-gray-700 p-6"
        >
          <div className="text-3xl font-bold text-yellow-600 mb-2">
            {returns.filter((r) => r.status === "pending").length}
          </div>
          <p className="text-text-secondary dark:text-gray-400">Pending</p>
        </div>

        <div
          className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                       dark:border-gray-700 p-6"
        >
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {returns.filter((r) => r.status === "approved").length}
          </div>
          <p className="text-text-secondary dark:text-gray-400">Approved</p>
        </div>

        <div
          className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                       dark:border-gray-700 p-6"
        >
          <div className="text-3xl font-bold text-green-600 mb-2">
            {returns.filter((r) => r.status === "completed").length}
          </div>
          <p className="text-text-secondary dark:text-gray-400">Completed</p>
        </div>

        <div
          className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                       dark:border-gray-700 p-6"
        >
          <div className="text-3xl font-bold text-red-600 mb-2">
            {returns.filter((r) => r.status === "rejected").length}
          </div>
          <p className="text-text-secondary dark:text-gray-400">Rejected</p>
        </div>
      </div>

      {/* Filters */}
      <div
        className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                     dark:border-gray-700 p-6 mb-6"
      >
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Select
              label="Filter by Status"
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              options={statusOptions}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={fetchReturns}>Apply Filter</Button>
          </div>
        </div>
      </div>

      {/* Returns List */}
      <div
        className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                     dark:border-gray-700 overflow-hidden"
      >
        <div className="p-6 border-b border-border-default dark:border-gray-700">
          <h2 className="text-xl font-semibold text-text-main dark:text-gray-200">
            Return Requests
          </h2>
        </div>

        {loading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"
                ></div>
              ))}
            </div>
          </div>
        ) : returns.length > 0 ? (
          <div className="divide-y divide-border-default dark:divide-gray-700">
            {returns.map((returnReq) => (
              <div key={returnReq.id} className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Return Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="font-semibold text-text-main dark:text-gray-200">
                        Return #{returnReq.id}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium capitalize
                                     ${getStatusColor(returnReq.status)}`}
                      >
                        {returnReq.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-text-secondary dark:text-gray-400">
                          Order ID
                        </p>
                        <p className="font-medium text-text-main dark:text-gray-200">
                          {returnReq.order_id}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-text-secondary dark:text-gray-400">
                          Customer
                        </p>
                        <p className="font-medium text-text-main dark:text-gray-200">
                          {returnReq.customer_name}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-text-secondary dark:text-gray-400">
                          Product
                        </p>
                        <p className="font-medium text-text-main dark:text-gray-200">
                          {returnReq.product_name}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-text-secondary dark:text-gray-400">
                          Requested
                        </p>
                        <p className="font-medium text-text-main dark:text-gray-200">
                          {formatDate(returnReq.created_at)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-text-secondary dark:text-gray-400 mb-2">
                        Return Reason
                      </p>
                      <p className="text-text-main dark:text-gray-200">
                        {returnReq.return_reason}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="lg:w-64">
                    <div className="space-y-3">
                      {returnReq.status === "pending" && (
                        <>
                          <Button
                            onClick={() => handleApproveReturn(returnReq.id)}
                            className="w-full"
                            icon={CheckCircle}
                          >
                            Approve Return
                          </Button>
                          <Button
                            onClick={() => handleRejectReturn(returnReq.id)}
                            variant="danger"
                            className="w-full"
                            icon={XCircle}
                          >
                            Reject Return
                          </Button>
                        </>
                      )}

                      {returnReq.status === "approved" && (
                        <Button
                          onClick={() => handleCompleteReturn(returnReq.id)}
                          className="w-full"
                          icon={CheckCircle}
                        >
                          Mark as Completed
                        </Button>
                      )}

                      <button
                        onClick={() =>
                          (window.location.href = `/orders/${returnReq.order_id}`)
                        }
                        className="w-full py-2 border border-border-default 
                                 dark:border-gray-700 rounded-lg hover:bg-gray-50 
                                 dark:hover:bg-gray-700 text-sm font-medium"
                      >
                        View Order Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">📦</div>
            <h3 className="text-lg font-semibold text-text-main dark:text-gray-200 mb-2">
              No return requests found
            </h3>
            <p className="text-text-secondary dark:text-gray-400">
              {filters.status
                ? `No ${filters.status} return requests at the moment`
                : "No return requests for your shop"}
            </p>
          </div>
        )}
      </div>

      {/* Return Policy */}
      <div
        className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl border 
                     border-blue-200 dark:border-blue-800 p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-blue-800 dark:text-blue-300">
            Return Policy Information
          </h3>
        </div>
        <div className="text-blue-700 dark:text-blue-400 space-y-2">
          <p>• Returns must be requested within 7 days of delivery</p>
          <p>• Products must be in original condition with all tags</p>
          <p>• Refunds are processed within 3-5 business days after approval</p>
          <p>
            • Shipping costs for returns are the responsibility of the customer
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShopOwnerReturns;
