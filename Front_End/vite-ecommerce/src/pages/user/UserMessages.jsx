import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { chatAPI } from "../../api/chat.api";
import {
    MessageCircle,
    Send,
    Loader2,
    Store,
    Search,
    ArrowLeft,
    Check,
    CheckCheck,
} from "lucide-react";
import toast from "react-hot-toast";

const UserMessages = () => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [selectedShop, setSelectedShop] = useState(null);
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
        fetchConversations();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const response = await chatAPI.getConversations();
            if (response.success) {
                setConversations(response.data);
            }
        } catch (error) {
            console.error("Error fetching conversations:", error);
            toast.error("Failed to load messages");
        } finally {
            setLoading(false);
        }
    };

    const fetchShopMessages = async (shopId) => {
        try {
            setLoadingMessages(true);
            const response = await chatAPI.getConversation(shopId);
            if (response.success) {
                setMessages(response.data);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleSelectShop = (shop) => {
        setSelectedShop(shop);
        fetchShopMessages(shop.shop_id);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedShop) return;

        try {
            setSending(true);
            const response = await chatAPI.send({
                shopId: selectedShop.shop_id,
                message: newMessage.trim(),
            });

            if (response.success) {
                setNewMessage("");
                fetchShopMessages(selectedShop.shop_id);
                // Refresh conversations list to update last message
                fetchConversations();
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
        conv.shop_name?.toLowerCase().includes(searchQuery.toLowerCase())
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
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="mb-6 flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                    <MessageCircle className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        My Messages
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Chat with shop owners and support
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="flex h-[600px]">
                    {/* Conversations List */}
                    <div
                        className={`w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col ${selectedShop ? "hidden md:flex" : ""
                            }`}
                    >
                        {/* Search */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search shops..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-0 focus:ring-2 focus:ring-primary text-sm shadow-inner"
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
                                        No messages yet
                                    </p>
                                </div>
                            ) : (
                                filteredConversations.map((conv) => (
                                    <button
                                        key={conv.shop_id}
                                        onClick={() => handleSelectShop(conv)}
                                        className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700/50 ${selectedShop?.shop_id === conv.shop_id
                                            ? "bg-primary/5 dark:bg-primary/10"
                                            : ""
                                            }`}
                                    >
                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                            <Store className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                                    {conv.shop_name}
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
                        className={`flex-1 flex flex-col ${!selectedShop ? "hidden md:flex" : ""
                            }`}
                    >
                        {selectedShop ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-800">
                                    <button
                                        onClick={() => setSelectedShop(null)}
                                        className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                        <Store className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {selectedShop.shop_name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Chatting with Shop Owner
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
                                                            const isOwn = msg.sender_id == (user?.user_id || user?.userId || user?.id);
                                                            return (
                                                                <div
                                                                    key={msg.message_id}
                                                                    className={`flex ${isOwn ? "justify-end" : "justify-start"
                                                                        }`}
                                                                >
                                                                    <div
                                                                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm ${isOwn
                                                                            ? "bg-blue-600 text-white rounded-br-md"
                                                                            : "bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-md border border-gray-200 dark:border-gray-600"
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
                                            placeholder="Type a message..."
                                            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl border-0 focus:ring-2 focus:ring-primary outline-none text-gray-900 dark:text-white placeholder-gray-500 shadow-inner"
                                            disabled={sending}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newMessage.trim() || sending}
                                            className="p-3 bg-primary hover:bg-primary/90 text-white rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
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
                            <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-gray-50/50 dark:bg-gray-900/10">
                                <MessageCircle className="w-16 h-16 text-gray-200 dark:text-gray-700 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    Select a Conversation
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                                    Choose a shop or support conversation from the list to start chatting.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserMessages;
