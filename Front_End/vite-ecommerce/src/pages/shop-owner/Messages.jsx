import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { chatAPI } from "../../api/chat.api";
import { shopsAPI } from "../../api/shops.api";
import {
    MessageCircle,
    Send,
    Loader2,
    User,
    Search,
    ArrowLeft,
    Clock,
    Check,
    CheckCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { useSocket } from "../../context/SocketContext";

const Messages = () => {
    const { user } = useAuth();
    const socket = useSocket();
    const [shop, setShop] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        fetchShop();
    }, []);

    // Socket listener for real-time messages
    useEffect(() => {
        if (socket && shop) {
            const handleMessage = (msg) => {
                // 1. If it's the current selected customer, add to messages
                if (selectedCustomer &&
                    (msg.sender_id == selectedCustomer.customer_id || msg.receiver_id == selectedCustomer.customer_id) &&
                    msg.shop_id == shop.shop_id) {
                    setMessages((prev) => [...prev, msg]);
                }

                // 2. Update the conversations list
                setConversations((prev) => {
                    const customerId = msg.sender_id == shop.owner_id ? msg.receiver_id : msg.sender_id;
                    const existingConvIndex = prev.findIndex(c => c.customer_id == customerId);

                    if (existingConvIndex !== -1) {
                        const newConvs = [...prev];
                        const conv = { ...newConvs[existingConvIndex] };
                        conv.last_message = msg.message;
                        conv.last_message_at = msg.created_at;

                        // Increment unread count if it's from customer and not currently selected
                        if (msg.sender_id != shop.owner_id && (!selectedCustomer || selectedCustomer.customer_id != customerId)) {
                            conv.unread_count = (conv.unread_count || 0) + 1;
                        }

                        // Move to top
                        newConvs.splice(existingConvIndex, 1);
                        newConvs.unshift(conv);
                        return newConvs;
                    } else {
                        // If it's a new conversation, we might need a fetch or manually add
                        // For simplicity, let's just fetch for now if it's a new one, or leave it for refresh
                        // but usually it's better to fetch conversations again
                        fetchConversations(shop.shop_id);
                        return prev;
                    }
                });
            };

            socket.on("receive_message", handleMessage);

            return () => {
                socket.off("receive_message", handleMessage);
            };
        }
    }, [socket, shop, selectedCustomer]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchShop = async () => {
        try {
            const response = await shopsAPI.getMyShop();
            if (response.success && response.data) {
                setShop(response.data);
                fetchConversations(response.data.shop_id);
            }
        } catch (error) {
            console.error("Error fetching shop:", error);
        }
    };

    const fetchConversations = async (shopId) => {
        try {
            setLoading(true);
            const response = await chatAPI.getShopConversations(shopId);
            if (response.success) {
                setConversations(response.data);
            }
        } catch (error) {
            console.error("Error fetching conversations:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomerMessages = async (customerId) => {
        if (!shop) return;
        try {
            setLoadingMessages(true);
            const response = await chatAPI.getCustomerConversation(
                shop.shop_id,
                customerId
            );
            if (response.success) {
                setMessages(response.data);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleSelectCustomer = (customer) => {
        setSelectedCustomer(customer);
        fetchCustomerMessages(customer.customer_id);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedCustomer || !shop) return;

        try {
            setSending(true);
            const response = await chatAPI.send({
                shopId: shop.shop_id,
                customerId: selectedCustomer.customer_id,
                message: newMessage.trim(),
            });

            if (response.success) {
                setNewMessage("");
                fetchCustomerMessages(selectedCustomer.customer_id);
            }
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error("Failed to send message");
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return "Today";
        } else if (date.toDateString() === yesterday.toDateString()) {
            return "Yesterday";
        }
        return date.toLocaleDateString([], { month: "short", day: "numeric" });
    };

    const filteredConversations = conversations.filter((conv) =>
        conv.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group messages by date
    const groupedMessages = messages.reduce((groups, message) => {
        const date = formatDate(message.created_at);
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(message);
        return groups;
    }, {});

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Customer Messages
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    View and respond to customer inquiries
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex h-[600px]">
                    {/* Conversations List */}
                    <div
                        className={`w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col ${selectedCustomer ? "hidden md:flex" : ""
                            }`}
                    >
                        {/* Search */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search customers..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-0 focus:ring-2 focus:ring-primary text-sm"
                                />
                            </div>
                        </div>

                        {/* Conversations */}
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                </div>
                            ) : filteredConversations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                                    <MessageCircle className="w-12 h-12 text-gray-300 mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400">
                                        No conversations yet
                                    </p>
                                </div>
                            ) : (
                                filteredConversations.map((conv) => (
                                    <button
                                        key={conv.customer_id}
                                        onClick={() => handleSelectCustomer(conv)}
                                        className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700/50 ${selectedCustomer?.customer_id === conv.customer_id
                                            ? "bg-primary/5"
                                            : ""
                                            }`}
                                    >
                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                            <User className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                                    {conv.customer_name}
                                                </p>
                                                <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                                                    {formatDate(conv.last_message_at)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                {conv.last_message}
                                            </p>
                                        </div>
                                        {conv.unread_count > 0 && (
                                            <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                                                {conv.unread_count}
                                            </span>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div
                        className={`flex-1 flex flex-col ${!selectedCustomer ? "hidden md:flex" : ""
                            }`}
                    >
                        {selectedCustomer ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
                                    <button
                                        onClick={() => setSelectedCustomer(null)}
                                        className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                        <User className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {selectedCustomer.customer_name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {selectedCustomer.customer_email}
                                        </p>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                                    {loadingMessages ? (
                                        <div className="flex items-center justify-center h-full">
                                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                        </div>
                                    ) : (
                                        Object.entries(groupedMessages).map(
                                            ([date, dateMessages]) => (
                                                <div key={date}>
                                                    <div className="flex items-center justify-center my-4">
                                                        <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-400">
                                                            {date}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {dateMessages.map((msg) => {
                                                            // console.log('Msg:', msg.sender_id, 'User:', user?.userId);
                                                            const isOwn = msg.sender_id == (user?.user_id || user?.userId);
                                                            return (
                                                                <div
                                                                    key={msg.message_id}
                                                                    className={`flex ${isOwn ? "justify-end" : "justify-start"
                                                                        }`}
                                                                >
                                                                    <div
                                                                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm ${isOwn
                                                                            ? "bg-blue-600 text-white rounded-br-md"
                                                                            : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-md"
                                                                            }`}
                                                                    >
                                                                        <p className="text-sm whitespace-pre-wrap break-words">
                                                                            {msg.message}
                                                                        </p>
                                                                        <div
                                                                            className={`flex items-center gap-1 mt-1 ${isOwn
                                                                                ? "justify-end"
                                                                                : "justify-start"
                                                                                }`}
                                                                        >
                                                                            <span
                                                                                className={`text-[10px] ${isOwn
                                                                                    ? "text-white/70"
                                                                                    : "text-gray-500 dark:text-gray-400"}`}
                                                                            >
                                                                                {formatTime(msg.created_at)}
                                                                            </span>
                                                                            {isOwn && (
                                                                                msg.is_read ? (
                                                                                    <CheckCheck className="w-3 h-3 text-white/70" />
                                                                                ) : (
                                                                                    <Check className="w-3 h-3 text-white/70" />
                                                                                )
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )
                                        )
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <form
                                    onSubmit={handleSend}
                                    className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type a reply..."
                                            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl border-0 focus:ring-2 focus:ring-primary outline-none text-gray-900 dark:text-white placeholder-gray-500"
                                            disabled={sending}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newMessage.trim() || sending}
                                            className="p-3 bg-primary hover:bg-primary/90 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                                        >
                                            {sending ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <Send className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6">
                                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                    <MessageCircle className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    Select a Conversation
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                                    Choose a customer from the list to view their messages and
                                    respond to their inquiries.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Messages;
