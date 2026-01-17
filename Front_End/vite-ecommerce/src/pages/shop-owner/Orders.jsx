import React, { useState, useEffect } from "react";
import { Search, Eye, Filter, Package } from "lucide-react";
import { ordersAPI } from "../../api/orders.api";
import Input from "../../components/forms/Input";
import Select from "../../components/forms/Select";
import Button from "../../components/forms/Button";
import AdminActiveFilters from "../../components/search/AdminActiveFilters";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import OrderStatusBadge from "../../components/orders/OrderStatusBadge";
import { getEffectiveOrderStatus } from "../../utils/orderStatus";

const ShopOwnerOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);


    const [filters, setFilters] = useState({
        search: "",
        status: "",
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
            const response = await ordersAPI.getShopOrders(filters);
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


    const handleMarkShipped = async (orderId) => {
        if (!window.confirm("Mark this order as Shipped?")) return;

        try {
            setActionLoading(true);
            await ordersAPI.updateStatus(orderId, { status: 'shipped' });
            toast.success("Order marked as Shipped");
            fetchOrders();
        } catch (error) {
            toast.error("Failed to update status");
        } finally {
            setActionLoading(false);
        }
    };

    const handleFilterChange = (name, value) => {
        setFilters((prev) => ({
            ...prev,
            [name]: value,
            page: name === "page" ? value : 1,
        }));
    };

    const statusOptions = [
        { value: "", label: "All Status" },
        { value: "admin_approved", label: "Approved" },
        { value: "delivery_assigned", label: "Delivery Assigned" },
        { value: "picked_up", label: "Picked Up" },
        { value: "shipped", label: "Shipped" },
        { value: "delivered", label: "Delivered" },
    ];

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-ET", {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-text-main dark:text-gray-200">Shop Orders</h1>
                    <p className="text-text-secondary dark:text-gray-400 mt-1">Manage approved orders and track shipments</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-border-default dark:border-gray-700 p-4 mb-6">
                <div className="flex gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search Order ID..."
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

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-border-default dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border-default dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                <th className="text-left p-4 font-semibold text-text-main dark:text-gray-200">Order ID</th>
                                <th className="text-left p-4 font-semibold text-text-main dark:text-gray-200">Customer</th>
                                <th className="text-left p-4 font-semibold text-text-main dark:text-gray-200">Total</th>
                                <th className="text-left p-4 font-semibold text-text-main dark:text-gray-200">Status</th>
                                <th className="text-left p-4 font-semibold text-text-main dark:text-gray-200">Date</th>
                                <th className="text-left p-4 font-semibold text-text-main dark:text-gray-200">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center">Loading orders...</td></tr>
                            ) : orders.length > 0 ? (
                                orders.map((order) => (
                                    <tr key={order.order_id} className="border-b border-border-default dark:border-gray-700 hover:bg-bg-light">
                                        <td className="p-4 font-mono">#{order.order_id}</td>
                                        <td className="p-4">
                                            <div className="font-medium">{order.customer_name}</div>
                                            <div className="text-xs text-text-secondary">{order.delivery_address}</div>
                                        </td>
                                        <td className="p-4 font-medium text-primary">ETB {Number(order.total).toLocaleString()}</td>
                                        <td className="p-4"><OrderStatusBadge status={getEffectiveOrderStatus(order)} /></td>
                                        <td className="p-4 text-sm text-text-secondary">{formatDate(order.created_at)}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">

                                                {/* Mark Shipped Button */}
                                                {(order.status === 'delivery_assigned' || order.status === 'picked_up') && (
                                                    <button
                                                        onClick={() => handleMarkShipped(order.order_id)}
                                                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 flex items-center gap-1"
                                                        disabled={actionLoading}
                                                    >
                                                        <Package className="w-3 h-3" /> Ship
                                                    </button>
                                                )}

                                                <Link
                                                    to={`/shop-owner/orders/${order.order_id}`}
                                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                                >
                                                    <Eye className="w-4 h-4 text-text-secondary" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" className="p-8 text-center text-text-secondary">No orders found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default ShopOwnerOrders;
