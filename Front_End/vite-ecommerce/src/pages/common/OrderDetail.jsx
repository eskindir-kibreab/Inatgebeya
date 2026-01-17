import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import {
    Clock,
    CheckCircle,
    XCircle,
    Package,
    Truck,
    ExternalLink,
    ChevronLeft,
    AlertCircle,
    CreditCard,
    MapPin,
    Shield,
    LayoutDashboard,
    Eye,
    User,
    Home,
    DollarSign,
    ArrowLeft,
    MessageCircle,
    ShoppingCart,
    Map as MapIcon,
    Phone
} from "lucide-react";
import { ordersAPI } from "../../api/orders.api";
import { paymentsAPI } from "../../api/payments.api";
import { bankTransferAPI } from "../../api/bankTransfer.api";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/forms/Button";
import ErrorState from "../../components/feedback/ErrorState";
import OrderStatusBadge from "../../components/orders/OrderStatusBadge";
import toast from "react-hot-toast";
import { getEffectiveOrderStatus } from "../../utils/orderStatus";
import { getImageUrl as getGlobalImageUrl } from "../../utils/image";
import ChatModal from "../../components/chat/ChatModal";
import { deliveryAPI } from "../../api/delivery.api";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

// Fix leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const ChangeView = ({ center }) => {
    const map = useMap();
    map.setView(center);
    return null;
};

