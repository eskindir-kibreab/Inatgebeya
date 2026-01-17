import React, { useState, useEffect } from "react";
import {
    Truck,
    Package,
    MapPin,
    Clock,
    CheckCircle,
    Calendar,
    ChevronLeft,
    ChevronRight,
    User,
    ArrowLeft
} from "lucide-react";
import { deliveryAPI } from "../../api/delivery.api";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const DeliveryHistory = () => {
    const navigate = useNavigate();
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
    });

    useEffect(() => {
        fetchHistory(pagination.page);
    }, [pagination.page]);

    const fetchHistory = async (page) => {
        try {
            setLoading(true);
            const response = await deliveryAPI.getHistory({ page, limit: pagination.limit });
            if (response.success) {
                setDeliveries(response.data);
                setPagination(prev => ({
                    ...prev,
                    total: response.pagination.total,
                    pages: response.pagination.pages
                }));
            }
        } catch (error) {
            toast.error("Failed to load delivery history");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "delivered":
                return "bg-green-100 text-green-800 dark:bg-green-900/20";
            case "picked":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900/20";
            case "shipped":
                return "bg-purple-100 text-purple-800 dark:bg-purple-900/20";
            case "assigned":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20";
            case "returned":
                return "bg-red-100 text-red-800 dark:bg-red-900/20";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900/20";
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-ET", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-text-secondary hover:text-primary mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </button>
                <div className="flex items-center gap-3">
                    <Clock className="w-8 h-8 text-primary" />
                    <h1 className="text-3xl font-bold text-text-main dark:text-gray-200">
                        Delivery History
                    </h1>
                </div>
                <p className="text-text-secondary dark:text-gray-400 mt-2">
                    View all your past deliveries and their details.
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-border-default dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50">
                                <th className="px-6 py-4 text-sm font-semibold text-text-main dark:text-gray-200">Order ID</th>
                                <th className="px-6 py-4 text-sm font-semibold text-text-main dark:text-gray-200">Customer</th>
                                <th className="px-6 py-4 text-sm font-semibold text-text-main dark:text-gray-200">Date</th>
                                <th className="px-6 py-4 text-sm font-semibold text-text-main dark:text-gray-200">Area</th>
                                <th className="px-6 py-4 text-sm font-semibold text-text-main dark:text-gray-200">Status</th>
                                <th className="px-6 py-4 text-sm font-semibold text-text-main dark:text-gray-200 text-right">Fee</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default dark:divide-gray-700">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {[...Array(6)].map((_, j) => (
                                            <td key={j} className="px-6 py-4">
                                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : deliveries.length > 0 ? (
                                deliveries.map((delivery) => (
                                    <tr
                                        key={delivery.delivery_id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                                        onClick={() => navigate(`/delivery-person/orders/${delivery.order_id}`)}
                                    >
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-text-main dark:text-gray-200">#{delivery.order_id}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-text-secondary" />
                                                <span className="text-text-main dark:text-gray-200">{delivery.customer_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-gray-400">
                                                <Calendar className="w-4 h-4" />
                                                {formatDate(delivery.delivered_at || delivery.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-text-secondary dark:text-gray-400">
                                            {delivery.shop_area}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(delivery.status)}`}>
                                                {delivery.status === 'delivered' ? 'Completed' : delivery.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <span className="font-semibold text-primary">
                                                    ETB {delivery.delivery_fee || 50}
                                                </span>
                                                <ChevronRight className="w-5 h-5 text-text-secondary" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-text-secondary dark:text-gray-400">
                                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <p>No delivery history found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-border-default dark:border-gray-700 flex items-center justify-between">
                        <p className="text-sm text-text-secondary dark:text-gray-400">
                            Showing <span className="font-medium text-text-main dark:text-gray-200">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
                            <span className="font-medium text-text-main dark:text-gray-200">
                                {Math.min(pagination.page * pagination.limit, pagination.total)}
                            </span>{" "}
                            of <span className="font-medium text-text-main dark:text-gray-200">{pagination.total}</span> deliveries
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                disabled={pagination.page === 1 || loading}
                                className="p-2 border border-border-default dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                disabled={pagination.page === pagination.pages || loading}
                                className="p-2 border border-border-default dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeliveryHistory;
