import React, { useState, useEffect } from "react";
import { Mail, Phone, MapPin, MessageCircle, Clock } from "lucide-react";
import { shopsAPI } from "../../api/shops.api";
import { useAuth } from "../../context/AuthContext";
import ChatModal from "../../components/chat/ChatModal";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const Contact = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [supportShop, setSupportShop] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(false);

    useEffect(() => {
        fetchSupportShop();
    }, []);

    const fetchSupportShop = async () => {
        try {
            const res = await shopsAPI.getSupportShop();
            if (res.success) {
                setSupportShop(res.data);
            }
        } catch (error) {
            console.error("Failed to fetch support shop:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChatOpen = () => {
        if (!user) {
            toast("Please login to chat with support", { icon: "🔒" });
            navigate("/login", { state: { from: "/contact" } });
            return;
        }
        if (!supportShop) {
            toast.error("Support chat is currently unavailable");
            return;
        }
        setIsChatOpen(true);
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                    Get in Touch
                </h1>
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-lg">
                    We're here to help and answer any question you might have.
                    We look forward to hearing from you.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                {/* Visit Us */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow text-center group">
                    <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                        <MapPin className="w-7 h-7 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-xl mb-3">Visit Us</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                        Addis Ababa, Ethiopia
                    </p>
                </div>

                {/* Email Us */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow text-center group">
                    <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Mail className="w-7 h-7 text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-xl mb-3">Email Us</h3>
                    <p className="text-gray-600 dark:text-gray-300">info@inatgebeya.com</p>
                </div>

                {/* Call Us */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow text-center group">
                    <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Phone className="w-7 h-7 text-amber-600" />
                    </div>
                    <h3 className="font-bold text-xl mb-3">Call Us</h3>
                    <p className="text-gray-600 dark:text-gray-300">+251 900 123 456</p>
                </div>

                {/* Live Chat */}
                <div
                    onClick={handleChatOpen}
                    className="bg-primary/5 dark:bg-primary/10 border-2 border-primary/20 border-dashed cursor-pointer hover:bg-primary/10 dark:hover:bg-primary/20 p-8 rounded-2xl shadow-sm hover:shadow-md transition-all text-center group relative overflow-hidden"
                >
                    <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                        <MessageCircle className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-bold text-xl mb-3 text-primary">Live Chat</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-2">Chat with Support Team</p>
                    <span className="text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                        Online Now
                    </span>
                </div>
            </div>

            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg flex-shrink-0">
                        <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold mb-2">Business Hours</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            Our support team is available to assist you during the following hours:
                        </p>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex justify-between border-b pb-2">
                                <span>Monday - Friday</span>
                                <span className="font-medium text-gray-800 dark:text-gray-200">9:00 AM - 6:00 PM</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span>Saturday</span>
                                <span className="font-medium text-gray-800 dark:text-gray-200">9:00 AM - 1:00 PM</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span>Sunday</span>
                                <span className="font-medium text-gray-800 dark:text-gray-200">Closed</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Modal */}
            {isChatOpen && supportShop && (
                <ChatModal
                    isOpen={isChatOpen}
                    onClose={() => setIsChatOpen(false)}
                    shopId={supportShop.shop_id}
                    shopName="InatGebeya Support"
                />
            )}
        </div>
    );
};

export default Contact;
