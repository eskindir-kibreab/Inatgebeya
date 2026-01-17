import React, { useState, useEffect, useRef } from "react";
import { X, Send, Loader2, MessageCircle, Store, Check, CheckCheck } from "lucide-react";
import { chatAPI } from "../../api/chat.api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { useSocket } from "../../context/SocketContext";

const ChatModal = ({
    isOpen,
    onClose,
    shopId,
    shopName,
    orderId = null,
    productId = null,
}) => {
    const { user } = useAuth();
    const socket = useSocket();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen && shopId) {
            fetchMessages();
        }
    }, [isOpen, shopId]);

    // Socket listener for real-time messages
    useEffect(() => {
        if (socket) {
            const handleMessage = (msg) => {
                // Check if the message belongs to this conversation
                if (msg.shop_id == shopId) {
                    setMessages((prev) => [...prev, msg]);
                }
            };

            socket.on("receive_message", handleMessage);

            return () => {
                socket.off("receive_message", handleMessage);
            };
        }
    }, [socket, shopId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const response = await chatAPI.getConversation(shopId);
            if (response.success) {
                setMessages(response.data);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            setSending(true);
            const response = await chatAPI.send({
                shopId,
                message: newMessage.trim(),
                orderId,
                productId,
            });

            if (response.success) {
                setNewMessage("");
                fetchMessages();
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

    // Group messages by date
    const groupedMessages = messages.reduce((groups, message) => {
        const date = formatDate(message.created_at);
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(message);
        return groups;
    }, {});

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary/10 to-primary/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                            <Store className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">
                                {shopName || "Shop"}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Contact Shop Owner
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] bg-gray-50 dark:bg-gray-900/50">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-8">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <MessageCircle className="w-8 h-8 text-primary" />
                            </div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                                Start a Conversation
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                                Send a message to the shop owner. They will respond as soon as possible.
                            </p>
                        </div>
                    ) : (
                        Object.entries(groupedMessages).map(([date, dateMessages]) => (
                            <div key={date}>
                                <div className="flex items-center justify-center my-4">
                                    <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-400">
                                        {date}
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {dateMessages.map((msg) => {
                                        const isOwn = msg.sender_id == (user?.user_id || user?.userId);
                                        return (
                                            <div
                                                key={msg.message_id}
                                                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
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
                                                        className={`text-[10px] mt-1 flex items-center gap-1 ${isOwn
                                                            ? "justify-end text-white/70"
                                                            : "justify-start text-gray-500 dark:text-gray-400"}`}
                                                    >
                                                        <span>{formatTime(msg.created_at)}</span>
                                                        {isOwn && (
                                                            msg.is_read ? (
                                                                <CheckCheck className="w-3 h-3" />
                                                            ) : (
                                                                <Check className="w-3 h-3" />
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                        );
                                    })}
                                </div>
                            </div>
                        ))
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
            </div>
        </div >
    );
};

export default ChatModal;
