import React, { useState, useEffect } from "react";
import { Truck, Package, User, MapPin, Clock, CheckCircle } from "lucide-react";
import * as deliveryAPI from "../../api/delivery.api.js";
import Select from "../../components/forms/Select";
import Button from "../../components/forms/Button";
import toast from "react-hot-toast";

const AdminAssign = () => {
  const [pendingDeliveries, setPendingDeliveries] = useState([]);
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState({});
  const [selectedFilters, setSelectedFilters] = useState({
    area_id: "",
    delivery_person_id: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch pending deliveries - CORRECT: Using getPending
      const deliveriesRes = await deliveryAPI.getPending();
      console.log("pending deliveriesres"+deliveriesRes);

      if (deliveriesRes && deliveriesRes.success) {
        setPendingDeliveries(deliveriesRes.data || []);
      } else {
        console.error(
          "Failed to fetch pending deliveries:",
          deliveriesRes?.message || "Unknown error"
        );
        toast.error(
          `Failed to load deliveries: ${
            deliveriesRes?.message || "Unknown error"
          }`
        );
      }

      // Fetch delivery persons
      const personsRes = await deliveryAPI.getDeliveryPersons();

      if (personsRes && personsRes.success) {
        setDeliveryPersons(personsRes.data || []);
      } else {
        console.error(
          "Failed to fetch delivery persons:",
          personsRes?.message || "Unknown error"
        );
        toast.error(
          `Failed to load delivery persons: ${
            personsRes?.message || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("Error in fetchData:", error);
      toast.error(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDelivery = async (orderId, deliveryPersonId) => {
    if (!deliveryPersonId) {
      toast.error("Please select a delivery person");
      return;
    }

    setAssigning((prev) => ({ ...prev, [orderId]: true }));

    try {
      const response = await deliveryAPI.assign({
        order_id: orderId,
        delivery_person_id: deliveryPersonId,
      });

      if (response.success) {
        toast.success("Delivery assigned successfully");
        // Remove the assigned delivery from the list
        setPendingDeliveries((prev) =>
          prev.filter((delivery) => delivery.order_id !== orderId)
        );
      }
    } catch (error) {
      toast.error("Failed to assign delivery");
    } finally {
      setAssigning((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleFilterChange = (name, value) => {
    setSelectedFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Filter deliveries based on selected filters
  const filteredDeliveries = pendingDeliveries.filter((delivery) => {
    if (
      selectedFilters.area_id &&
      delivery.area_id !== selectedFilters.area_id
    ) {
      return false;
    }
    return true;
  });

  // Group delivery persons by area
  const deliveryPersonsByArea = deliveryPersons.reduce((acc, person) => {
    if (!acc[person.area_id]) {
      acc[person.area_id] = [];
    }
    acc[person.area_id].push(person);
    return acc;
  }, {});

  // Get unique areas from deliveries
  const deliveryAreas = [
    ...new Set(pendingDeliveries.map((d) => d.area_id)),
  ].map((areaId) => {
    const delivery = pendingDeliveries.find((d) => d.area_id === areaId);
    return {
      id: areaId,
      name: delivery?.area_name || `Area ${areaId}`,
    };
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-ET", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const areaOptions = [
    { value: "", label: "All Areas" },
    ...deliveryAreas.map((area) => ({
      value: area.id,
      label: area.name,
    })),
  ];

  const getDeliveryPersonOptions = (areaId) => {
    const persons = areaId
      ? deliveryPersonsByArea[areaId] || []
      : deliveryPersons.filter((p) => p.status === "active");

    return [
      { value: "", label: "Select delivery person" },
      ...persons.map((person) => ({
        value: person.delivery_person_id || person.id,
        label: `${person.full_name || person.name} (${
          person.deliveries_today || 0
        } today)`,
      })),
    ];
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Truck className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-text-main dark:text-gray-200">
            Assign Deliveries
          </h1>
        </div>
        <p className="text-text-secondary dark:text-gray-400">
          Assign pending deliveries to delivery persons
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div
          className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                       dark:border-gray-700 p-6"
        >
          <div className="text-3xl font-bold text-yellow-600 mb-2">
            {pendingDeliveries.length}
          </div>
          <p className="text-text-secondary dark:text-gray-400">
            Pending Deliveries
          </p>
        </div>

        <div
          className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                       dark:border-gray-700 p-6"
        >
          <div className="text-3xl font-bold text-green-600 mb-2">
            {deliveryPersons.filter((p) => p.status === "active").length}
          </div>
          <p className="text-text-secondary dark:text-gray-400">
            Active Delivery Persons
          </p>
        </div>

        <div
          className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                       dark:border-gray-700 p-6"
        >
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {deliveryAreas.length}
          </div>
          <p className="text-text-secondary dark:text-gray-400">
            Areas with Pending Deliveries
          </p>
        </div>
      </div>

      {/* Filters */}
      <div
        className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                     dark:border-gray-700 p-6 mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Filter by Area"
            value={selectedFilters.area_id}
            onChange={(e) => handleFilterChange("area_id", e.target.value)}
            options={areaOptions}
          />

          <div className="flex items-end">
            <Button onClick={fetchData} className="w-full">
              Refresh Data
            </Button>
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
      ) : filteredDeliveries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDeliveries.map((delivery) => (
            <div
              key={delivery.delivery_id || delivery.id}
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
                      Order #{delivery.order_id}
                    </h3>
                    <p className="text-sm text-text-secondary dark:text-gray-400">
                      Delivery #{delivery.delivery_id || delivery.id}
                    </p>
                  </div>
                </div>
                <span
                  className="px-3 py-1 bg-yellow-100 text-yellow-800 
                               dark:bg-yellow-900/20 dark:text-yellow-400 
                               rounded-full text-sm font-medium"
                >
                  Pending
                </span>
              </div>

              {/* Delivery Info */}
              <div className="space-y-3 mb-6">
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
                  <MapPin className="w-4 h-4 text-text-secondary" />
                  <div>
                    <p className="text-sm text-text-secondary dark:text-gray-400">
                      Delivery Address
                    </p>
                    <p className="font-medium text-text-main dark:text-gray-200">
                      {delivery.delivery_address}
                    </p>
                    <p className="text-sm text-text-secondary dark:text-gray-400">
                      {delivery.area_name}
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
              </div>

              {/* Assignment */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-text-main dark:text-gray-200 mb-2">
                    Assign to Delivery Person
                  </label>
                  <Select
                    value={delivery.assigned_person_id || ""}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAssignDelivery(delivery.order_id, e.target.value);
                      }
                    }}
                    options={getDeliveryPersonOptions(delivery.area_id)}
                    disabled={assigning[delivery.order_id]}
                  />
                </div>

                {delivery.assigned_person_id && (
                  <div
                    className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 
                               dark:border-green-800 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm text-green-700 dark:text-green-400">
                        Assigned to {delivery.assigned_person_name}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={() =>
                    window.open(`/orders/${delivery.order_id}`, "_blank")
                  }
                  className="w-full py-2 border border-border-default 
                           dark:border-gray-700 rounded-lg hover:bg-gray-50 
                           dark:hover:bg-gray-700 text-sm font-medium"
                >
                  View Order Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🎉</div>
          <h3 className="text-lg font-semibold text-text-main dark:text-gray-200 mb-2">
            No pending deliveries
          </h3>
          <p className="text-text-secondary dark:text-gray-400">
            All deliveries are assigned or completed
          </p>
        </div>
      )}

      {/* Help Section */}
      <div
        className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl border 
                     border-blue-200 dark:border-blue-800 p-6"
      >
        <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-4">
          Assignment Guidelines
        </h3>
        <div className="text-blue-700 dark:text-blue-400 space-y-2">
          <p>• Assign deliveries to delivery persons in the same area</p>
          <p>• Consider the delivery person's current workload</p>
          <p>• Prioritize deliveries based on creation time</p>
          <p>• Ensure delivery persons have necessary contact information</p>
        </div>
      </div>
    </div>
  );
};

export default AdminAssign;
