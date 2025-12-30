import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Users,
  Package,
  Activity,
} from "lucide-react";
import { shopsAPI, ordersAPI } from "../../api";
import Button from "../../components/forms/Button";

const ShopOwnerDashboard = () => {
  const [shop, setShop] = useState(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    pendingOrders: 0,
    todayRevenue: 0,
    customerCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    fetchShopData();
  }, []);

  const fetchShopData = async () => {
    try {
      setLoading(true);

      // Fetch shop info
      const shopRes = await shopsAPI.getMyShop();
      if (shopRes.success) {
        setShop(shopRes.data);

        // Fetch shop orders
        const ordersRes = await ordersAPI.getShopOrders({ limit: 100 });
        const orders = ordersRes.data || [];

        // Calculate stats
        const today = new Date().toDateString();
        const todayOrders = orders.filter(
          (order) => new Date(order.created_at).toDateString() === today
        );

        const uniqueCustomers = [
          ...new Set(orders.map((order) => order.user_id)),
        ];

        setStats({
          totalOrders: orders.length,
          totalRevenue: orders.reduce(
            (sum, order) => sum + (order.total_amount || 0),
            0
          ),
          totalProducts: shopRes.data.product_count || 0,
          pendingOrders: orders.filter((order) => order.status === "pending")
            .length,
          todayRevenue: todayOrders.reduce(
            (sum, order) => sum + (order.total_amount || 0),
            0
          ),
          customerCount: uniqueCustomers.length,
        });

        // Get recent orders
        setRecentOrders(orders.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching shop data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: "Total Revenue",
      value: `ETB ${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-green-500",
      change: "+12%",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: "bg-blue-500",
      change: "+8%",
    },
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      color: "bg-purple-500",
      change: "+5%",
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders,
      icon: Activity,
      color: "bg-yellow-500",
      change: "-2%",
    },
    {
      title: "Today's Revenue",
      value: `ETB ${stats.todayRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: "bg-teal-500",
      change: "+15%",
    },
    {
      title: "Customers",
      value: stats.customerCount,
      icon: Users,
      color: "bg-pink-500",
      change: "+10%",
    },
  ];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-ET");
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-main dark:text-gray-200">
              Shop Dashboard
            </h1>
            <p className="text-text-secondary dark:text-gray-400 mt-2">
              {shop?.shop_name || "Your Shop"} • {shop?.area_name || ""}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => (window.location.href = "/shop-owner/inventory")}
              variant="secondary"
            >
              Manage Inventory
            </Button>
            <Button
              onClick={() => (window.location.href = "/coming-soon")}
            >
              View Orders
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                       dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span
                  className={`text-sm font-medium ${stat.change.startsWith("+")
                    ? "text-green-600"
                    : "text-red-600"
                    }`}
                >
                  {stat.change}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-text-main dark:text-gray-200 mb-2">
                {stat.value}
              </h3>
              <p className="text-text-secondary dark:text-gray-400">
                {stat.title}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div
          className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                       dark:border-gray-700"
        >
          <div className="p-6 border-b border-border-default dark:border-gray-700">
            <h2 className="text-xl font-semibold text-text-main dark:text-gray-200">
              Recent Orders
            </h2>
          </div>

          <div className="divide-y divide-border-default dark:divide-gray-700">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-text-main dark:text-gray-200">
                        Order #{order.id}
                      </h3>
                      <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
                        {formatDate(order.created_at)} •{" "}
                        {order.items?.length || 0} items
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="font-medium text-price">
                        ETB {order.total_amount?.toLocaleString() || order.total?.toLocaleString()}
                      </p>
                      <div className="flex gap-1">
                        <span className={`px-2 py-0.5 text-[10px] rounded-full uppercase font-bold
                          ${order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {order.payment_status || 'Unpaid'}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] rounded-full capitalize font-bold
                                       ${order.status === "delivered"
                              ? "bg-green-100 text-green-800"
                              : order.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center">
                <p className="text-text-secondary dark:text-gray-400">
                  No orders yet
                </p>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-border-default dark:border-gray-700">
            <button
              onClick={() => (window.location.href = "/coming-soon")}
              className="text-primary hover:text-primary-hover font-medium"
            >
              View All Orders →
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          {/* Shop Status */}
          <div
            className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                         dark:border-gray-700 p-6"
          >
            <h2 className="text-xl font-semibold text-text-main dark:text-gray-200 mb-6">
              Shop Status
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary dark:text-gray-400">
                  Shop Name
                </span>
                <span className="font-medium">{shop?.shop_name}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-text-secondary dark:text-gray-400">
                  Location
                </span>
                <span className="font-medium">{shop?.area_name}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-text-secondary dark:text-gray-400">
                  Status
                </span>
                <span
                  className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 
                             dark:text-green-400 rounded-full text-sm"
                >
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-text-secondary dark:text-gray-400">
                  Rating
                </span>
                <span className="font-medium">4.8 ★</span>
              </div>
            </div>

            <button
              onClick={() => (window.location.href = "/coming-soon")}
              className="w-full mt-6 py-3 border border-primary text-primary 
                       hover:bg-primary/10 rounded-lg font-medium"
            >
              Shop Settings
            </button>
          </div>

          {/* Quick Links */}
          <div
            className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                         dark:border-gray-700 p-6"
          >
            <h2 className="text-xl font-semibold text-text-main dark:text-gray-200 mb-6">
              Quick Actions
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => (window.location.href = "/shop-owner/inventory")}
                className="p-4 border border-border-default dark:border-gray-700 
                         rounded-lg hover:border-primary hover:bg-primary/5 
                         transition-colors text-center"
              >
                <Package className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="font-medium text-sm">Manage Inventory</p>
              </button>

              <button
                onClick={() => (window.location.href = "/coming-soon")}
                className="p-4 border border-border-default dark:border-gray-700 
                         rounded-lg hover:border-primary hover:bg-primary/5 
                         transition-colors text-center"
              >
                <ShoppingBag className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="font-medium text-sm">Process Orders</p>
              </button>

              <button
                onClick={() => (window.location.href = "/coming-soon")}
                className="p-4 border border-border-default dark:border-gray-700 
                         rounded-lg hover:border-primary hover:bg-primary/5 
                         transition-colors text-center"
              >
                <Activity className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="font-medium text-sm">View Analytics</p>
              </button>

              <button
                onClick={() => (window.location.href = "/coming-soon")}
                className="p-4 border border-border-default dark:border-gray-700 
                         rounded-lg hover:border-primary hover:bg-primary/5 
                         transition-colors text-center"
              >
                <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="font-medium text-sm">Handle Returns</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopOwnerDashboard;
