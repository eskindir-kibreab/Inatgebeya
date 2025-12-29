import React, { useState, useEffect } from "react";
import {
  Users,
  MapPin,
  Phone,
  Mail,
  Edit,
  Trash2,
  UserPlus,
} from "lucide-react";
import { deliveryAPI } from "../../api/delivery.api";
import { areasAPI } from "../../api/areas.api";
import { shopsAPI } from "../../api/shops.api";
import Input from "../../components/forms/Input";
import Button from "../../components/forms/Button";
import Select from "../../components/forms/Select";
import toast from "react-hot-toast";

const AdminTeam = () => {
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    area_id: "",
    shop_id: "", // Added shop_id
    password: "",
  });
  const [areas, setAreas] = useState([]);
  const [shops, setShops] = useState([]); // Added shops state

  useEffect(() => {
    fetchDeliveryPersons();
    fetchAreas();
    fetchShops();
  }, []);

  const fetchDeliveryPersons = async () => {
    try {
      setLoading(true);
      const response = await deliveryAPI.getDeliveryPersons();
      if (response.success) {
        setDeliveryPersons(response.data);
      }
    } catch (error) {
      toast.error("Failed to load delivery persons");
    } finally {
      setLoading(false);
    }
  };

  const fetchAreas = async () => {
    try {
      const response = await areasAPI.getAll();
      if (response.success) {
        setAreas(response.data);
      }
    } catch (error) {
      console.error("Error fetching areas:", error);
    }
  };

  const fetchShops = async () => {
    try {
      const response = await shopsAPI.getAll({ limit: 100 });
      if (response.success) {
        setShops(response.data);
      }
    } catch (error) {
      console.error("Error fetching shops:", error);
    }
  };

  const handleAddPerson = async (e) => {
    e.preventDefault();

    try {
      const response = await deliveryAPI.createDeliveryPerson(formData);
      if (response.success) {
        toast.success("Delivery person added successfully");
        setShowAddModal(false);
        fetchDeliveryPersons();
        resetForm();
      }
    } catch (error) {
      toast.error("Failed to add delivery person");
    }
  };

  const handleUpdatePerson = async (e) => {
    e.preventDefault();
    if (!selectedPerson) return;

    try {
      const response = await deliveryAPI.updateDeliveryPerson(
        selectedPerson.id,
        formData
      );
      if (response.success) {
        toast.success("Delivery person updated successfully");
        setShowEditModal(false);
        fetchDeliveryPersons();
        resetForm();
      }
    } catch (error) {
      toast.error("Failed to update delivery person");
    }
  };

  const handleDeletePerson = async (personId) => {
    if (
      !window.confirm("Are you sure you want to delete this delivery person and their user account from the database?")
    )
      return;

    try {
      const response = await deliveryAPI.deleteDeliveryPerson(personId);
      if (response.success) {
        toast.success("Delivery person and user deleted successfully");
        fetchDeliveryPersons();
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.response?.data?.message || "Failed to delete delivery person");
    }
  };

  const handleToggleStatus = async (personId, currentStatus) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      const response = await deliveryAPI.updateDeliveryPersonStatus(personId, {
        status: newStatus,
      });
      if (response.success) {
        toast.success(
          `Delivery person ${newStatus === "active" ? "activated" : "deactivated"
          }`
        );
        fetchDeliveryPersons();
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      area_id: "",
      shop_id: "",
      password: "",
    });
    setSelectedPerson(null);
  };

  const areaOptions = [
    { value: "", label: "Select Area" },
    ...areas.map((area) => ({
      value: area.area_id || area.id,
      label: area.area_name,
    })),
  ];

  const shopOptions = [
    { value: "", label: "Select Shop (Optional)" },
    ...shops.map((shop) => ({
      value: shop.shop_id || shop.id,
      label: shop.shop_name,
      area_id: shop.area_id,
    })),
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-main dark:text-gray-200">
              Delivery Team
            </h1>
            <p className="text-text-secondary dark:text-gray-400 mt-2">
              Manage your delivery team members
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)} icon={UserPlus}>
            Add Delivery Person
          </Button>
        </div>
      </div>

      {/* Delivery Team Table */}
      <div
        className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                     dark:border-gray-700 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default dark:border-gray-700">
                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200">
                  ID
                </th>
                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200">
                  Delivery Person
                </th>
                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200">
                  Contact
                </th>
                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200">
                  Area
                </th>
                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200">
                  Status
                </th>
                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200 text-center">
                  Stats
                </th>
                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-6 text-center">
                    <div className="animate-pulse space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="h-12 bg-gray-200 dark:bg-gray-700 rounded"
                        ></div>
                      ))}
                    </div>
                  </td>
                </tr>
              ) : deliveryPersons.length > 0 ? (
                deliveryPersons.map((person) => (
                  <tr
                    key={person.delivery_person_id}
                    className="border-b border-border-default 
                                             dark:border-gray-700 hover:bg-bg-light 
                                             dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="p-6 font-mono text-xs text-text-secondary">
                      #{person.delivery_person_id}
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 bg-primary/10 rounded-full 
                                       flex items-center justify-center"
                        >
                          <span className="font-medium text-primary">
                            {person.full_name?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-text-main dark:text-gray-200">
                            {person.full_name}
                          </p>
                          <p className="text-xs text-text-secondary dark:text-gray-400">
                            User ID: #{person.user_id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-gray-400">
                          <Phone className="w-3.5 h-3.5" />
                          {person.phone}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-gray-400">
                          <Mail className="w-3.5 h-3.5" />
                          {person.email}
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <select
                        value={person.area_id}
                        onChange={async (e) => {
                          const newAreaId = e.target.value;
                          try {
                            const response = await deliveryAPI.updateDeliveryPerson(
                              person.delivery_person_id,
                              { area_id: newAreaId }
                            );
                            if (response.success) {
                              toast.success("Area updated");
                              fetchDeliveryPersons();
                            }
                          } catch (error) {
                            toast.error("Failed to update area");
                          }
                        }}
                        className="px-3 py-1 border border-border-default dark:border-gray-700 
                                 rounded-lg bg-transparent text-sm cursor-pointer hover:border-primary transition-colors"
                      >
                        {areaOptions.slice(1).map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                            className="dark:bg-gray-800"
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-6">
                      <button
                        onClick={() =>
                          handleToggleStatus(
                            person.delivery_person_id,
                            person.status
                          )
                        }
                        className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider
                                     ${person.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                          }`}
                      >
                        {person.status}
                      </button>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center justify-center gap-6">
                        <div className="text-center">
                          <p className="text-sm font-bold text-primary">
                            {person.total_deliveries || 0}
                          </p>
                          <p className="text-[10px] uppercase text-text-secondary">
                            Total
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-accent">
                            {person.completed_deliveries || 0}
                          </p>
                          <p className="text-[10px] uppercase text-text-secondary">
                            Done
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedPerson(person);
                            setFormData({
                              name: person.full_name,
                              email: person.email,
                              phone: person.phone,
                              area_id: person.area_id,
                              password: "",
                            });
                            setShowEditModal(true);
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-text-secondary" />
                        </button>
                        <button
                          onClick={() =>
                            handleDeletePerson(person.delivery_person_id)
                          }
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-text-secondary">
                    No delivery persons found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Person Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-text-main dark:text-gray-200 mb-6">
              Add Delivery Person
            </h2>
            <form onSubmit={handleAddPerson}>
              <Input
                label="Full Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                required
              />
              <Input
                label="Phone Number"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                required
              />
              <Select
                label="Assign to Shop (Optional - Auto-fills Area)"
                value={formData.shop_id}
                onChange={(e) => {
                  const shopId = e.target.value;
                  const shop = shops.find((s) => (s.shop_id || s.id) == shopId);
                  setFormData((prev) => ({
                    ...prev,
                    shop_id: shopId,
                    area_id: shop ? shop.area_id : prev.area_id,
                  }));
                }}
                options={shopOptions}
              />
              <Select
                label="Area"
                value={formData.area_id}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, area_id: e.target.value }))
                }
                options={areaOptions}
                required
              />
              <Input
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                required
              />
              <div className="flex gap-3 mt-6">
                <Button type="submit" className="flex-1">
                  Add Person
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Person Modal */}
      {showEditModal && selectedPerson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-text-main dark:text-gray-200 mb-6">
              Edit Delivery Person
            </h2>
            <form onSubmit={handleUpdatePerson}>
              <Input
                label="Full Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                required
              />
              <Input
                label="Phone Number"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                required
              />
              <Select
                label="Area"
                value={formData.area_id}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, area_id: e.target.value }))
                }
                options={areaOptions}
                required
              />
              <Input
                label="New Password (leave blank to keep current)"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
              />
              <div className="flex gap-3 mt-6">
                <Button type="submit" className="flex-1">
                  Update Person
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTeam;
