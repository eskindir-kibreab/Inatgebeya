import React, { useState, useEffect } from "react";
import { Search, Edit, Trash2, UserPlus, Shield, MessageCircle } from "lucide-react";
import { usersAPI } from "../../api/users.api";
import Input from "../../components/forms/Input";
import Button from "../../components/forms/Button";
import Select from "../../components/forms/Select";
import AdminActiveFilters from "../../components/search/AdminActiveFilters";
import toast from "react-hot-toast";

import { useNavigate } from "react-router-dom";

const Users = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    is_active: "",
    page: 1,
    limit: 5,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0,
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    role_name: "user",
    is_active: true,
  });
  const [adminImageError, setAdminImageError] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAllUsers(filters);
      if (response.success) {
        setUsers(response.data);
        setPagination({
          ...response.pagination,
          totalPages: response.pagination.pages // Map backend 'pages' to frontend 'totalPages'
        });
      }
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: name === "page" ? value : 1,
    }));
  };

  const handleRemoveFilter = (key) => {
    setFilters((prev) => ({ ...prev, [key]: "", page: 1 }));
  };

  const filterLabels = {
    role: {
      label: "Role",
      user: "User",
      shop_owner: "Shop Owner",
      item_adder_admin: "Item Adder",
      delivery_person: "Delivery Person",
      delivery_admin: "Delivery Admin",
      admin: "Admin",
    },
    is_active: {
      label: "Status",
      true: "Active",
      false: "Inactive",
    },
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      phone: user.phone || "",
      password: "",
      role_name: user.role_name || "user",
      is_active: user.is_active,
    });
    setAdminImageError(false); // Reset on edit
    setShowEditModal(true);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await usersAPI.createUser(formData);
      if (response.success) {
        toast.success("User created successfully");
        setShowCreateModal(false);
        fetchUsers();
        resetForm();
      }
    } catch (error) {
      toast.error("Failed to create user");
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const updateData = { ...formData };
      if (!updateData.password) delete updateData.password;

      // Update basic info
      const profilePromise = usersAPI.updateUser(selectedUser.user_id, updateData);

      // Update role if changed
      const updatePromises = [profilePromise];
      if (formData.role_name !== selectedUser.role_name) {
        updatePromises.push(usersAPI.updateUserRole(selectedUser.user_id, formData.role_name));
      }

      const results = await Promise.all(updatePromises);

      if (results.every(res => res.success)) {
        toast.success("User updated successfully");
        setShowEditModal(false);
        fetchUsers();
        resetForm();
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error.response?.data?.message || "Failed to update user");
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const response = await usersAPI.updateUser(userId, { is_active: !currentStatus });
      if (response.success) {
        toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'}`);
        fetchUsers();
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to permanently delete this user and all their associated data (coins, profiles, etc.) from the database? This action cannot be undone.")) return;

    try {
      const response = await usersAPI.deleteUser(userId);
      if (response.success) {
        toast.success("User deleted successfully");
        fetchUsers();
      }
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const handleRoleChange = async (userId, roleName) => {
    try {
      const response = await usersAPI.updateUserRole(userId, roleName);
      if (response.success) {
        toast.success("User role updated");
        fetchUsers();
      }
    } catch (error) {
      toast.error("Failed to update user role");
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      password: "",
      role_name: "user",
      is_active: true,
    });
    setSelectedUser(null);
  };

  const roleOptions = [
    { value: "", label: "All Roles" },
    { value: "user", label: "User" },
    { value: "shop_owner", label: "Shop Owner" },
    { value: "item_adder_admin", label: "Item Adder" },
    { value: "delivery_person", label: "Delivery Person" },
    { value: "delivery_admin", label: "Delivery Admin" },
    { value: "admin", label: "Admin" },
  ];

  const filteredRoleOptions = roleOptions.filter(opt => opt.value !== "delivery_person");

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "true", label: "Active" },
    { value: "false", label: "Inactive" },
  ];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-ET");
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-main dark:text-gray-200">
              User Management
            </h1>
            <p className="text-text-secondary dark:text-gray-400 mt-2">
              Manage all users and their permissions
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} icon={UserPlus}>
            Add New User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div
        className="bg-white dark:bg-gray-800 rounded-xl border border-border-default 
                     dark:border-gray-700 p-6 mb-6"
      >
        <div className="mb-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search users by name or email..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                icon={Search}
              />
            </div>
          </div>
        </div>

        {/* Active Filters */}
        <AdminActiveFilters
          filters={filters}
          filterLabels={filterLabels}
          onRemoveFilter={handleRemoveFilter}
        />

        {/* Filter Options */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t 
                       border-border-default dark:border-gray-700"
        >
          <Select
            label="Role"
            name="role"
            value={filters.role}
            onChange={(e) => handleFilterChange("role", e.target.value)}
            options={roleOptions}
          />
          <Select
            label="Status"
            name="is_active"
            value={filters.is_active}
            onChange={(e) => handleFilterChange("is_active", e.target.value)}
            options={statusOptions}
          />
        </div>
      </div>

      {/* Users Table */}
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
                  User
                </th>
                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200">
                  Role
                </th>
                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200">
                  Status
                </th>
                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200">
                  Joined Date
                </th>
                <th className="text-left p-6 font-semibold text-text-main dark:text-gray-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-6">
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
              ) : users.length > 0 ? (
                users.map((user, index) => (
                  <tr
                    key={index}
                    className="border-b border-border-default 
                                            dark:border-gray-700 hover:bg-bg-light 
                                            dark:hover:bg-gray-700"
                  >
                    <td className="p-6 font-mono text-xs text-text-secondary">
                      #{user.user_id}
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 bg-primary/10 rounded-full 
                                     flex items-center justify-center"
                        >
                          <span className="font-medium text-primary">
                            {user.full_name?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-text-main dark:text-gray-200">
                            {user.full_name}
                          </p>
                          <p className="text-sm text-text-secondary dark:text-gray-400">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      {user.role_name === "delivery_person" ? (
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm font-medium">
                          Delivery Person
                        </span>
                      ) : (
                        <select
                          value={user.role_name || "user"}
                          onChange={(e) =>
                            handleRoleChange(user.user_id, e.target.value)
                          }
                          className="px-3 py-1 border border-border-default dark:border-gray-700 
                                 rounded-lg bg-transparent text-sm cursor-pointer hover:border-primary transition-colors"
                        >
                          {filteredRoleOptions.slice(1).map((option) => (
                            <option key={option.value} value={option.value} className="dark:bg-gray-800">
                              {option.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="p-6">
                      <button
                        onClick={() => handleToggleStatus(user.user_id, user.is_active)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                                     ${user.is_active
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-200"
                          }`}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="p-6 text-text-secondary dark:text-gray-400">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4 text-text-secondary" />
                        </button>
                        <button
                          onClick={() => navigate("/admin/messages", { state: { selectedUserId: user.user_id } })}
                          className="p-2 hover:bg-primary/10 rounded-lg"
                          title="Message User"
                        >
                          <MessageCircle className="w-4 h-4 text-primary" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.user_id)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-12 text-center">
                    <div className="text-4xl mb-4">👤</div>
                    <h3 className="text-lg font-semibold text-text-main dark:text-gray-200 mb-2">
                      No users found
                    </h3>
                    <p className="text-text-secondary dark:text-gray-400">
                      Try adjusting your search or filters
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-6 border-t border-border-default dark:border-gray-700">
            <div className="flex items-center justify-between">
              <p className="text-text-secondary dark:text-gray-400">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} users
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleFilterChange("page", pagination.page - 1)
                  }
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-border-default dark:border-gray-700 rounded-lg 
                           disabled:opacity-50 disabled:cursor-not-allowed
                           hover:bg-bg-light dark:hover:bg-gray-700 transition-all duration-200
                           text-sm font-medium text-text-main dark:text-gray-200"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    handleFilterChange("page", pagination.page + 1)
                  }
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 border border-border-default dark:border-gray-700 rounded-lg 
                           disabled:opacity-50 disabled:cursor-not-allowed
                           hover:bg-bg-light dark:hover:bg-gray-700 transition-all duration-200
                           text-sm font-medium text-text-main dark:text-gray-200"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-text-main dark:text-gray-200 mb-6">
              Create New User
            </h2>
            <form onSubmit={handleCreateUser}>
              <Input
                label="Full Name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    full_name: e.target.value,
                  }))
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
              <Select
                label="Role"
                value={formData.role_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    role_name: e.target.value,
                  }))
                }
                options={roleOptions.slice(1)}
              />
              <div className="flex gap-3 mt-6">
                <Button type="submit" className="flex-1">
                  Create User
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-text-main dark:text-gray-200 mb-6">
              Edit User
            </h2>
            <form onSubmit={handleUpdateUser}>
              <Input
                label="Full Name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    full_name: e.target.value,
                  }))
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
              />
              <Input
                label="New Password (leave blank to keep current)"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
              />
              <Select
                label="Role"
                value={formData.role_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    role_name: e.target.value,
                  }))
                }
                options={roleOptions.slice(1)}
              />
              {/* National ID section in Admin */}
              {selectedUser.identification && (
                <div className="mt-6 border-t border-border-default dark:border-gray-700 pt-4">
                  <h3 className="text-sm font-semibold text-text-main dark:text-gray-200 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    Identity Verification
                  </h3>
                  <div className="space-y-3">
                    <Input
                      label="Fan Number"
                      value={selectedUser.identification.fan_number}
                      disabled
                      icon={Shield}
                    />
                    {selectedUser.identification.id_image_url ? (
                      <div className="w-48 h-24 rounded-lg overflow-hidden border border-border-default dark:border-gray-700 bg-bg-light">
                        {adminImageError ? (
                          <div className="w-full h-full flex flex-col items-center justify-center text-red-500 bg-bg-light gap-1 text-center">
                            <Shield className="w-5 h-5 opacity-20" />
                            <span className="text-[10px] font-bold uppercase">Image Not Found</span>
                          </div>
                        ) : (
                          <img
                            src={`${import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, "")}${selectedUser.identification.id_image_url}`}
                            alt="National ID"
                            className="w-full h-full object-cover"
                            onError={() => setAdminImageError(true)}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="w-48 h-24 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 flex flex-col items-center justify-center text-center gap-1">
                        <Shield className="w-5 h-5 text-orange-300 opacity-50" />
                        <p className="text-[10px] text-orange-700 dark:text-orange-400 font-bold uppercase">No Document Uploaded</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-bg-light dark:bg-gray-900 rounded-lg mt-4">
                <div>
                  <p className="font-medium text-text-main dark:text-gray-200">User Status</p>
                  <p className="text-sm text-text-secondary dark:text-gray-400">
                    {formData.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
                                peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full 
                                peer dark:bg-gray-700 peer-checked:after:translate-x-full 
                                peer-checked:after:border-white after:content-[''] after:absolute 
                                after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 
                                after:border after:rounded-full after:h-5 after:w-5 after:transition-all 
                                dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex gap-3 mt-6">
                <Button type="submit" className="flex-1">
                  Update User
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

export default Users;
