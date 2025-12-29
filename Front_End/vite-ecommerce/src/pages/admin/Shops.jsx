import React, { useState, useEffect } from "react";
import { ShoppingBag, Search, Plus, Edit, Trash2, MapPin, User, ChevronLeft, ChevronRight } from "lucide-react";
import { shopsAPI } from "../../api/shops.api";
import { usersAPI } from "../../api/users.api";
import { areasAPI } from "../../api/areas.api";
import Input from "../../components/forms/Input";
import Button from "../../components/forms/Button";
import Select from "../../components/forms/Select";
import toast from "react-hot-toast";

const AdminShops = () => {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [areas, setAreas] = useState([]);
    const [users, setUsers] = useState([]); // For owner selection
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentShop, setCurrentShop] = useState(null);
    const [filters, setFilters] = useState({
        search: "",
        area_id: "",
        page: 1,
        limit: 10,
    });
    const [pagination, setPagination] = useState({
        total: 0,
        totalPages: 0,
    });

    const [formData, setFormData] = useState({
        shop_name: "",
        owner_id: "",
        area_id: "",
    });

    useEffect(() => {
        fetchShops();
        fetchAreas();
        fetchUsers();
    }, [filters.page, filters.area_id]);

    const fetchShops = async () => {
        try {
            setLoading(true);
            const response = await shopsAPI.getAll(filters);
            if (response.success) {
                setShops(response.data);
                setPagination({
                    total: response.pagination.total,
                    totalPages: response.pagination.pages,
                });
            }
        } catch (error) {
            toast.error("Failed to load shops");
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

    const fetchUsers = async () => {
        try {
            // Fetch users who could potentially be shop owners
            const response = await usersAPI.getAllUsers({ limit: 100 });
            if (response.success) {
                setUsers(response.data);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setFilters({ ...filters, page: 1 });
        fetchShops();
    };

    const handleOpenAddModal = () => {
        setIsEditing(false);
        setCurrentShop(null);
        setFormData({ shop_name: "", owner_id: "", area_id: "" });
        setShowModal(true);
    };

    const handleOpenEditModal = (shop) => {
        setIsEditing(true);
        setCurrentShop(shop);
        setFormData({
            shop_name: shop.shop_name,
            owner_id: shop.owner_id,
            area_id: shop.area_id,
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                const response = await shopsAPI.update(currentShop.shop_id, formData);
                if (response.success) {
                    toast.success("Shop updated successfully");
                    setShowModal(false);
                    fetchShops();
                }
            } else {
                const response = await shopsAPI.create(formData);
                if (response.success) {
                    toast.success("Shop created successfully");
                    setShowModal(false);
                    fetchShops();
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Operation failed");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this shop?")) return;
        try {
            const response = await shopsAPI.delete(id);
            if (response.success) {
                toast.success("Shop deleted successfully");
                fetchShops();
            }
        } catch (error) {
            toast.error("Failed to delete shop");
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text-main dark:text-gray-200">Shop Management</h1>
                    <p className="text-text-secondary dark:text-gray-400 mt-2">Manage all marketplace shops and owners</p>
                </div>
                <Button onClick={handleOpenAddModal} icon={Plus}>Add New Shop</Button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-border-default dark:border-gray-700 mb-8">
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                        placeholder="Search shops..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        icon={Search}
                    />
                    <Select
                        value={filters.area_id}
                        onChange={(e) => setFilters({ ...filters, area_id: e.target.value, page: 1 })}
                        options={[
                            { value: "", label: "All Areas" },
                            ...areas.map(a => ({ value: a.area_id, label: a.area_name }))
                        ]}
                    />
                    <div className="flex items-end">
                        <Button type="submit" className="w-full" variant="secondary">Filter</Button>
                    </div>
                </form>
            </div>

            {/* Tables */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-border-default dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700/50">
                                <th className="px-6 py-4 text-sm font-semibold text-text-main dark:text-gray-200 border-b dark:border-gray-700">ID</th>
                                <th className="px-6 py-4 text-sm font-semibold text-text-main dark:text-gray-200 border-b dark:border-gray-700">Shop Name</th>
                                <th className="px-6 py-4 text-sm font-semibold text-text-main dark:text-gray-200 border-b dark:border-gray-700">Owner</th>
                                <th className="px-6 py-4 text-sm font-semibold text-text-main dark:text-gray-200 border-b dark:border-gray-700">Area</th>
                                <th className="px-6 py-4 text-sm font-semibold text-text-main dark:text-gray-200 border-b dark:border-gray-700">Created At</th>
                                <th className="px-6 py-4 text-sm font-semibold text-text-main dark:text-gray-200 border-b dark:border-gray-700 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-gray-700">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-6 py-4"><div className="h-10 bg-gray-100 dark:bg-gray-700 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : shops.length > 0 ? (
                                shops.map((shop) => (
                                    <tr key={shop.shop_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4 text-sm text-text-secondary dark:text-gray-400">#{shop.shop_id}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                                                    <ShoppingBag className="w-4 h-4 text-primary" />
                                                </div>
                                                <span className="font-medium text-text-main dark:text-gray-200">{shop.shop_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-text-muted" />
                                                <span className="text-sm dark:text-gray-300">{shop.owner_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-text-muted" />
                                                <span className="text-sm dark:text-gray-300">{shop.area_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-text-secondary dark:text-gray-400">
                                            {new Date(shop.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenEditModal(shop)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(shop.shop_id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-text-secondary dark:text-gray-400">No shops found matching your criteria.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="px-6 py-4 flex items-center justify-between border-t border-border-default dark:border-gray-700">
                        <p className="text-sm text-text-secondary dark:text-gray-400">
                            Showing <span className="font-medium">{(filters.page - 1) * filters.limit + 1}</span> to <span className="font-medium">{Math.min(filters.page * filters.limit, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> shops
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                                disabled={filters.page === 1}
                                className="p-2 border border-border-default dark:border-gray-700 rounded-lg disabled:opacity-50"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                                disabled={filters.page === pagination.totalPages}
                                className="p-2 border border-border-default dark:border-gray-700 rounded-lg disabled:opacity-50"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-8 shadow-xl">
                        <h2 className="text-2xl font-bold text-text-main dark:text-gray-200 mb-6">
                            {isEditing ? "Edit Shop" : "Add New Shop"}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Shop Name"
                                placeholder="Enter shop name"
                                value={formData.shop_name}
                                onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                                required
                            />
                            <Select
                                label="Owner"
                                value={formData.owner_id}
                                onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                                options={[
                                    { value: "", label: "Select Owner" },
                                    ...users.map(u => ({ value: u.user_id, label: `${u.full_name} (${u.email})` }))
                                ]}
                                required
                            />
                            <Select
                                label="Area"
                                value={formData.area_id}
                                onChange={(e) => setFormData({ ...formData, area_id: e.target.value })}
                                options={[
                                    { value: "", label: "Select Area" },
                                    ...areas.map(a => ({ value: a.area_id, label: a.area_name }))
                                ]}
                                required
                            />
                            <div className="flex gap-4 pt-4">
                                <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button type="submit" className="flex-1">{isEditing ? "Save Changes" : "Create Shop"}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminShops;
