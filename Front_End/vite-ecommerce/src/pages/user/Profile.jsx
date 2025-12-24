import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  CreditCard,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { usersAPI } from "../../api/users.api";
import { ordersAPI } from "../../api/orders.api";
import Input from "../../components/forms/Input";
import Button from "../../components/forms/Button";
import toast from "react-hot-toast";

const Profile = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const defaultProfileData = {
    full_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    country: ""
  };

  const [profileData, setProfileData] = useState(defaultProfileData);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        ...defaultProfileData,
        ...user,
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getMyOrders({ limit: 5 });
      if (response.success) {
        setOrders(response.data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await usersAPI.updateProfile(profileData);
      if (response.success) {
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogout = () => {
    logout();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-ET");
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "addresses", label: "Addresses", icon: MapPin },
    { id: "payment", label: "Payment", icon: CreditCard },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-main dark:text-gray-200">
          My Account
        </h1>
        <p className="text-text-secondary dark:text-gray-400 mt-2">
          Manage your profile, orders, and account settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div
            className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                         dark:border-gray-700 p-6 sticky top-24"
          >
            {/* User Info */}
            <div className="text-center mb-8">
              <div
                className="w-20 h-20 bg-primary/10 rounded-full flex items-center 
                           justify-center mx-auto mb-4"
              >
                <User className="w-10 h-10 text-primary" />
              </div>
              <h2 className="font-semibold text-text-main dark:text-gray-200">
                {user?.full_name}
              </h2>
              <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
                {user?.email}
              </p>
              <div
                className="mt-2 px-3 py-1 bg-primary/10 text-primary text-sm 
                           rounded-full inline-block"
              >
                {user?.role?.role_name?.replace("_", " ") || "User"}
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg 
                              transition-colors text-left
                              ${
                                activeTab === tab.id
                                  ? "bg-primary text-white"
                                  : "text-text-secondary dark:text-gray-400 hover:bg-bg-light dark:hover:bg-gray-700"
                              }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg 
                         text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 
                         transition-colors text-left"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div
              className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                           dark:border-gray-700 p-6"
            >
              <h2 className="text-xl font-semibold text-text-main dark:text-gray-200 mb-6">
                Personal Information
              </h2>

              <form onSubmit={handleProfileUpdate}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <Input
                    label="Full Name"
                    name="full_name"
                    value={profileData.full_name}
                    onChange={handleChange}
                    icon={User}
                  />

                  <Input
                    label="Email"
                    name="email"
                    value={profileData.email}
                    onChange={handleChange}
                    type="email"
                    icon={Mail}
                  />

                  <Input
                    label="Phone Number"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleChange}
                    type="tel"
                    icon={Phone}
                  />
                </div>

                <Button type="submit" loading={saving}>
                  Save Changes
                </Button>
              </form>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div
              className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                           dark:border-gray-700"
            >
              <div className="p-6 border-b border-border-default dark:border-gray-700">
                <h2 className="text-xl font-semibold text-text-main dark:text-gray-200">
                  Recent Orders
                </h2>
              </div>

              {loading ? (
                <div className="p-6">
                  <div className="animate-pulse space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="h-20 bg-gray-200 dark:bg-gray-700 rounded"
                      ></div>
                    ))}
                  </div>
                </div>
              ) : orders.length > 0 ? (
                <div className="divide-y divide-border-default dark:divide-gray-700">
                  {orders.map((order) => (
                    <div key={order.id} className="p-6">
                      <div
                        className="flex flex-col md:flex-row md:items-center justify-between 
                                    gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-text-main dark:text-gray-200">
                              Order #{order.id}
                            </h3>
                            <span
                              className={`px-2 py-1 text-xs rounded-full capitalize
                                           ${
                                             order.status === "delivered"
                                               ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                               : order.status === "cancelled"
                                               ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                                               : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                                           }`}
                            >
                              {order.status}
                            </span>
                          </div>
                          <p className="text-sm text-text-secondary dark:text-gray-400">
                            Placed on {formatDate(order.created_at)}
                          </p>
                          <p className="text-sm text-text-secondary dark:text-gray-400">
                            {order.items?.length || 0} items • ETB{" "}
                            {order.total_amount}
                          </p>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() =>
                              (window.location.href = `/orders/${order.id}`)
                            }
                            className="px-4 py-2 border border-primary text-primary 
                                     hover:bg-primary/10 rounded-lg text-sm font-medium"
                          >
                            View Details
                          </button>
                          {order.status === "delivered" && (
                            <button
                              className="px-4 py-2 border border-border-default 
                                             dark:border-gray-700 rounded-lg text-sm 
                                             font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              Buy Again
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="text-4xl mb-4">📦</div>
                  <h3 className="text-lg font-semibold text-text-main dark:text-gray-200 mb-2">
                    No orders yet
                  </h3>
                  <p className="text-text-secondary dark:text-gray-400 mb-4">
                    When you place an order, it will appear here.
                  </p>
                  <button
                    onClick={() => (window.location.href = "/")}
                    className="btn-primary"
                  >
                    Start Shopping
                  </button>
                </div>
              )}

              <div className="p-6 border-t border-border-default dark:border-gray-700">
                <button
                  onClick={() => (window.location.href = "/orders")}
                  className="text-primary hover:text-primary-hover font-medium"
                >
                  View All Orders →
                </button>
              </div>
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === "addresses" && (
            <div
              className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                           dark:border-gray-700 p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-text-main dark:text-gray-200">
                  Saved Addresses
                </h2>
                <button className="btn-primary">Add New Address</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    type: "Home",
                    address: "Bole, Addis Ababa",
                    isDefault: true,
                  },
                  {
                    type: "Work",
                    address: "Megenagna, Addis Ababa",
                    isDefault: false,
                  },
                ].map((addr, index) => (
                  <div
                    key={index}
                    className="border border-border-default 
                                            dark:border-gray-700 rounded-lg p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-medium text-text-main dark:text-gray-200">
                          {addr.type} Address
                        </h3>
                        {addr.isDefault && (
                          <span
                            className="inline-block mt-1 px-2 py-1 bg-primary/10 
                                         text-primary text-xs rounded-full"
                          >
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button className="text-sm text-primary hover:text-primary-hover">
                          Edit
                        </button>
                        <button className="text-sm text-red-600 hover:text-red-700">
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="text-text-secondary dark:text-gray-400 space-y-1">
                      <p>{user?.full_name}</p>
                      <p>{addr.address}</p>
                      <p>{user?.phone || "+251 900 123 456"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Tab */}
          {activeTab === "payment" && (
            <div
              className="bg-white dark:bg-gray-800 rounded-xl border border-borderdefault 
                           dark:border-gray-700 p-6"
            >
              <h2 className="text-xl font-semibold text-text-main dark:text-gray-200 mb-6">
                Payment Methods
              </h2>

              <div className="space-y-6">
                <div
                  className="border border-border-default dark:border-gray-700 
                               rounded-lg p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 
                                   rounded-lg flex items-center justify-center"
                      >
                        <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-text-main dark:text-gray-200">
                          Cash on Delivery
                        </h3>
                        <p className="text-sm text-text-secondary dark:text-gray-400">
                          Pay when you receive your order
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                      Default
                    </span>
                  </div>
                </div>

                <div
                  className="border border-border-default dark:border-gray-700 
                               rounded-lg p-6"
                >
                  <h3 className="font-medium text-text-main dark:text-gray-200 mb-4">
                    Add Payment Method
                  </h3>

                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <button
                        className="flex-1 p-4 border border-border-default 
                                       dark:border-gray-700 rounded-lg hover:border-primary 
                                       transition-colors text-center"
                      >
                        <div className="text-2xl mb-2">💳</div>
                        <p className="font-medium">Credit/Debit Card</p>
                      </button>

                      <button
                        className="flex-1 p-4 border border-border-default 
                                       dark:border-gray-700 rounded-lg hover:border-primary 
                                       transition-colors text-center"
                      >
                        <div className="text-2xl mb-2">📱</div>
                        <p className="font-medium">Mobile Banking</p>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div
              className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                           dark:border-gray-700 p-6"
            >
              <h2 className="text-xl font-semibold text-text-main dark:text-gray-200 mb-6">
                Account Settings
              </h2>

              <div className="space-y-6">
                {/* Notifications */}
                <div>
                  <h3 className="font-medium text-text-main dark:text-gray-200 mb-4">
                    Notifications
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: "Order updates", defaultChecked: true },
                      { label: "Promotions & offers", defaultChecked: true },
                      { label: "Price drop alerts", defaultChecked: false },
                      { label: "New arrivals", defaultChecked: true },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <span className="text-text-secondary dark:text-gray-400">
                          {item.label}
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            defaultChecked={item.defaultChecked}
                            className="sr-only peer"
                          />
                          <div
                            className="w-11 h-6 bg-gray-200 peer-focus:outline-none 
                                       rounded-full peer dark:bg-gray-700 
                                       peer-checked:after:translate-x-full 
                                       peer-checked:after:border-white after:content-[''] 
                                       after:absolute after:top-[2px] after:left-[2px] 
                                       after:bg-white after:rounded-full after:h-5 after:w-5 
                                       after:transition-all peer-checked:bg-primary"
                          ></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Password */}
                <div>
                  <h3 className="font-medium text-text-main dark:text-gray-200 mb-4">
                    Change Password
                  </h3>
                  <div className="space-y-4">
                    <Input
                      label="Current Password"
                      type="password"
                      placeholder="Enter current password"
                    />
                    <Input
                      label="New Password"
                      type="password"
                      placeholder="Enter new password"
                    />
                    <Input
                      label="Confirm New Password"
                      type="password"
                      placeholder="Confirm new password"
                    />
                    <Button>Update Password</Button>
                  </div>
                </div>

                {/* Account Actions */}
                <div>
                  <h3 className="font-medium text-text-main dark:text-gray-200 mb-4">
                    Account Actions
                  </h3>
                  <div className="space-y-3">
                    <button
                      className="w-full text-left p-4 border border-border-default 
                                     dark:border-gray-700 rounded-lg hover:bg-red-50 
                                     dark:hover:bg-red-900/20 text-red-600"
                    >
                      Deactivate Account
                    </button>
                    <button
                      className="w-full text-left p-4 border border-border-default 
                                     dark:border-gray-700 rounded-lg hover:bg-red-50 
                                     dark:hover:bg-red-900/20 text-red-600"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
