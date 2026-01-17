import React, { useState, useEffect } from "react";
import { transactionsAPI } from "../../api";
import {
    CreditCard,
    ArrowUpRight,
    ArrowDownLeft,
    Printer,
    Search,
    Filter,
    FileText,
    Calendar,
    Download
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const Transactions = () => {
    const { role, user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const response = await transactionsAPI.getMyTransactions();
            if (response.success) {
                setTransactions(response.data);
            }
        } catch (error) {
            toast.error("Failed to load transactions");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportCSV = () => {
        if (filteredTransactions.length === 0) {
            toast.error("No data to export");
            return;
        }

        const headers = ["Date", "Time", "Reference", "Description", "Method", "Type", "Amount"];
        const csvContent = [
            headers.join(","),
            ...filteredTransactions.map(tx => {
                let displayRef = tx.tx_ref || String(tx.id);
                if (tx.description && tx.description.includes(': ')) {
                    const parts = tx.description.split(': ');
                    displayRef = parts[parts.length - 1];
                } else if (displayRef.startsWith('BANK-')) {
                    const parts = displayRef.split('-');
                    displayRef = parts[parts.length - 1];
                }

                return [
                    new Date(tx.date).toLocaleDateString(),
                    new Date(tx.date).toLocaleTimeString(),
                    displayRef,
                    tx.description || tx.source || "General",
                    tx.payment_method || tx.source || "Transfer",
                    tx.type || (tx.status === 'completed' ? 'credit' : 'debit'),
                    tx.amount
                ].join(",");
            })
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `financial_history_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("CSV Exported successfully");
    };

    const filteredTransactions = transactions.filter(tx => {
        const search = searchTerm.toLowerCase();
        const matchesSearch = !search ||
            (tx.description && String(tx.description).toLowerCase().includes(search)) ||
            (tx.tx_ref && String(tx.tx_ref).toLowerCase().includes(search)) ||
            (tx.actor && String(tx.actor).toLowerCase().includes(search));

        const matchesType = filterType === "all" ||
            (filterType === "credit" && (tx.type === "credit" || tx.status === "completed")) ||
            (filterType === "debit" && tx.type === "debit");

        return matchesSearch && matchesType;
    });

    const formatAmount = (amount) => {
        const value = Number(amount) || 0;
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB'
        }).format(value);
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header - Hidden on Print */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <div>
                    <h1 className="text-3xl font-black text-text-main dark:text-gray-100 flex items-center gap-3">
                        <CreditCard className="w-8 h-8 text-primary" />
                        Financial History
                    </h1>
                    <p className="text-text-secondary dark:text-gray-400">
                        View and export your transaction ledger
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 text-text-main dark:text-gray-200 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95"
                    >
                        <Download className="w-5 h-5" />
                        Export CSV
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-hover shadow-lg transition-all active:scale-95"
                    >
                        <Printer className="w-5 h-5" />
                        Print Report
                    </button>
                </div>
            </div>

            {/* Print Only Header */}
            <div className="hidden print:block border-b-2 border-primary pb-6 mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-black text-primary mb-2">INATGEBEYA</h1>
                        <p className="text-lg font-bold">Transaction History Report</p>
                        <p className="text-sm text-gray-600">Generated on: {new Date().toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold">{user?.full_name}</p>
                        <p className="text-sm text-gray-600">{user?.email}</p>
                        <p className="text-sm text-gray-600 uppercase">Role: {role}</p>
                    </div>
                </div>
            </div>

            {/* Filters - Hidden on Print */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-border-default dark:border-gray-700 flex flex-col md:flex-row gap-4 print:hidden">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Search reference, description or actor..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border-none focus:ring-2 focus:ring-primary outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border-none focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="all">All Types</option>
                        <option value="credit">Credits</option>
                        <option value="debit">Debits</option>
                    </select>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-border-default dark:border-gray-700 overflow-hidden print:border-none print:shadow-none">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900 border-b border-border-default dark:border-gray-700 print:bg-gray-100">
                                <th className="px-6 py-4 font-bold text-sm text-text-muted uppercase tracking-wider">Date & Time</th>
                                <th className="px-6 py-4 font-bold text-sm text-text-muted uppercase tracking-wider">Reference</th>
                                <th className="px-6 py-4 font-bold text-sm text-text-muted uppercase tracking-wider">Description</th>
                                <th className="px-6 py-4 font-bold text-sm text-text-muted uppercase tracking-wider">Method/Source</th>
                                <th className="px-6 py-4 font-bold text-sm text-text-muted uppercase tracking-wider text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-default dark:divide-gray-700">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {[...Array(5)].map((_, j) => (j === 4 ?
                                            <td key={j} className="px-6 py-4 text-right"><div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded ml-auto"></div></td> :
                                            <td key={j} className="px-6 py-4"><div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                        ))}
                                    </tr>
                                ))
                            ) : filteredTransactions.length > 0 ? (
                                filteredTransactions.map((tx) => {
                                    const isCredit = tx.type === 'credit' || tx.status === 'completed';
                                    return (
                                        <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors print:page-break-inside-avoid">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-text-muted print:hidden" />
                                                    <span className="text-sm font-medium">
                                                        {new Date(tx.date).toLocaleDateString()}
                                                        <span className="text-xs text-text-muted block">{new Date(tx.date).toLocaleTimeString()}</span>
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs font-bold px-2 py-1 bg-gray-100 dark:bg-gray-900 rounded print:bg-none print:p-0">
                                                    {(() => {
                                                        const ref = tx.tx_ref || String(tx.id);
                                                        // Extract ID from description if it's a wallet transaction
                                                        if (tx.description && tx.description.includes(': ')) {
                                                            const parts = tx.description.split(': ');
                                                            return parts[parts.length - 1];
                                                        }
                                                        // Strip BANK- prefix if present
                                                        if (ref.startsWith('BANK-')) {
                                                            const parts = ref.split('-');
                                                            return parts[parts.length - 1];
                                                        }
                                                        return ref;
                                                    })()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-bold text-text-main dark:text-gray-100 uppercase">
                                                        {tx.description || tx.source?.replace('_', ' ') || 'General'}
                                                    </p>
                                                    {tx.actor && <p className="text-xs text-text-muted">By: {tx.actor}</p>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-semibold capitalize text-text-secondary">
                                                    {(() => {
                                                        const m = (tx.payment_method || tx.source || 'Transfer').toLowerCase();
                                                        if (m === 'order_earning') {
                                                            if (tx.description?.toLowerCase().includes('bank')) return 'Bank Transfer';
                                                            if (tx.description?.toLowerCase().includes('chapa') || tx.description?.toLowerCase().includes('mobile')) return 'Chapa';
                                                            return 'Order Earning';
                                                        }
                                                        return m.replace('_', ' ');
                                                    })()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {isCredit ?
                                                        <ArrowDownLeft className="w-4 h-4 text-status-success print:hidden" /> :
                                                        <ArrowUpRight className="w-4 h-4 text-status-error print:hidden" />
                                                    }
                                                    <span className={`text-lg font-black ${isCredit ? 'text-status-success' : 'text-status-error'} print:text-black`}>
                                                        {isCredit ? '+' : '-'}{formatAmount(tx.amount)}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-full">
                                                <FileText className="w-8 h-8 text-text-muted" />
                                            </div>
                                            <p className="text-text-secondary font-medium">No transactions found matching your criteria</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Print Footer */}
            <div className="hidden print:block mt-20 border-t pt-8 text-center text-sm text-gray-500">
                <p>This is a computer-generated document. No signature required.</p>
                <p>© {new Date().getFullYear()} Inatgebeya Marketplace. All Rights Reserved.</p>
            </div>
        </div>
    );
};

export default Transactions;
