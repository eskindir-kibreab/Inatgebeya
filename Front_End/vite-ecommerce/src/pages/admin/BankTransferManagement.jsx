import React, { useState, useEffect } from "react";
import { bankTransferAPI } from "../../api";
import { CheckCircle, XCircle, Eye, Filter, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const BankTransferManagement = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterBank, setFilterBank] = useState("all");
    const [processingId, setProcessingId] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);

    const banks = [
        { id: "all", name: "All Banks" },
        { id: "awash", name: "Awash" },
        { id: "cbe", name: "CBE" },
        { id: "birhan", name: "Birhan" }
    ];

    useEffect(() => {
        fetchPendingPayments();
    }, []);

    const fetchPendingPayments = async () => {
        setLoading(true);
        try {
            const response = await bankTransferAPI.getPending();
            if (response.success) {
                setPayments(response.data);
            }
        } catch (error) {
            console.error("Fetch payments error:", error);
            toast.error("Failed to load pending payments");
        } finally {
            setLoading(false);
        }
    };

    const [rejectionDialog, setRejectionDialog] = useState(null); // { bank, paymentId }
    const [rejectionReason, setRejectionReason] = useState("");

    const handleAction = async (bank, paymentId, action, reason = null) => {
        if (action === 'reject' && !reason) {
            setRejectionDialog({ bank, paymentId });
            return;
        }

        setProcessingId(paymentId);
        try {
            const response = await bankTransferAPI.verify({
                bank,
                payment_id: paymentId,
                action,
                rejection_reason: reason
            });

            if (response.success) {
                toast.success(`Payment ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
                // Remove from local list
                setPayments(prev => prev.filter(p => !(p.id === paymentId && p.bank_type === bank)));
                setRejectionDialog(null);
                setRejectionReason("");
            }
        } catch (error) {
            console.error("Verify payment error:", error);
            toast.error(`Failed to ${action} payment`);
        } finally {
            setProcessingId(null);
        }
    };

    const filteredPayments = filterBank === "all"
        ? payments
        : payments.filter(p => p.bank_type === filterBank);

    const getImageUrl = (filename) => {
        // Assuming your backend serves static files from /uploads
        const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
        return `${baseUrl}/uploads/${filename}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-main dark:text-gray-100">
                        Bank Transfer Verification
                    </h1>
                    <p className="text-text-secondary dark:text-gray-400">
                        Review and verify manual bank transfer submissions
                    </p>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                    <Filter className="w-4 h-4 text-text-muted" />
                    {banks.map(bank => (
                        <button
                            key={bank.id}
                            onClick={() => setFilterBank(bank.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap
                                ${filterBank === bank.id
                                    ? "bg-primary text-white shadow-md"
                                    : "bg-white dark:bg-gray-800 text-text-main dark:text-gray-300 border border-border-default dark:border-gray-700 hover:border-primary"
                                }`}
                        >
                            {bank.name}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-text-secondary dark:text-gray-400">Loading pending payments...</p>
                </div>
            ) : filteredPayments.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-20 text-center border border-border-default dark:border-gray-700">
                    <div className="bg-gray-100 dark:bg-gray-700/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-status-success" />
                    </div>
                    <h3 className="text-lg font-semibold text-text-main dark:text-gray-200">No Pending Payments</h3>
                    <p className="text-text-secondary dark:text-gray-400 mt-2">
                        All bank transfers have been processed. Good job!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {filteredPayments.map(payment => (
                        <div
                            key={`${payment.bank_type}-${payment.id}`}
                            className="bg-white dark:bg-gray-800 rounded-xl border border-border-default dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-1 rounded text-xs font-bold bg-primary/10 text-primary uppercase">
                                                {payment.bank_type}
                                            </span>
                                            <span className="text-xs text-text-muted dark:text-gray-500">
                                                ID: #{payment.id} • {new Date(payment.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-text-main dark:text-gray-100 text-lg">
                                            {payment.customer_name}
                                        </h3>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-black text-primary">
                                            ETB {parseFloat(payment.amount).toLocaleString()}
                                        </div>
                                        <div className="text-xs text-text-muted">
                                            Order #{payment.order_id}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-border-default dark:border-gray-700">
                                            <p className="text-xs text-text-muted mb-1 font-semibold uppercase tracking-wider">Transaction ID</p>
                                            <p className="font-mono text-sm break-all font-bold text-text-main dark:text-gray-200">
                                                {payment.transaction_id}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {rejectionDialog?.paymentId === payment.id ? (
                                                <div className="flex-1 space-y-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
                                                    <textarea
                                                        placeholder="Reason for rejection (e.g., Transaction ID not found, Receipt blurry)"
                                                        value={rejectionReason}
                                                        onChange={(e) => setRejectionReason(e.target.value)}
                                                        className="w-full p-2 text-sm rounded border border-red-200 dark:border-red-800 dark:bg-gray-800 dark:text-white focus:ring-1 focus:ring-red-500 outline-none"
                                                        rows="2"
                                                        autoFocus
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleAction(payment.bank_type, payment.id, 'reject', rejectionReason)}
                                                            disabled={!rejectionReason.trim() || processingId === payment.id}
                                                            className="flex-1 bg-red-600 text-white py-2 rounded font-bold text-sm hover:bg-red-700 disabled:opacity-50"
                                                        >
                                                            Confirm Reject
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setRejectionDialog(null);
                                                                setRejectionReason("");
                                                            }}
                                                            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded text-sm dark:text-gray-300"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleAction(payment.bank_type, payment.id, 'approve')}
                                                        disabled={processingId === payment.id}
                                                        className="flex-1 flex items-center justify-center gap-2 bg-status-success text-white py-3 rounded-lg font-bold hover:bg-green-600 transition-colors disabled:opacity-50"
                                                    >
                                                        {processingId === payment.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(payment.bank_type, payment.id, 'reject')}
                                                        disabled={processingId === payment.id}
                                                        className="flex-1 flex items-center justify-center gap-2 bg-status-error text-white py-3 rounded-lg font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="relative group cursor-pointer" onClick={() => setSelectedImage(getImageUrl(payment.receipt_url))}>
                                        <img
                                            src={getImageUrl(payment.receipt_url)}
                                            alt="Receipt"
                                            className="w-full h-40 object-cover rounded-lg border border-border-default dark:border-gray-700"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                            <div className="bg-white p-2 rounded-full text-black">
                                                <Eye className="w-5 h-5" />
                                            </div>
                                        </div>
                                        <p className="mt-2 text-center text-xs text-primary font-medium">Click to view receipt</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Image Modal Lightbox */}
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
                            className="absolute top-0 right-0 p-4 text-white hover:text-primary transition-colors"
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

export default BankTransferManagement;
