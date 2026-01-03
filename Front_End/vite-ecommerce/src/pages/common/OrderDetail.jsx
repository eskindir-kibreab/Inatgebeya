import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
    Package,
    CheckCircle,
    Truck,
    Home,
    User,
    ArrowLeft,
    DollarSign,
    AlertCircle,
    CreditCard,
} from "lucide-react";
import { ordersAPI } from "../../api/orders.api";
import { paymentsAPI } from "../../api/payments.api";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/forms/Button";
import ErrorState from "../../components/feedback/ErrorState";
import OrderStatusBadge from "../../components/orders/OrderStatusBadge";
import toast from "react-hot-toast";

const OrderDetail = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const isAdmin = ["admin", "super_admin"].includes(user?.role_name);
    const isShopOwner = user?.role_name === "shop_owner";
    const isUser = user?.role_name === "user";

    useEffect(() => {
        fetchOrder();
    }, [orderId]);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            const response = await ordersAPI.getById(orderId);
            if (response.success) {
                setOrder(response.data);
            } else {
                setOrder(null);
            }
        } catch (error) {
            console.error("Error fetching order:", error);
            setOrder(null);
        } finally {
            setLoading(false);
        }
    };

    const handlePayNow = async () => {
        setActionLoading(true);
        try {
            const response = await paymentsAPI.initialize(orderId);
            const payment = response.data;
            if (payment.success && payment.data.checkout_url) {
                window.location.href = payment.data.checkout_url;
            } else {
                toast.error("Failed to initialize payment");
            }
        } catch (error) {
            console.error("Payment error:", error);
            toast.error(error.response?.data?.message || "Payment initialization failed");
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!window.confirm("Are you sure you want to cancel this order?")) return;

        setActionLoading(true);
        try {
            const response = await ordersAPI.cancel(orderId);
            if (response.success) {
                toast.success("Order cancelled successfully");
                fetchOrder();
            }
        } catch (error) {
            toast.error("Failed to cancel order");
        } finally {
            setActionLoading(false);
        }
    };

    const handleApproveOrder = async () => {
        if (!window.confirm("Approve this order and release funds to seller?")) return;

        setActionLoading(true);
        try {
            // Assuming updateStatus takes the status string or object
            // Based on previous fixes, we should send an object { status: 'approved' }
            // But verify strictly if your API call wrapper handles this.
            // Assuming the API call wrapper does simple post/put:
            await ordersAPI.updateStatus(orderId, { status: "approved" });
            toast.success("Order approved and funds released!");
            fetchOrder();
        } catch (error) {
            console.error("Approval error:", error);
            toast.error("Failed to approve order");
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusSteps = () => {
        const steps = [
            { id: "pending", label: "Pending", icon: Package }, // Created
            { id: "paid", label: "Paid", icon: CreditCard }, // Verified
            { id: "admin_approved", label: "Approved", icon: CheckCircle }, // Admin Approved
            { id: "delivery_assigned", label: "Assigned", icon: Truck }, // Delivery Assigned
            { id: "picked_up", label: "Picked Up", icon: Package }, // Picked Up
            { id: "delivered", label: "Delivered", icon: Home }, // Delivered
        ];

        // Map status to index
        // Status might be 'ADMIN_APPROVED' in DB but we might normalize to lowercase in frontend or handle it here
        const normalizedStatus = order?.status === 'ADMIN_APPROVED' ? 'admin_approved' : order?.status?.toLowerCase();

        let currentStepIndex = steps.findIndex(step => step.id === normalizedStatus);

        // Handle cases where steps might be skipped or intermediate states mapping
        // e.g. 'shipped' -> map to 'picked_up' or 'assigned' if we lack a step? 
        // But requested flow is strict.

        // If status is 'shipped' (legacy/ShopOwner manual), it roughly equals 'picked_up' or between picked and delivered.
        // Let's treat 'shipped' same as 'picked_up' for timeline if needed, or add it.
        // The user spec said "Shipped" is after "Picked Up".
        // The Spec: Pending -> Paid -> Approved -> Delivery Assigned -> Picked Up -> Shipped -> Delivered
        // I missed 'Shipped' in the list above. Let's add it.

        const strictSteps = [
            { id: "pending", label: "Pending", icon: Package },
            { id: "paid", label: "Paid", icon: CreditCard },
            { id: "admin_approved", label: "Approved", icon: CheckCircle },
            { id: "delivery_assigned", label: "Assigned", icon: User },
            { id: "picked_up", label: "Picked Up", icon: Package },
            { id: "shipped", label: "Shipped", icon: Truck },
            { id: "delivered", label: "Delivered", icon: Home },
        ];

        // Recalculate index
        let activeStatus = order?.status === 'ADMIN_APPROVED' ? 'admin_approved' : order?.status?.toLowerCase();

        // Compatibility: 'approved' -> 'admin_approved'
        if (activeStatus === 'approved') activeStatus = 'admin_approved';

        currentStepIndex = strictSteps.findIndex(step => step.id === activeStatus);

        return strictSteps.map((step, index) => ({
            ...step,
            completed: index <= currentStepIndex,
            current: index === currentStepIndex,
        }));
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-ET", {
            weekday: "short", year: "numeric", month: "long", day: "numeric",
            hour: "2-digit", minute: "2-digit"
        });
    };

    if (loading) return <PageSkeleton />;

    if (!order) {
        return (
            <div className="max-w-4xl mx-auto p-8">
                <ErrorState
                    title="Order Not Found"
                    message="Could not load order details."
                    actionText="Go Back"
                    onAction={() => navigate(-1)}
                />
            </div>
        );
    }

    const statusSteps = getStatusSteps();
    const canCancel = (isUser || isAdmin) && ["pending"].includes(order.status);
    const canPay = isUser && order.payment_method === "mobile_banking" && order.payment_status === "pending" && order.status !== "cancelled";

    // Admin can approve if payment is 'paid' but status is NOT yet approved/delivered/etc.
    // Usually 'pending' status with 'paid' payment means it's waiting approval.
    const canApprove = isAdmin && order.payment_status === "paid" && (order.status === "pending");

    const canConfirm = isUser && order.status === "delivered";

    const handleConfirmReceipt = async () => {
        if (!window.confirm("Confirm that you have received your order?")) return;

        setActionLoading(true);
        try {
            await ordersAPI.updateStatus(orderId, { status: "completed" });
            toast.success("Order completed! Thank you.");
            fetchOrder();
        } catch (error) {
            console.error(error);
            toast.error("Failed to confirm receipt");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Header & Back Nav */}
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-text-secondary hover:text-primary transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back
                </button>
                <div className="flex gap-3">
                    {canCancel && (
                        <Button variant="danger" outline onClick={handleCancelOrder} loading={actionLoading}>
                            Cancel Order
                        </Button>
                    )}
                    {canApprove && (
                        <Button variant="primary" onClick={handleApproveOrder} loading={actionLoading}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve Order
                        </Button>
                    )}
                    {canPay && (
                        <Button variant="primary" onClick={handlePayNow} loading={actionLoading}>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Pay Now
                        </Button>
                    )}
                    {canConfirm && (
                        <Button variant="primary" onClick={handleConfirmReceipt} loading={actionLoading}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Confirm Receipt
                        </Button>
                    )}
                </div>
            </div>

            {/* Main Title Block */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8 shadow-sm border border-border-default dark:border-gray-700">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-text-main dark:text-gray-100 flex items-center gap-3">
                            Order #{order.order_id}
                            <OrderStatusBadge status={order.status} />
                        </h1>
                        <p className="text-text-secondary dark:text-gray-400 mt-1">
                            Placed on {formatDate(order.created_at)}
                        </p>
                        {isAdmin && (
                            <p className="text-sm text-primary mt-1 font-medium">
                                Shop: {order.shop_name} (ID: {order.shop_id})
                            </p>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-text-secondary dark:text-gray-400">Total Amount</p>
                        <p className="text-3xl font-bold text-text-main dark:text-gray-100">
                            ETB {Number(order.total).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Timeline & Items */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Status Timeline */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-border-default dark:border-gray-700">
                        <h2 className="font-semibold text-lg mb-6 text-text-main dark:text-gray-200">Order Progress</h2>
                        <div className="relative flex justify-between">
                            {/* Line */}
                            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-100 dark:bg-gray-700 -z-0 rounded-full" />

                            {statusSteps.map((step) => {
                                const Icon = step.icon;
                                return (
                                    <div key={step.id} className="relative z-10 flex flex-col items-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
                       ${step.completed ? 'bg-status-success text-white' :
                                                step.current ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}
                     `}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <span className={`mt-2 text-xs font-medium ${step.completed || step.current ? 'text-text-main dark:text-gray-200' : 'text-gray-400'}`}>
                                            {step.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        {order.status === 'cancelled' && (
                            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-center gap-3">
                                <AlertCircle className="w-5 h-5" />
                                <span>This order has been cancelled.</span>
                            </div>
                        )}
                    </div>

                    {/* Items List */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-border-default dark:border-gray-700">
                        <h2 className="font-semibold text-lg mb-6 text-text-main dark:text-gray-200">Items ({order.items?.length || 0})</h2>
                        <div className="space-y-6">
                            {order.items?.map((item, idx) => (
                                <div key={idx} className="flex gap-4 items-start pb-6 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                                    <img
                                        src={item.main_image || '/placeholder.jpg'}
                                        alt={item.product_name}
                                        className="w-20 h-20 object-cover rounded-lg bg-gray-50"
                                    />
                                    <div className="flex-1">
                                        <h3 className="font-medium text-text-main dark:text-gray-200">{item.product_name}</h3>
                                        {item.size_label && <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">Size: {item.size_label}</p>}
                                        <div className="mt-2 flex items-center gap-4 text-sm">
                                            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-text-secondary dark:text-gray-300">
                                                Qty: {item.quantity}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-text-main dark:text-gray-200">
                                            ETB {(Number(item.price) * item.quantity).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-text-secondary dark:text-gray-400 mt-1">
                                            ETB {Number(item.price).toLocaleString()} / each
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Right Column: Summaries */}
                <div className="space-y-8">

                    {/* Shipping Info */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-border-default dark:border-gray-700">
                        <h2 className="font-semibold text-lg mb-4 text-text-main dark:text-gray-200 flex items-center gap-2">
                            <Truck className="w-5 h-5 text-primary" />
                            Delivery Details
                        </h2>
                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="block text-text-secondary dark:text-gray-400 mb-1">Address</span>
                                <p className="font-medium text-text-main dark:text-gray-200">{order.delivery_address}</p>
                                {order.area_name && <p className="text-text-secondary">{order.area_name}</p>}
                            </div>
                            <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                                <span className="block text-text-secondary dark:text-gray-400 mb-1">Customer</span>
                                <p className="font-medium text-text-main dark:text-gray-200">{order.customer_name}</p>
                                <p className="text-text-secondary">{order.customer_email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Payment & Financials */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-border-default dark:border-gray-700">
                        <h2 className="font-semibold text-lg mb-4 text-text-main dark:text-gray-200 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-primary" />
                            Financial Summary
                        </h2>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-text-secondary dark:text-gray-400">Method</span>
                                <span className="font-medium capitalize">{order.payment_method?.replace('_', ' ')}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-text-secondary dark:text-gray-400">Payment Status</span>
                                <span className={`font-medium px-2 py-0.5 rounded text-xs ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {order.payment_status?.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <SummaryRow label="Subtotal" value={Number(order.total) - Number(order.tax_amount) - Number(order.gateway_fee)} />
                            <SummaryRow label="Tax (15%)" value={order.tax_amount} />
                            <SummaryRow label="Gateway Fee" value={order.gateway_fee} />
                            <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700">
                                <span className="font-bold text-text-main dark:text-gray-200">Total</span>
                                <span className="font-bold text-xl text-primary">ETB {Number(order.total).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

const SummaryRow = ({ label, value }) => (
    <div className="flex justify-between text-sm">
        <span className="text-text-secondary dark:text-gray-400">{label}</span>
        <span className="font-medium text-text-main dark:text-gray-200">ETB {Number(value || 0).toLocaleString()}</span>
    </div>
);

const PageSkeleton = () => (
    <div className="max-w-5xl mx-auto p-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
        <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2 h-64 bg-gray-200 rounded-xl"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
    </div>
);

export default OrderDetail;
