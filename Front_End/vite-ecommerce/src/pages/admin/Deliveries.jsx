// deliveries.jsx - Updated version (removing Actions dropdown)
import React, { useState, useEffect } from "react";
import {
  Truck,
  Package,
  User,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
} from "lucide-react";
import { deliveryAPI } from "../../api/delivery.api";
import Button from "../../components/forms/Button";
import Select from "../../components/forms/Select";

const Deliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    fetchDeliveries();
  }, [filters]);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const response = await deliveryAPI.getPending(filters);
      if (response.success) {
        setDeliveries(response.data);
      }
    } catch (error) {
      console.error("Error fetching deliveries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDelivery = async (deliveryId, deliveryPersonId) => {
    try {
      const response = await deliveryAPI.assign({
        order_id: deliveryId,
        delivery_person_id: deliveryPersonId,
      });
      if (response.success) {
        alert("Delivery assigned successfully");
        fetchDeliveries();
      }
    } catch (error) {
      alert("Failed to assign delivery");
    }
  };

  const handleUpdateStatus = async (deliveryId, status) => {
    try {
      const response = await deliveryAPI.updateStatus(deliveryId, { status });
      if (response.success) {
        alert("Delivery status updated");
        fetchDeliveries();
      }
    } catch (error) {
      alert("Failed to update delivery status");
    }
  };

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "assigned", label: "Assigned" },
    { value: "picked", label: "Picked" },
    { value: "delivered", label: "Delivered" },
    { value: "returned", label: "Returned" },
  ];

  const deliveryPersons = [
    { id: 1, name: "Abebe Kebede", area: "Bole" },
    { id: 2, name: "Mekdes Alemu", area: "Megenagna" },
    { id: 3, name: "Yohannes Tesfaye", area: "Piassa" },
  ];

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-ET");
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header - WITHOUT Actions dropdown */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Truck className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-text-main dark:text-gray-200">
              Delivery Management
            </h1>
          </div>
        </div>
        <p className="text-text-secondary dark:text-gray-400">
          Manage and track all deliveries
        </p>
      </div>

      {/* Rest of the component remains the same */}
      {/* Filters */}
      <div
        className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                     dark:border-gray-700 p-6 mb-6"
      >
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Select
              label="Filter by Status"
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              options={statusOptions}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={fetchDeliveries}>Apply Filters</Button>
          </div>
        </div>
      </div>

      {/* Deliveries Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deliveries.length > 0 ? (
            deliveries.map((delivery, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                         dark:border-gray-700 p-6"
              >
                {/* Delivery Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-main dark:text-gray-200">
                        Delivery #{delivery.id}
                      </h3>
                      <p className="text-sm text-text-secondary dark:text-gray-400">
                        Order #{delivery.order_id}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium capitalize
                                 ${getStatusColor(delivery.status)}`}
                  >
                    {delivery.status}
                  </span>
                </div>

                {/* Delivery Info */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-text-secondary" />
                    <div>
                      <p className="text-sm text-text-secondary dark:text-gray-400">
                        Customer
                      </p>
                      <p className="font-medium text-text-main dark:text-gray-200">
                        {delivery.customer_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Truck className="w-4 h-4 text-text-secondary" />
                    <div>
                      <p className="text-sm text-text-secondary dark:text-gray-400">
                        Delivery Address
                      </p>
                      <p className="font-medium text-text-main dark:text-gray-200">
                        {delivery.delivery_address}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-text-secondary" />
                    <div>
                      <p className="text-sm text-text-secondary dark:text-gray-400">
                        Created
                      </p>
                      <p className="font-medium text-text-main dark:text-gray-200">
                        {formatDate(delivery.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-xs text-text-secondary dark:text-gray-400 uppercase tracking-wider font-bold">
                        Payment
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-medium dark:text-gray-200">
                          {delivery.payment_method?.replace(/_/g, " ").toUpperCase() || "COD"}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold
                          ${delivery.payment_status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'}`}>
                          {delivery.payment_status || 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  {delivery.status === "pending" && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-text-main dark:text-gray-200 mb-2">
                        Assign Delivery Person
                      </label>
                      <select
                        className="w-full px-4 py-2 border border-border-default 
                                 dark:border-gray-700 rounded-lg"
                        onChange={(e) =>
                          handleAssignDelivery(delivery.id, e.target.value)
                        }
                      >
                        <option value="">Select delivery person</option>
                        {deliveryPersons.map((person) => (
                          <option key={person.id} value={person.id}>
                            {person.name} ({person.area})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {delivery.status === "assigned" && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          handleUpdateStatus(delivery.id, "picked")
                        }
                        variant="secondary"
                        className="flex-1"
                      >
                        Mark as Picked
                      </Button>
                    </div>
                  )}

                  {delivery.status === "picked" && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          handleUpdateStatus(delivery.id, "delivered")
                        }
                        className="flex-1"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Delivered
                      </Button>
                      <Button
                        onClick={() =>
                          handleUpdateStatus(delivery.id, "returned")
                        }
                        variant="danger"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  <button
                    onClick={() =>
                      (window.location.href = `/orders/${delivery.order_id}`)
                    }
                    className="w-full py-2 border border-border-default 
                             dark:border-gray-700 rounded-lg hover:bg-gray-50 
                             dark:hover:bg-gray-700 text-sm font-medium"
                  >
                    View Order Details
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-12">
              <div className="text-4xl mb-4">🚚</div>
              <h3 className="text-lg font-semibold text-text-main dark:text-gray-200 mb-2">
                No deliveries found
              </h3>
              <p className="text-text-secondary dark:text-gray-400">
                All deliveries are up to date
              </p>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div
          className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                       dark:border-gray-700 p-6"
        >
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {deliveries.filter((d) => d.status === "pending").length}
          </div>
          <p className="text-text-secondary dark:text-gray-400">Pending</p>
        </div>

        <div
          className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                       dark:border-gray-700 p-6"
        >
          <div className="text-3xl font-bold text-yellow-600 mb-2">
            {deliveries.filter((d) => d.status === "assigned").length}
          </div>
          <p className="text-text-secondary dark:text-gray-400">Assigned</p>
        </div>

        <div
          className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                       dark:border-gray-700 p-6"
        >
          <div className="text-3xl font-bold text-green-600 mb-2">
            {deliveries.filter((d) => d.status === "delivered").length}
          </div>
          <p className="text-text-secondary dark:text-gray-400">Delivered</p>
        </div>

        <div
          className="bg-white dark:bg-gray-800 rounded-xl border border-borderdefault 
                       dark:border-gray-700 p-6"
        >
          <div className="text-3xl font-bold text-red-600 mb-2">
            {deliveries.filter((d) => d.status === "returned").length}
          </div>
          <p className="text-text-secondary dark:text-gray-400">Returned</p>
        </div>
      </div>
    </div>
  );
};

export default Deliveries;