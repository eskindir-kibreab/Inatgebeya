import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, Loader2, Smartphone, ShieldCheck } from "lucide-react";
import Button from "../forms/Button";

const PaymentModal = ({ isOpen, onClose, onPaymentSuccess, amount, method }) => {
    const [step, setStep] = useState('confirm'); // confirm, processing, success, error
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setStep('confirm');
            setPin("");
            setError("");
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (pin !== '1234') {
            setError("Incorrect PIN. Try 1234.");
            setPin("");
            return;
        }

        setStep('processing');
        // Simulate API delay
        setTimeout(() => {
            setStep('success');
            // Automatic close and success after 2 seconds
            setTimeout(() => {
                onPaymentSuccess();
            }, 2000);
        }, 2500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-in">
                {/* Header */}
                <div className="p-4 text-center border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Smartphone className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-lg font-bold text-text-main dark:text-white uppercase tracking-wider">
                        Mobile Payment
                    </h2>
                    <p className="text-xs text-text-secondary dark:text-gray-400">
                        {method === 'mobile_banking' ? 'Telebirr/CBE Birr' : 'Bank Transfer'}
                    </p>
                </div>

                {/* Content */}
                <div className="p-5">
                    {step === 'confirm' && (
                        <div className="space-y-4">
                            <div className="bg-bg-light dark:bg-gray-700/50 p-3 rounded-xl text-center">
                                <span className="text-xs text-text-secondary dark:text-gray-400 block mb-1">Amount to Pay</span>
                                <span className="text-2xl font-bold text-primary">ETB {amount.toLocaleString()}</span>
                            </div>

                            <div className="space-y-3">
                                <label className={`block text-xs font-medium text-center ${error ? 'text-red-500 font-bold animate-pulse' : 'text-text-secondary dark:text-gray-400'}`}>
                                    {error || "Enter PIN (1234)"}
                                </label>
                                <div className="flex justify-center gap-3">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className={`w-10 h-10 border-2 rounded-lg flex items-center justify-center text-xl font-bold transition-all duration-200
                        ${pin.length >= i
                                                    ? error ? 'border-red-500 bg-red-50 text-red-500' : 'border-primary bg-primary/5'
                                                    : 'border-gray-200 dark:border-gray-600'}`}
                                        >
                                            {pin.length >= i ? '•' : ''}
                                        </div>
                                    ))}
                                </div>
                                {/* Visual PIN Pad - Simulation Only */}
                                <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto mt-2">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map((key) => (
                                        <button
                                            key={key}
                                            onClick={() => {
                                                if (key === 'C') {
                                                    setPin("");
                                                    setError("");
                                                }
                                                else if (key === 'OK') handleConfirm();
                                                else if (pin.length < 4) {
                                                    setPin(prev => prev + key);
                                                    setError("");
                                                }
                                            }}
                                            className="h-10 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-primary/10 
                               hover:text-primary transition-colors font-semibold text-sm"
                                        >
                                            {key}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <p className="text-xs text-center text-text-muted flex items-center justify-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                This is a secure simulation. No real money will be charged.
                            </p>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="py-12 text-center space-y-4">
                            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
                            <h3 className="text-lg font-semibold dark:text-white">Verifying Transaction...</h3>
                            <p className="text-sm text-text-secondary dark:text-gray-400">
                                Please wait while we connect to the bank.
                            </p>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="py-10 text-center space-y-4 animate-scale-in">
                            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="w-12 h-12 text-status-success" />
                            </div>
                            <h3 className="text-2xl font-bold text-status-success">Payment Successful!</h3>
                            <p className="text-text-secondary dark:text-gray-400">
                                Transaction ID: TXN-{Math.random().toString(36).substr(2, 9).toUpperCase()}
                            </p>
                            <p className="text-sm font-medium text-text-muted">
                                Redirecting back to shop...
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {step === 'confirm' && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <Button
                            variant="outline"
                            fullWidth
                            onClick={onClose}
                            className="mb-0"
                        >
                            Cancel Transaction
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentModal;
