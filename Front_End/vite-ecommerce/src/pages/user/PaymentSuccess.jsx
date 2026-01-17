import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, ArrowRight, ShoppingBag } from "lucide-react";
import { paymentsAPI } from "../../api";
import Button from "../../components/forms/Button";
import toast from "react-hot-toast";

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("verifying"); // verifying, success, failed
    const tx_ref = searchParams.get("tx_ref");

    useEffect(() => {
        const verify = async () => {
            if (!tx_ref) {
                setStatus("failed");
                return;
            }

            try {
                const response = await paymentsAPI.verify(tx_ref);
                if (response.success) {
                    setStatus("success");
                    toast.success("Payment verified successfully!");
                    // Redirect to order details after a short delay
                    if (response.orderId) {
                        setTimeout(() => {
                            navigate(`/orders/${response.orderId}`, { replace: true });
                        }, 3000);
                    }
                } else {
                    setStatus("failed");
                }
            } catch (error) {
                console.error("Verification error:", error);
                setStatus("failed");
                toast.error("Could not verify payment status.");
            }
        };

        verify();
    }, [tx_ref, navigate]);

    if (status === "verifying") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <h1 className="text-2xl font-bold text-text-main dark:text-gray-200">Verifying Payment...</h1>
                <p className="text-text-secondary dark:text-gray-400 text-center max-w-md">
                    Please wait while we confirm your transaction with Chapa. This will only take a moment.
                </p>
            </div>
        );
    }

    if (status === "failed") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
                <XCircle className="w-20 h-20 text-status-error" />
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-text-main dark:text-gray-200">Payment Unsuccessful</h1>
                    <p className="text-text-secondary dark:text-gray-400 max-w-md mx-auto">
                        Something went wrong during the payment verification. Don't worry, if your money was deducted, our team will review it.
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" onClick={() => navigate("/checkout")}>Try Again</Button>
                    <Link to="/orders">
                        <Button>View Orders</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 text-center px-4">
            <div className="relative">
                <div className="absolute inset-0 bg-green-100 dark:bg-green-900/20 rounded-full animate-ping opacity-25"></div>
                <CheckCircle className="w-24 h-24 text-status-success relative z-10" />
            </div>

            <div className="space-y-3">
                <h1 className="text-4xl font-bold text-text-main dark:text-gray-200">Payment Successful!</h1>
                <p className="text-lg text-text-secondary dark:text-gray-400 max-w-md mx-auto">
                    Your payment was verified. We are redirecting you to your order details...
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-border-default dark:border-gray-700 w-full max-w-sm">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-text-secondary dark:text-gray-400">Transaction ID:</span>
                    <span className="font-mono font-medium text-text-main dark:text-gray-200 truncate ml-2">
                        {tx_ref}
                    </span>
                </div>
                <Link to="/orders" className="block w-full">
                    <Button fullWidth icon={ShoppingBag}>My Orders</Button>
                </Link>
                <Link to="/" className="flex items-center justify-center gap-2 mt-4 text-primary font-medium hover:underline">
                    Continue Shopping <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
};

export default PaymentSuccess;
