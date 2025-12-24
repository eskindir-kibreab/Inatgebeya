import React, { useState, useEffect } from "react";
import {
  Users,
  ShoppingBag,
  Package,
  TrendingUp,
  DollarSign,
  Activity,
} from "lucide-react";
import { ordersAPI } from "../../api/orders.api";
import { shopsAPI } from "../../api/shops.api";
import { usersAPI } from "../../api/users.api";
import { productsAPI } from "../../api/products.api";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalShops: 0,
    revenue: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch stats
      const [usersRes, ordersRes, productsRes, shopsRes] = await Promise.all([
        usersAPI.getAllUsers({ limit: 1 }),
        ordersAPI.getAll({ limit: 1 }),
        productsAPI.getAll({ limit: 1 }),
        shopsAPI.getAll({ limit: 1 }),
      ]);

      const orders = ordersRes.data || [];
      const pendingOrders = orders.filter(
        (order) => order.status === "pending"
      ).length;
      const revenue = orders.reduce(
        (sum, order) => sum + (order.total_amount || 0),
        0
      );

      setStats({
        totalUsers: usersRes.pagination?.total || 0,
        totalOrders: ordersRes.pagination?.total || 0,
        totalProducts: productsRes.pagination?.total || 0,
        totalShops: shopsRes.pagination?.total || 0,
        revenue,
        pendingOrders,
      });

      // Fetch recent orders
      const recentOrdersRes = await ordersAPI.getAll({
        limit: 5,
        sort_by: "newest",
      });
      setRecentOrders(recentOrdersRes.data || []);

      // Fetch top products
      const topProductsRes = await productsAPI.getAll({
        limit: 5,
        sort_by: "popular",
      });
      setTopProducts(topProductsRes.data || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `ETB ${amount?.toLocaleString() || "0"}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-ET");
  };

  const statsCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "bg-blue-500",
      change: "+12%",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: "bg-green-500",
      change: "+23%",
    },
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      color: "bg-purple-500",
      change: "+8%",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats.revenue),
      icon: DollarSign,
      color: "bg-yellow-500",
      change: "+18%",
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders,
      icon: Activity,
      color: "bg-red-500",
      change: "-5%",
    },
    {
      title: "Active Shops",
      value: stats.totalShops,
      icon: TrendingUp,
      color: "bg-indigo-500",
      change: "+15%",
    },
  ];

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
        <h1 className="text-3xl font-bold text-text-main dark:text-gray-200">
          Admin Dashboard
        </h1>
        <p className="text-text-secondary dark:text-gray-400 mt-2">
          Overview of your platform's performance
        </p>
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
                  className={`text-sm font-medium ${
                    stat.change.startsWith("+")
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
              recentOrders.map((order, index) => (
                <div key={index} className="p-6">
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
                    <div className="text-right">
                      <p className="font-medium text-price">
                        ETB {order.total_amount?.toLocaleString()}
                      </p>
                      <span
                        className={`inline-block mt-1 px-2 py-1 text-xs rounded-full capitalize
                                     ${
                                       order.status === "delivered"
                                         ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                         : order.status === "pending"
                                         ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                                         : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                                     }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center">
                <p className="text-text-secondary dark:text-gray-400">
                  No recent orders
                </p>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-border-default dark:border-gray-700">
            <button
              onClick={() => (window.location.href = "/admin/orders")}
              className="text-primary hover:text-primary-hover font-medium"
            >
              View All Orders →
            </button>
          </div>
        </div>

        {/* Top Products */}
        <div
          className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                       dark:border-gray-700"
        >
          <div className="p-6 border-b border-border-default dark:border-gray-700">
            <h2 className="text-xl font-semibold text-text-main dark:text-gray-200">
              Top Selling Products
            </h2>
          </div>

          <div className="divide-y divide-border-default dark:divide-gray-700">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div key={index} className="p-6">
                  <div className="flex items-center gap-4">
                    <img
                      src={product.main_image || "/placeholder.jpg"}
                      alt={product.product_name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-text-main dark:text-gray-200 line-clamp-1">
                        {product.product_name}
                      </h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-price font-medium">
                          ETB {product.price}
                        </span>
                        <span className="text-sm text-text-secondary dark:text-gray-400">
                          🧾 {product.sold_count || 0} sold
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-1 text-xs rounded-full
                                     ${
                                       product.is_active
                                         ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                         : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                                     }`}
                      >
                        {product.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center">
                <p className="text-text-secondary dark:text-gray-400">
                  No products found
                </p>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-border-default dark:border-gray-700">
            <button
              onClick={() => (window.location.href = "/admin/products")}
              className="text-primary hover:text-primary-hover font-medium"
            >
              View All Products →
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
    </div>
  );
};

export default AdminDashboard;
