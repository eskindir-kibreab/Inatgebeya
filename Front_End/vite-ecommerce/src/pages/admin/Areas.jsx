import React, { useState, useEffect } from "react";
import { MapPin, Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, BarChart3 } from "lucide-react";
import { areasAPI } from "../../api/areas.api";
import Input from "../../components/forms/Input";
import Button from "../../components/forms/Button";
import toast from "react-hot-toast";

const AdminAreas = () => {
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentArea, setCurrentArea] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [formData, setFormData] = useState({
        area_name: "",
    });

    useEffect(() => {
        fetchAreas();
    }, []);

    const fetchAreas = async () => {
        try {
            setLoading(true);
            // Fetch areas with stats to show shop counts
            const response = await areasAPI.getAll({ stats: true });
            if (response.success) {
                setAreas(response.data);
            }
        } catch (error) {
            toast.error("Failed to load areas");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAddModal = () => {
        setIsEditing(false);
        setCurrentArea(null);
        setFormData({ area_name: "" });
        setShowModal(true);
    };

    const handleOpenEditModal = (area) => {
        setIsEditing(true);
        setCurrentArea(area);
        setFormData({
            area_name: area.area_name,
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                const response = await areasAPI.update(currentArea.area_id, formData);
                if (response.success) {
                    toast.success("Area updated successfully");
                    setShowModal(false);
                    fetchAreas();
                }
            } else {
                const response = await areasAPI.create(formData);
                if (response.success) {
                    toast.success("Area created successfully");
                    setShowModal(false);
                    fetchAreas();
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Operation failed");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this area? This action cannot be undone if no shops are linked.")) return;
        try {
            const response = await areasAPI.delete(id);
            if (response.success) {
                toast.success("Area deleted successfully");
                fetchAreas();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete area");
        }
    };

    const filteredAreas = areas.filter(area =>
        area.area_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text-main dark:text-gray-200">Area Management</h1>
                    <p className="text-text-secondary dark:text-gray-400 mt-2">Manage service delivery areas and locations</p>
                </div>
                <Button onClick={handleOpenAddModal} icon={Plus}>Add New Area</Button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-border-default dark:border-gray-700 mb-8">
                <div className="max-w-md">
                    <Input
                        placeholder="Search areas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={Search}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-border-default dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700/50">
                                <th className="px-6 py-4 text-sm font-semibold text-text-main dark:text-gray-200 border-b dark:border-gray-700">ID</th>
                                <th className="px-6 py-4 text-sm font-semibold text-text-main dark:text-gray-200 border-b dark:border-gray-700">Area Name</th>
                                <th className="px-6 py-4 text-sm font-semibold text-text-main dark:text-gray-200 border-b dark:border-gray-700">Total Shops</th>
                                <th className="px-6 py-4 text-sm font-semibold text-text-main dark:text-gray-200 border-b dark:border-gray-700 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-gray-700">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="4" className="px-6 py-4"><div className="h-10 bg-gray-100 dark:bg-gray-700 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : filteredAreas.length > 0 ? (
                                filteredAreas.map((area) => (
                                    <tr key={area.area_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4 text-sm text-text-secondary dark:text-gray-400">#{area.area_id}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-500/10 rounded flex items-center justify-center">
                                                    <MapPin className="w-4 h-4 text-blue-500" />
                                                </div>
                                                <span className="font-medium text-text-main dark:text-gray-200">{area.area_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <BarChart3 className="w-4 h-4 text-text-muted" />
                                                <span className="text-sm dark:text-gray-300">
                                                    {area.shop_count || 0} {area.shop_count === 1 ? 'shop' : 'shops'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenEditModal(area)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(area.area_id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    disabled={area.shop_count > 0}
                                                    title={area.shop_count > 0 ? "Cannot delete area with shops" : "Delete area"}
                                                >
                                                    <Trash2 className={`w-4 h-4 ${area.shop_count > 0 ? 'opacity-30' : ''}`} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-text-secondary dark:text-gray-400">No areas found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-8 shadow-xl">
                        <h2 className="text-2xl font-bold text-text-main dark:text-gray-200 mb-6">
                            {isEditing ? "Edit Area" : "Add New Area"}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Area Name"
                                placeholder="Enter area name (e.g. Bole, Kazanchis)"
                                value={formData.area_name}
                                onChange={(e) => setFormData({ ...formData, area_name: e.target.value })}
                                required
                            />
                            <div className="flex gap-4 pt-4">
                                <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button type="submit" className="flex-1">{isEditing ? "Save Changes" : "Create Area"}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAreas;
