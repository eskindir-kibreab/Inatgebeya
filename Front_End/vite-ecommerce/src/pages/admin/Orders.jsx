import React, { useState, useEffect } from "react";
import { Search, Eye, Filter, CheckCircle, XCircle } from "lucide-react";
import { ordersAPI } from "../../api/orders.api";
import Input from "../../components/forms/Input";
import Select from "../../components/forms/Select";
import AdminActiveFilters from "../../components/search/AdminActiveFilters";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import OrderStatusBadge from "../../components/orders/OrderStatusBadge";

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: "",
        status: "paid", // Default to Paid orders (awaiting approval)
        page: 1,
        limit: 10,
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });

    useEffect(() => {
        fetchOrders();
    }, [filters]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await ordersAPI.getAll(filters);
            if (response.success) {
                setOrders(response.data);
                setPagination({
                    ...response.pagination,
                    totalPages: response.pagination.pages
                });
            }
        } catch (error) {
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    const handleApproveOrder = async (orderId) => {
        if (!window.confirm("Approve this order and release funds to seller?")) return;

        try {
            await ordersAPI.updateStatus(orderId, { status: "approved" });
            toast.success("Order approved successfully");
            fetchOrders();
        } catch (error) {
            console.error("Approval error:", error);
            toast.error("Failed to approve order");
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm("Are you sure you want to cancel this order?")) return;

        try {
            await ordersAPI.cancel(orderId);
            toast.success("Order cancelled successfully");
            fetchOrders();
        } catch (error) {
            console.error("Cancellation error:", error);
            toast.error("Failed to cancel order");
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

    const filterLabels = {
        status: {
            label: "Status",
            pending: "Pending",
            paid: "Paid",
            approved: "Approved",
            shipped: "Shipped",
            delivered: "Delivered",
            cancelled: "Cancelled"
        },
    };

    const statusOptions = [
        { value: "", label: "All Status" },
        { value: "pending", label: "Pending" },
        { value: "paid", label: "Paid" },
        { value: "approved", label: "Approved" },
        { value: "shipped", label: "Shipped" },
        { value: "delivered", label: "Delivered" },
        { value: "cancelled", label: "Cancelled" },
    ];

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-ET", {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-text-main dark:text-gray-200">
                    Order Management
                </h1>
                <p className="text-text-secondary dark:text-gray-400 mt-2">
                    View and manage all platform orders
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-border-default dark:border-gray-700 p-6 mb-6">
                <div className="mb-4">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Search by Order ID..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange("search", e.target.value)}
                                icon={Search}
                            />
                        </div>
                        <div className="w-1/4">
                            <Select
                                name="status"
                                value={filters.status}
                                onChange={(e) => handleFilterChange("status", e.target.value)}
                                options={statusOptions}
                                icon={Filter}
                            />
                        </div>
                    </div>
                </div>

                <AdminActiveFilters
                    filters={filters}
                    filterLabels={filterLabels}
                    onRemoveFilter={handleRemoveFilter}
                />
            </div>

            {/* Orders Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-border-default dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border-default dark:border-gray-700">
                                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200">Order ID</th>
                                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200">Customer</th>
                                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200">Shop</th>
                                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200">Total</th>
                                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200">Status</th>
                                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200">Date</th>
                                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-6">
                                        <div className="animate-pulse space-y-4">
                                            {[...Array(5)].map((_, i) => (
                                                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ) : orders.length > 0 ? (
                                orders.map((order) => (
                                    <tr key={order.order_id} className="border-b border-border-default dark:border-gray-700 hover:bg-bg-light dark:hover:bg-gray-700">
                                        <td className="p-6 font-mono text-sm">#{order.order_id}</td>
                                        <td className="p-6 text-sm">
                                            <div className="font-medium text-text-main dark:text-gray-200">{order.customer_name}</div>
                                            <div className="text-xs text-text-secondary">{order.customer_email}</div>
                                        </td>
                                        <td className="p-6 text-sm text-text-secondary dark:text-gray-400">{order.shop_name}</td>
                                        <td className="p-6 font-medium text-primary">ETB {Number(order.total).toLocaleString()}</td>
                                        <td className="p-6">
                                            <OrderStatusBadge status={order.status} />
                                            <div className="mt-1 text-xs">
                                                <span className={`px-1.5 py-0.5 rounded ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {order.payment_status?.toUpperCase()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-sm text-text-secondary dark:text-gray-400">
                                            {formatDate(order.created_at)}
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-1">
                                                {/* Actions for Pending Orders */}
                                                {(order.status === 'pending') && (
                                                    <>
                                                        {order.payment_status === 'paid' && (
                                                            <button
                                                                onClick={() => handleApproveOrder(order.order_id)}
                                                                className="p-2 hover:bg-green-100 text-green-600 dark:hover:bg-green-900/20 rounded-lg"
                                                                title="Approve Order"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleCancelOrder(order.order_id)}
                                                            className="p-2 hover:bg-red-100 text-red-600 dark:hover:bg-red-900/20 rounded-lg"
                                                            title="Cancel Order"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                <Link
                                                    to={`/admin/orders/${order.order_id}`}
                                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg inline-flex"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4 text-text-secondary" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="p-12 text-center text-text-secondary dark:text-gray-400">
                                        No orders found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="p-6 border-t border-border-default dark:border-gray-700 flex justify-between items-center">
                        <p className="text-sm text-text-secondary">
                            Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleFilterChange("page", pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => handleFilterChange("page", pagination.page + 1)}
                                disabled={pagination.page === pagination.totalPages}
                                className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;
