import React, { useState, useEffect } from "react";
import {
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  User,
} from "lucide-react";
import { deliveryAPI } from "../../api/delivery.api";
import Button from "../../components/forms/Button";
import toast from "react-hot-toast";

const DeliveryPersonDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [assignedDeliveries, setAssignedDeliveries] = useState([]);
  const [availableDeliveries, setAvailableDeliveries] = useState([]);
  const [completedDeliveries, setCompletedDeliveries] = useState([]);
  const [stats, setStats] = useState({
    totalToday: 0,
    completedToday: 0,
    pendingToday: 0,
    totalEarnings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState({});

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);

      // Fetch profile
      const profileRes = await deliveryAPI.getProfile();
      if (profileRes.success) {
        setProfile(profileRes.data);
      }

      // Fetch available deliveries (pending in area)
      const pendingRes = await deliveryAPI.getPending();
      if (pendingRes.success) {
        setAvailableDeliveries(pendingRes.data);
      }

      // Fetch assigned deliveries
      const assignedRes = await deliveryAPI.getAssigned();
      if (assignedRes.success) {
        setAssignedDeliveries(assignedRes.data);

        // Calculate today's stats from assigned deliveries
        const today = new Date().toDateString();
        const todayDeliveries = assignedRes.data.filter(
          (d) => new Date(d.created_at).toDateString() === today
        );

        setStats({
          totalToday: todayDeliveries.length,
          completedToday: todayDeliveries.filter(
            (d) => d.status === "delivered"
          ).length,
          pendingToday: todayDeliveries.filter((d) => d.status !== "delivered")
            .length,
          totalEarnings: todayDeliveries.reduce(
            (sum, d) => sum + (d.delivery_fee || 50),
            0
          ),
        });
      }

      // Fetch recent completed deliveries
      const completedRes = await deliveryAPI.getHistory({ limit: 5 });
      if (completedRes.success) {
        setCompletedDeliveries(completedRes.data);
      }
    } catch (error) {
      toast.error("Failed to load deliveries");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (deliveryId, newStatus) => {
    setUpdatingStatus((prev) => ({ ...prev, [deliveryId]: true }));

    try {
      const response = await deliveryAPI.updateStatus(deliveryId, {
        status: newStatus,
      });
      if (response.success) {
        toast.success(`Delivery marked as ${newStatus}`);
        fetchDeliveries();
      }
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [deliveryId]: false }));
    }
  };

  const handleAcceptDelivery = async (orderId) => {
    setUpdatingStatus((prev) => ({ ...prev, [orderId]: true }));

    try {
      if (!profile?.delivery_person_id) {
        toast.error("Profile not loaded");
        return;
      }

      const response = await deliveryAPI.acceptDelivery({
        order_id: orderId,
        delivery_person_id: profile.delivery_person_id
      });

      if (response.success) {
        toast.success("Delivery accepted successfully");
        fetchDeliveries();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to accept delivery");
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900/20";
      case "picked":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20";
      case "assigned":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20";
      case "returned":
        return "bg-red-100 text-red-800 dark:bg-red-900/20";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20";
    }
  };

  const getNextAction = (status) => {
    switch (status) {
      case "assigned":
        return { label: "Mark as Picked", action: "picked" };
      case "picked":
        return { label: "Mark as Delivered", action: "delivered" };
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-ET", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statsCards = [
    {
      title: "Today's Deliveries",
      value: stats.totalToday,
      icon: Truck,
      color: "bg-blue-500",
    },
    {
      title: "Completed Today",
      value: stats.completedToday,
      icon: CheckCircle,
      color: "bg-green-500",
    },
    {
      title: "Pending Today",
      value: stats.pendingToday,
      icon: Clock,
      color: "bg-yellow-500",
    },
    {
      title: "Today's Earnings",
      value: `ETB ${stats.totalEarnings}`,
      icon: Package,
      color: "bg-purple-500",
    },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
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
        <div className="flex items-center gap-3 mb-4">
          <Truck className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-text-main dark:text-gray-200">
            Delivery Dashboard
          </h1>
        </div>
        <p className="text-text-secondary dark:text-gray-400">
          Manage your deliveries and track your progress • Assigned to: <span className="font-semibold text-primary">{profile?.area_name || "Loading..."}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

        {/* Available for Pickup */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-border-default dark:border-gray-700 lg:col-span-2">
          <div className="p-6 border-b border-border-default dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-text-main dark:text-gray-200">
                Available in Your Area
              </h2>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 rounded-full text-xs font-medium">
                  {availableDeliveries.length} available
                </span>
                <Truck className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>

          <div className="divide-y divide-border-default dark:divide-gray-700 max-h-[400px] overflow-y-auto">
            {availableDeliveries.length > 0 ? (
              availableDeliveries.map((delivery) => (
                <div key={delivery.order_id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-text-main dark:text-gray-200">Order #{delivery.order_id}</span>
                        <span className="text-sm text-text-secondary dark:text-gray-400">{formatDate(delivery.created_at)}</span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 text-sm">
                        <div className="flex items-center gap-2 text-text-secondary dark:text-gray-400">
                          <User className="w-4 h-4" />
                          {delivery.customer_name}
                        </div>
                        <div className="flex items-center gap-2 text-text-secondary dark:text-gray-400">
                          <MapPin className="w-4 h-4" />
                          {delivery.delivery_address}
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleAcceptDelivery(delivery.order_id)}
                      loading={updatingStatus[delivery.order_id]}
                      size="sm"
                    >
                      Accept Delivery
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-text-secondary dark:text-gray-400">
                No new deliveries available in your area right now.
              </div>
            )}
          </div>
        </div>

        {/* Assigned Deliveries */}
        <div
          className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                       dark:border-gray-700"
        >
          <div className="p-6 border-b border-border-default dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-text-main dark:text-gray-200">
                Assigned Deliveries
              </h2>
              <Package className="w-5 h-5 text-primary" />
            </div>
          </div>

          <div className="divide-y divide-border-default dark:divide-gray-700">
            {assignedDeliveries.length > 0 ? (
              assignedDeliveries.map((delivery) => {
                const nextAction = getNextAction(delivery.status);

                return (
                  <div key={delivery.delivery_id} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium text-text-main dark:text-gray-200">
                          Order #{delivery.order_id}
                        </h3>
                        <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
                          {formatDate(delivery.created_at)}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium capitalize
                                     ${getStatusColor(delivery.status)}`}
                      >
                        {delivery.status}
                      </span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-text-secondary" />
                        <span className="text-text-secondary dark:text-gray-400">
                          {delivery.customer_name}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-text-secondary" />
                        <span className="text-text-secondary dark:text-gray-400">
                          {delivery.delivery_address}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {nextAction && (
                        <Button
                          onClick={() =>
                            handleUpdateStatus(delivery.delivery_id, nextAction.action)
                          }
                          loading={updatingStatus[delivery.delivery_id]}
                          className="flex-1"
                        >
                          {nextAction.label}
                        </Button>
                      )}

                      {delivery.status === "picked" && (
                        <Button
                          onClick={() =>
                            handleUpdateStatus(delivery.delivery_id, "returned")
                          }
                          variant="danger"
                          loading={updatingStatus[delivery.delivery_id]}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center">
                <div className="text-4xl mb-4">🚚</div>
                <h3 className="text-lg font-semibold text-text-main dark:text-gray-200 mb-2">
                  No assigned deliveries
                </h3>
                <p className="text-text-secondary dark:text-gray-400">
                  Check back later for new delivery assignments
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Completed Deliveries */}
        <div
          className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                       dark:border-gray-700"
        >
          <div className="p-6 border-b border-border-default dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-text-main dark:text-gray-200">
                Recent Completed
              </h2>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          </div>

          <div className="divide-y divide-border-default dark:divide-gray-700">
            {completedDeliveries.length > 0 ? (
              completedDeliveries.map((delivery) => (
                <div key={delivery.delivery_id} className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-text-main dark:text-gray-200">
                        Order #{delivery.order_id}
                      </h3>
                      <p className="text-sm text-text-secondary dark:text-gray-400">
                        {formatDate(delivery.updated_at)}
                      </p>
                    </div>
                    <span
                      className="px-3 py-1 bg-green-100 text-green-800 
                                   dark:bg-green-900/20 dark:text-green-400 
                                   rounded-full text-sm"
                    >
                      Delivered
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary dark:text-gray-400">
                        Address
                      </span>
                      <span className="font-medium">
                        {delivery.delivery_address}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary dark:text-gray-400">
                        Fee
                      </span>
                      <span className="font-medium text-price">
                        ETB {delivery.delivery_fee || 50}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center">
                <p className="text-text-secondary dark:text-gray-400">
                  No completed deliveries yet
                </p>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-border-default dark:border-gray-700">
            <button
              onClick={() =>
                (window.location.href = "/coming-soon")
              }
              className="text-primary hover:text-primary-hover font-medium"
            >
              View Full History →
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div
        className="mt-8 bg-white dark:bg-gray-800 rounded-xl border border-borderdefault 
                     dark:border-gray-700 p-6"
      >
        <h2 className="text-xl font-semibold text-text-main dark:text-gray-200 mb-6">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={fetchDeliveries}
            className="p-4 border border-border-default dark:border-gray-700 
                     rounded-lg hover:border-primary hover:bg-primary/5 
                     transition-colors text-left flex items-center gap-3"
          >
            <Package className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium text-text-main dark:text-gray-200">
                Refresh Deliveries
              </p>
              <p className="text-sm text-text-secondary dark:text-gray-400">
                Check for new assignments
              </p>
            </div>
          </button>

          <button
            onClick={() => (window.location.href = "/coming-soon")}
            className="p-4 border border-border-default dark:border-gray-700 
                     rounded-lg hover:border-primary hover:bg-primary/5 
                     transition-colors text-left flex items-center gap-3"
          >
            <MapPin className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium text-text-main dark:text-gray-200">
                View Delivery Map
              </p>
              <p className="text-sm text-text-secondary dark:text-gray-400">
                See all delivery locations
              </p>
            </div>
          </button>

          <button
            onClick={() => (window.location.href = "/coming-soon")}
            className="p-4 border border-border-default dark:border-gray-700 
                     rounded-lg hover:border-primary hover:bg-primary/5 
                     transition-colors text-left flex items-center gap-3"
          >
            <Truck className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium text-text-main dark:text-gray-200">
                View Earnings
              </p>
              <p className="text-sm text-text-secondary dark:text-gray-400">
                Track your delivery earnings
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryPersonDashboard;