const OrderDetail = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [showRejectionInput, setShowRejectionInput] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    // Chat state
    const [isChatOpen, setIsChatOpen] = useState(false);

    const isAdmin = ["admin", "super_admin"].includes(user?.role_name);
    const isShopOwner = user?.role_name === "shop_owner";
    const isUser = user?.role_name === "user";
    const isDeliveryPerson = user?.role_name === "delivery_person";

    // PIN Input state
    const [pin, setPin] = useState("");
    const [showPinInput, setShowPinInput] = useState(false);

    // Local image helper to ensure /uploads is handled correctly
    const getImageUrl = (url) => {
        if (!url) return "/placeholder.jpg";
        if (url.startsWith("http")) return url;
        const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
        return `${baseUrl}/uploads/${url}`;
    };

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
        if (order.payment_status === 'paid') {
            toast.success("Order is already paid!");
            return;
        }

        // MANDATORY: Check for profile completion (Phone, ID Number, ID Image)
        const hasPhone = !!user?.phone;
        const hasIDNumber = !!user?.identification?.fan_number;
        const hasIDImage = !!user?.identification?.id_image_url;

        if (!hasPhone || !hasIDNumber || !hasIDImage) {
            toast.error("Please complete your profile (Phone, National ID, and ID Image) before paying.");
            navigate("/profile");
            return;
        }
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

    const handleVerifyTransfer = async (action) => {
        if (action === 'reject' && !rejectionReason.trim()) {
            setShowRejectionInput(true);
            return;
        }

        setActionLoading(true);
        try {
            const response = await bankTransferAPI.verify({
                bank: order.bank_transfer_details.bank_type,
                payment_id: order.bank_transfer_details.id, // Fixed: use payment record ID
                action,
                rejection_reason: action === 'reject' ? rejectionReason : null
            });

            if (response.success) {
                toast.success(`Payment ${action === 'approve' ? 'verified' : 'rejected'} successfully`);
                setRejectionReason("");
                setShowRejectionInput(false);
                fetchOrder();
            }
        } catch (error) {
            console.error("Verification error:", error);
            toast.error(`Failed to ${action} payment`);
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusSteps = () => {
        const s = order?.status?.toLowerCase();
        const ps = order?.payment_status?.toLowerCase();
        const ds = order?.delivery_status?.toLowerCase();
        const isRejected = order.bank_transfer_details?.bank_payment_status === 'REJECTED';

        let strictSteps = [
            { id: "pending", label: "Pending", icon: Package },
            { id: "paid", label: "Paid", icon: CreditCard },
            { id: "approved", label: "Approved", icon: CheckCircle },
            { id: "assigned", label: "Assigned", icon: User },
            { id: "picked_up", label: "Picked Up", icon: Package },
            { id: "delivered", label: "Delivered", icon: Home },
        ];

        let currentStepIndex = 0;
        let isFailed = false;

        // Determine progression
        if (s === 'pending') currentStepIndex = 0;
        if (ps === 'paid') currentStepIndex = 1;
        if (s === 'approved' || s === 'admin_approved') currentStepIndex = 2;
        if (ds === 'assigned') currentStepIndex = 3;
        if (ds === 'picked') currentStepIndex = 4;
        if (s === 'delivered' || ds === 'delivered') currentStepIndex = 5;
        if (s === 'completed') currentStepIndex = 5;

        // Handle Canceled State
        if (s === 'cancelled') {
            isFailed = true;
            const insertIndex = Math.min(currentStepIndex + 1, strictSteps.length - 1);
            strictSteps.splice(insertIndex, 0, { id: "failed", label: "Canceled", icon: XCircle, failed: true });
            currentStepIndex = insertIndex;
        }
        // Handle Rejected State (specifically for bank transfers)
        else if (isRejected) {
            isFailed = true;
            // Rejection happens at the "Paid" step verification point
            const insertIndex = 1;
            strictSteps.splice(insertIndex, 1, { id: "failed", label: "Rejected", icon: XCircle, failed: true });
            currentStepIndex = insertIndex;
        }

        return strictSteps.map((step, index) => ({
            ...step,
            completed: index <= currentStepIndex && !step.failed,
            current: index === currentStepIndex,
            isPastFailure: isFailed && index > currentStepIndex
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
    const isRejected = order.status?.toLowerCase() === 'rejected' || order.bank_transfer_details?.bank_payment_status === 'REJECTED';
    const canCancel = (isUser || isAdmin) && order.status?.toLowerCase() === "pending" && !isRejected;
    const canPay = isUser && order.payment_method === "mobile_banking" && order.payment_status === "pending" && order.status !== "cancelled";

    const canApprove = isAdmin && order.payment_status === "paid" && (order.status === "pending" || order.status === "");

    const canConfirm = isUser && order.status === "delivered";

    const isAssignedToMe = isDeliveryPerson && order.delivery?.delivery_person_id == user?.delivery_person_id;

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

    const handleMarkPicked = async () => {
        if (!window.confirm("Mark this order as picked up?")) return;

        setActionLoading(true);
        try {
            await deliveryAPI.updateStatus(order.delivery.delivery_id, { status: "picked" });
            toast.success("Order marked as picked up!");
            fetchOrder();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to update status");
        } finally {
            setActionLoading(false);
        }
    };

    const handleMarkDelivered = async () => {
        if (!pin || pin.length !== 6) {
            toast.error("Please enter a valid 6-digit PIN");
            return;
        }

        setActionLoading(true);
        try {
            await deliveryAPI.updateStatus(order.delivery.delivery_id, {
                status: "delivered",
                pin: pin
            });
            toast.success("Order delivered successfully!");
            setShowPinInput(false);
            setPin("");
            fetchOrder();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Invalid PIN or update failed");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
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

                    {/* Delivery Person Actions */}
                    {isAssignedToMe && order.delivery?.status === 'assigned' && (
                        <Button variant="primary" onClick={handleMarkPicked} loading={actionLoading}>
                            <Package className="w-4 h-4 mr-2" />
                            Mark as Picked Up
                        </Button>
                    )}

                    {isAssignedToMe && order.delivery?.status === 'picked' && !showPinInput && (
                        <Button variant="primary" onClick={() => setShowPinInput(true)} loading={actionLoading}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark as Delivered
                        </Button>
                    )}
                    {/* Contact Shop Button */}
                    {isUser && order?.shop_id && (
                        <Button
                            variant="outline"
                            className="border-primary/50 text-primary hover:bg-primary/10"
                            onClick={() => setIsChatOpen(true)}
                        >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Contact Shop
                        </Button>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8 shadow-sm border border-border-default dark:border-gray-700">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-text-main dark:text-gray-100 flex items-center gap-3">
                            Order #{order.order_id}
                            <OrderStatusBadge status={getEffectiveOrderStatus(order)} />
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

            {order.payment_method === "bank_transfer" && order.payment_status === "pending" && order.status !== "cancelled" && (
                <>
                    {order.bank_transfer_details?.bank_payment_status === 'REJECTED' ? (
                        <div className="bg-status-error/5 border border-status-error/20 rounded-xl p-4 mb-8 flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
                            <div className="p-2 bg-status-error/10 rounded-lg">
                                <XCircle className="w-6 h-6 text-status-error" />
                            </div>
                            <div>
                                <h3 className="font-bold text-status-error">Payment Rejected</h3>
                                <p className="text-sm text-red-600 dark:text-red-400 mt-1 font-medium italic">
                                    Reason: {order.bank_transfer_details.rejection_reason || "No reason provided by admin."}
                                </p>
                                <p className="text-xs text-text-secondary dark:text-gray-400 mt-2">
                                    Please re-check your transaction ID and receipt screenshot. You may need to contact support.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-8 flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <AlertCircle className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-primary">Payment Verification Pending</h3>
                                <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
                                    Your bank transfer details are being reviewed by our team.
                                    This usually takes 10-30 minutes. Once verified, your order will be processed.
                                </p>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Admin Bank Verification Section */}
            {isAdmin && order.payment_method === "bank_transfer" && order.payment_status === "pending" && order.bank_transfer_details && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8 border-2 border-primary/20 shadow-lg animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Shield className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-text-main dark:text-gray-100">Bank Verification Required</h2>
                            <p className="text-sm text-text-secondary">Please verify the receipt before approving the order</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <div className="space-y-4">
                                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-border-default">
                                    <p className="text-xs text-text-muted font-bold uppercase tracking-wider mb-2">Transaction Details</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-text-secondary">Bank:</span>
                                            <span className="text-sm font-bold uppercase">{order.bank_transfer_details.bank_type}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-text-secondary">Amount:</span>
                                            <span className="text-sm font-bold text-primary">ETB {Number(order.total).toLocaleString()}</span>
                                        </div>
                                        <div className="flex flex-col gap-1 mt-2">
                                            <span className="text-sm text-text-secondary">Transaction ID:</span>
                                            <span className="text-sm font-mono font-bold break-all bg-white dark:bg-gray-800 p-2 rounded border">{order.bank_transfer_details.transaction_id}</span>
                                        </div>
                                    </div>
                                </div>

                                {order.bank_transfer_details.bank_payment_status === 'PENDING' && (
                                    <div className="flex flex-col gap-3">
                                        {showRejectionInput ? (
                                            <div className="space-y-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100">
                                                <textarea
                                                    placeholder="Reason for rejection..."
                                                    value={rejectionReason}
                                                    onChange={(e) => setRejectionReason(e.target.value)}
                                                    className="w-full p-3 text-sm rounded-lg border focus:ring-2 focus:ring-red-500 outline-none dark:bg-gray-700 dark:text-white"
                                                    rows="2"
                                                />
                                                <div className="flex gap-2">
                                                    <Button variant="danger" className="flex-1" onClick={() => handleVerifyTransfer('reject')} loading={actionLoading}>
                                                        Confirm Reject
                                                    </Button>
                                                    <Button variant="outline" onClick={() => setShowRejectionInput(false)}>
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex gap-4">
                                                <Button variant="success" className="flex-1" onClick={() => handleVerifyTransfer('approve')} loading={actionLoading}>
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Verify Payment
                                                </Button>
                                                <Button variant="danger" outline onClick={() => setShowRejectionInput(true)}>
                                                    <XCircle className="w-4 h-4 mr-2" />
                                                    Reject
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="relative group cursor-zoom-in" onClick={() => setSelectedImage(getImageUrl(order.bank_transfer_details.receipt_url))}>
                            <img
                                src={getImageUrl(order.bank_transfer_details.receipt_url)}
                                alt="Payment Receipt"
                                className="w-full h-64 object-cover rounded-xl border-2 border-border-default group-hover:border-primary transition-all"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                                <div className="bg-white p-3 rounded-full text-black">
                                    <Eye className="w-6 h-6" />
                                </div>
                            </div>
                            <p className="mt-2 text-center text-xs text-primary font-bold">Click to enlarge receipt</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-border-default dark:border-gray-700">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-semibold text-lg text-text-main dark:text-gray-200">Order Progress</h2>
                            {order.status === 'cancelled' && (
                                <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full uppercase">Terminated</span>
                            )}
                        </div>

                        <div className="flex flex-col items-center justify-center py-8">
                            {(() => {
                                const activeStep = statusSteps.find(s => s.current) || statusSteps[0];
                                const Icon = activeStep.icon;
                                const isFailed = activeStep.failed || order.status === 'cancelled';

                                return (
                                    <div className="flex flex-col items-center animate-in zoom-in duration-300">
                                        <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-105
                                            ${isFailed ? 'bg-red-500 text-white shadow-red-200 dark:shadow-red-900/20' :
                                                activeStep.id === 'delivered' ? 'bg-status-success text-white shadow-green-200 dark:shadow-green-900/20' :
                                                    'bg-primary text-white shadow-primary/20'}
                                        `}>
                                            <Icon className="w-12 h-12" />
                                        </div>
                                        <div className="mt-6 text-center">
                                            <p className="text-sm uppercase tracking-widest text-text-secondary dark:text-gray-400 font-semibold mb-1">
                                                Current Status
                                            </p>
                                            <h3 className={`text-3xl font-black ${isFailed ? 'text-red-600' : 'text-text-main dark:text-gray-100'}`}>
                                                {activeStep.label}
                                            </h3>
                                            <p className="mt-2 text-text-secondary dark:text-gray-400 max-w-xs mx-auto">
                                                {isFailed ? (order.bank_transfer_details?.rejection_reason || "This order has been stopped and will not proceed further.") :
                                                    activeStep.id === 'pending' ? "We've received your order and are waiting for payment." :
                                                        activeStep.id === 'paid' ? "Payment received! We're verifying the details now." :
                                                            activeStep.id === 'delivered' ? "Package delivered successfully. Enjoy your purchase!" :
                                                                "Your order is moving through our fulfillment process."}
                                            </p>
                                        </div>

                                        {isAssignedToMe && showPinInput && (
                                            <div className="mt-8 p-8 bg-white dark:bg-gray-800 border-2 border-primary rounded-3xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-300">
                                                <div className="flex flex-col items-center text-center space-y-6">
                                                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                                        <Shield className="w-8 h-8" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xl font-bold text-text-main dark:text-gray-100">
                                                            Delivery Verification
                                                        </h4>
                                                        <p className="text-sm text-text-secondary dark:text-gray-400 mt-2">
                                                            Enter the 6-digit PIN from the customer
                                                        </p>
                                                    </div>

                                                    <div className="w-full">
                                                        <input
                                                            type="text"
                                                            maxLength="6"
                                                            value={pin}
                                                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                                            placeholder="000 000"
                                                            className="w-full text-center text-4xl font-black tracking-[0.4em] py-5 bg-gray-50 dark:bg-gray-700/50 border-2 border-primary/20 rounded-2xl focus:border-primary focus:ring-8 focus:ring-primary/10 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
                                                        />
                                                    </div>

                                                    <div className="flex flex-col w-full gap-3 pt-2">
                                                        <Button
                                                            variant="primary"
                                                            className="w-full h-14 text-lg font-bold rounded-xl"
                                                            onClick={handleMarkDelivered}
                                                            loading={actionLoading}
                                                        >
                                                            Complete Delivery
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            className="text-text-secondary hover:text-text-main"
                                                            onClick={() => setShowPinInput(false)}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Delivery Map Section */}
                    {isAssignedToMe && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-border-default dark:border-gray-700">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold text-lg text-text-main dark:text-gray-200 flex items-center gap-2">
                                    <MapIcon className="w-5 h-5 text-primary" />
                                    Delivery Map
                                </h2>
                                <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.delivery_address)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-white font-bold px-3 py-1 bg-primary hover:bg-primary-hover rounded-full transition-colors flex items-center gap-1"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    Navigate to Customer
                                </a>
                            </div>

                            <div className="relative aspect-video rounded-xl bg-gray-100 dark:bg-gray-700 overflow-hidden border border-border-default shadow-inner">
                                <MapContainer
                                    center={[9.0192, 38.7525]}
                                    zoom={13}
                                    style={{ height: "100%", width: "100%" }}
                                    scrollWheelZoom={false}
                                >
                                    <ChangeView center={[9.0192, 38.7525]} />
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <Marker position={[9.0192, 38.7525]}>
                                        <Popup>
                                            <div className="text-center">
                                                <p className="font-bold">Customer Address</p>
                                                <p className="text-xs">{order.delivery_address}</p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                </MapContainer>
                            </div>

                            <div className="mt-4 flex gap-4 text-xs text-text-secondary dark:text-gray-400">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    Est. Arrival: 15-20 mins
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {order.area_name || "Assigned Area"}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-border-default dark:border-gray-700">
                        <h2 className="font-semibold text-lg mb-6 text-text-main dark:text-gray-200">Items ({order.items?.length || 0})</h2>
                        <div className="space-y-6">
                            {order.items?.map((item, idx) => (
                                <div key={idx} className="flex gap-4 items-start pb-6 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                                    <img
                                        src={getImageUrl(item.main_image)}
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

                <div className="space-y-8">
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
                                <span className="block text-text-secondary dark:text-gray-400 mb-1">Customer info</span>
                                <p className="font-medium text-text-main dark:text-gray-200">{order.customer_name}</p>
                                <p className="text-text-secondary">{order.customer_email}</p>
                                {order.customer_phone && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <a
                                            href={`tel:${order.customer_phone}`}
                                            className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
                                        >
                                            <Phone className="w-4 h-4" />
                                            {order.customer_phone}
                                        </a>
                                    </div>
                                )}
                            </div>
                            {!isDeliveryPerson && order.delivery_pin && (order.status !== 'delivered' && order.status !== 'completed') && (
                                <div className="pt-4 mt-4 border-t-2 border-dashed border-primary/20 bg-primary/5 p-4 rounded-lg">
                                    <span className="block text-primary font-bold text-xs uppercase tracking-widest mb-2 text-center">
                                        Delivery Verification PIN
                                    </span>
                                    <div className="flex justify-center gap-2">
                                        {order.delivery_pin.split('').map((digit, i) => (
                                            <div key={i} className="w-10 h-12 bg-white dark:bg-gray-700 border-2 border-primary/30 rounded-lg flex items-center justify-center text-2xl font-black text-primary shadow-sm">
                                                {digit}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-text-secondary dark:text-gray-400 mt-3 text-center leading-tight">
                                        Share this 6-digit code with the delivery person only when you receive your package.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-border-default dark:border-gray-700">
                        <h2 className="font-semibold text-lg mb-4 text-text-main dark:text-gray-200 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-primary" />
                            Financial Summary
                        </h2>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-text-secondary dark:text-gray-400">Method</span>
                                <span className="font-medium">
                                    {order.payment_method === "bank_transfer"
                                        ? "Bank Transfer"
                                        : order.payment_method === "mobile_banking"
                                            ? "Mobile Banking"
                                            : order.payment_method === "credit_card"
                                                ? "Credit/Debit Card"
                                                : "Cash on Delivery"}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-text-secondary dark:text-gray-400">Payment Status</span>
                                <span className={`font-medium px-2 py-0.5 rounded text-xs ${order.payment_status === 'paid'
                                    ? 'bg-green-100 text-green-700'
                                    : order.bank_transfer_details?.bank_payment_status === 'REJECTED'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {order.bank_transfer_details?.bank_payment_status === 'REJECTED'
                                        ? 'REJECTED'
                                        : order.payment_status?.toUpperCase()}
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

            {/* Chat Modal */}
            <ChatModal
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                shopId={order?.shop_id}
                shopName={order?.shop_name}
                orderId={order?.order_id}
            />

            {/* Image Preview Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[999] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-4xl w-full h-full flex items-center justify-center">
                        <img
                            src={selectedImage}
                            alt="Receipt Full"
                            className="max-w-full max-h-full object-contain shadow-2xl"
                        />
                        <button
                            className="absolute top-4 right-4 text-white hover:text-primary transition-colors"
                            onClick={() => setSelectedImage(null)}
                        >
                            <XCircle className="w-10 h-10" />
                        </button>
                    </div>
                </div>
            )}
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
