import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Sun, Moon, User, LayoutDashboard, Users, Package, FolderTree, Truck, ShoppingCart, LogOut, ChevronDown, UserCheck, ListTodo, ShoppingBag, MapPin } from "lucide-react";
import FilterDropdown from "../search/FilterDropdown";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../utils/constants";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();
  const { isAuthenticated, user, role, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDeliveriesOpen, setIsDeliveriesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    category_id: "",
    area_id: "",
    min_price: "",
    max_price: "",
    sort_by: "newest",
  });
  const searchRef = useRef(null);
  const deliveriesRef = useRef(null);

  // Sync state with URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q") || "";
    const category = params.get("category") || "";
    const area = params.get("area") || "";
    const min_price = params.get("min_price") || "";
    const max_price = params.get("max_price") || "";
    const sort_by = params.get("sort_by") || "newest";

    setSearchQuery(q);
    setFilters({
      category_id: category,
      area_id: area,
      min_price,
      max_price,
      sort_by,
    });
  }, [location.search]);

  // Handle click outside for mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close search suggestions if open
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        // no-op for now; reserved if we add dropdowns near search
      }

      // For mobile, close profile dropdown when clicking outside
      if (window.innerWidth < 1024 && isProfileOpen && !event.target.closest('.profile-dropdown')) {
        setIsProfileOpen(false);
      }

      // Close deliveries dropdown when clicking outside (for mobile)
      if (window.innerWidth < 1024 && isDeliveriesOpen &&
        !event.target.closest('.deliveries-dropdown') &&
        !event.target.closest('.deliveries-button')) {
        setIsDeliveriesOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileOpen, isDeliveriesOpen]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);

    const urlParams = new URLSearchParams();
    if (searchQuery) urlParams.set("q", searchQuery.trim());
    if (newFilters.category_id) urlParams.set("category", newFilters.category_id);
    if (newFilters.area_id) urlParams.set("area", newFilters.area_id);
    if (newFilters.min_price) urlParams.set("min_price", newFilters.min_price);
    if (newFilters.max_price) urlParams.set("max_price", newFilters.max_price);
    if (newFilters.sort_by !== "newest")
      urlParams.set("sort_by", newFilters.sort_by);

    navigate(`/search?${urlParams.toString()}`);
  };

  // Check if we're on an admin page
  const isAdminPage = location.pathname.startsWith("/admin");
  const isShopOwnerPage = location.pathname.startsWith("/shop-owner");
  const isDeliveryAdminPage = location.pathname.startsWith("/delivery-admin");
  const isItemAdderPage = location.pathname.startsWith("/item-adder");
  const isDeliveryPersonPage = location.pathname.startsWith("/delivery-person");
  const isRoleBasedPage = isAdminPage || isShopOwnerPage || isDeliveryAdminPage || isItemAdderPage || isDeliveryPersonPage;

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-bg-dark shadow-sm">
      <div
        className={`container mx-auto px-4 ${role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN
            ? "py-6"
            : "py-3"
          }`}
      >
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link to={isRoleBasedPage ? (role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN ? "/admin/dashboard" : "/") : "/"} className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">IG</span>
            </div>
            <span className="text-xl font-bold text-text-main dark:text-white">
              InatGebeya
            </span>
          </Link>

          {/* Role-based Navigation */}
          {isAuthenticated && role && (
            <nav className="flex-1 flex items-center justify-between gap-1 mx-6">
              {(role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN) && (
                <>
                  <Link
                    to="/admin/dashboard"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === "/admin/dashboard"
                      ? "bg-primary text-white"
                      : "text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                  >
                    <LayoutDashboard className="w-4 h-4 inline mr-1" />
                    Dashboard
                  </Link>
                  <Link
                    to="/admin/users"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === "/admin/users"
                      ? "bg-primary text-white"
                      : "text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                  >
                    <Users className="w-4 h-4 inline mr-1" />
                    Users
                  </Link>
                  <Link
                    to="/admin/products"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === "/admin/products"
                      ? "bg-primary text-white"
                      : "text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                  >
                    <Package className="w-4 h-4 inline mr-1" />
                    Products
                  </Link>
                  <Link
                    to="/admin/categories"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === "/admin/categories"
                      ? "bg-primary text-white"
                      : "text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                  >
                    <FolderTree className="w-4 h-4 inline mr-1" />
                    Categories
                  </Link>
                  <Link
                    to="/admin/shops"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === "/admin/shops"
                      ? "bg-primary text-white"
                      : "text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                  >
                    <ShoppingBag className="w-4 h-4 inline mr-1" />
                    Shops
                  </Link>
                  <Link
                    to="/admin/areas"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === "/admin/areas"
                      ? "bg-primary text-white"
                      : "text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                  >
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Areas
                  </Link>

                  {/* Deliveries Dropdown */}
                  <div
                    className="relative deliveries-dropdown group"
                    onMouseEnter={() => window.innerWidth >= 1024 && setIsDeliveriesOpen(true)}
                    onMouseLeave={() => window.innerWidth >= 1024 && setIsDeliveriesOpen(false)}
                    ref={deliveriesRef}
                  >
                    <button
                      onClick={() => window.innerWidth < 1024 && setIsDeliveriesOpen(!isDeliveriesOpen)}
                      className={`deliveries-button flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname.startsWith("/admin/deliveries") ||
                        location.pathname.startsWith("/admin/team") ||
                        location.pathname.startsWith("/admin/assign")
                        ? "bg-primary text-white"
                        : "text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                    >
                      <div className="flex items-center">
                        <Truck className="w-4 h-4 mr-1" />
                        <span>Deliveries</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${isDeliveriesOpen ? 'transform rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    <div
                      className={`absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700 rounded-md shadow-lg ring-1 ring-black/5 focus:outline-none z-50 transition-all duration-200 ease-in-out ${isDeliveriesOpen ? 'opacity-100 visible' : 'opacity-0 invisible lg:group-hover:opacity-100 lg:group-hover:visible'
                        }`}
                    >
                      <div className="px-1 py-1">
                        <Link
                          to="/admin/team"
                          className="group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-primary/10 hover:text-primary"
                          onClick={() => setIsDeliveriesOpen(false)}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Manage Team
                        </Link>
                        <Link
                          to="/admin/deliveries"
                          className="group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-primary/10 hover:text-primary"
                          onClick={() => setIsDeliveriesOpen(false)}
                        >
                          <ListTodo className="w-4 h-4 mr-2" />
                          View All Deliveries
                        </Link>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </nav>
          )}

          {/* Search bar + button + filters + theme + auth - Only show for public/user pages */}
          {!isRoleBasedPage && (
            <div
              className={`flex-1 flex items-center gap-3 ${role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN
                ? "justify-end"
                : ""
                }`}
              ref={searchRef}
            >
              {/* Search + button - Hide for Admins */}
              {!(role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN) && (
                <form onSubmit={handleSearchSubmit} className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      placeholder="Search products..."
                      className="w-full pl-10 pr-28 py-2 border border-border-default rounded-lg 
                       bg-white dark:bg-gray-800 dark:border-gray-700 
                       focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                    <button
                      type="submit"
                      className="absolute right-1 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-md 
                               bg-primary text-white text-sm font-medium hover:bg-primary-hover"
                    >
                      Search
                    </button>
                  </div>
                </form>
              )}

              {/* Filter dropdown - Hide for Admins */}
              {!(role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN) && (
                <FilterDropdown
                  onFilterChange={handleFilterChange}
                  currentFilters={filters}
                />
              )}

              {/* Shopping Cart - Only for guests or regular users */}
              {(!isAuthenticated || role === "user") && (
                <Link
                  to="/cart"
                  className="p-2 rounded-full hover:bg-bg-light dark:hover:bg-gray-700 transition-colors relative"
                  aria-label="Shopping Cart"
                >
                  <ShoppingCart className="w-5 h-5 text-text-main dark:text-white" />
                </Link>
              )}

              {/* Dark / light toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-bg-light dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-yellow-300" />
                ) : (
                  <Moon className="w-5 h-5 text-text-muted" />
                )}
              </button>

              {/* Auth: login/register or user */}
              {isAuthenticated ? (
                <div className="relative profile-dropdown group">
                  <button
                    onClick={() => window.innerWidth < 1024 && setIsProfileOpen(!isProfileOpen)}
                    onMouseEnter={() => window.innerWidth >= 1024 && setIsProfileOpen(true)}
                    onMouseLeave={() => window.innerWidth >= 1024 && setIsProfileOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-bg-light dark:hover:bg-gray-700 transition-colors"
                  >
                    <User className="w-5 h-5 text-text-main dark:text-white" />
                    <span className="hidden sm:inline text-sm font-medium text-text-main dark:text-white">
                      {user?.full_name?.split(" ")[0] || "User"}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${isProfileOpen ? 'transform rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  <div
                    className={`absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-50 transition-all duration-200 ease-in-out ${isProfileOpen ? 'opacity-100 visible' : 'opacity-0 invisible lg:group-hover:opacity-100 lg:group-hover:visible'
                      }`}
                    onMouseLeave={() => window.innerWidth >= 1024 && setIsProfileOpen(false)}
                  >
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-text-main dark:text-gray-200 hover:bg-bg-light dark:hover:bg-gray-700"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                    <Link
                      to="/orders"
                      className="flex items-center px-4 py-2 text-sm text-text-main dark:text-gray-200 hover:bg-bg-light dark:hover:bg-gray-700"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      My Orders
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsProfileOpen(false);
                      }}
                      className="w-full text-left flex items-center px-4 py-2 text-sm text-text-main dark:text-gray-200 hover:bg-bg-light dark:hover:bg-gray-700"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 text-sm font-medium text-text-main dark:text-white hover:text-primary"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden sm:inline">Login</span>
                </Link>
              )}
            </div>
          )}

          {/* For role-based pages, show theme toggle and user info on the right */}
          {isRoleBasedPage && (
            <div className="flex items-center justify-end gap-3">
              {/* Dark / light toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-bg-light dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-yellow-300" />
                ) : (
                  <Moon className="w-5 h-5 text-text-muted" />
                )}
              </button>

              {/* Auth: user */}
              {isAuthenticated && (
                <div className="relative profile-dropdown group">
                  <button
                    onClick={() =>
                      window.innerWidth < 1024 && setIsProfileOpen(!isProfileOpen)
                    }
                    onMouseEnter={() =>
                      window.innerWidth >= 1024 && setIsProfileOpen(true)
                    }
                    onMouseLeave={() =>
                      window.innerWidth >= 1024 && setIsProfileOpen(false)
                    }
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-bg-light dark:hover:bg-gray-700 transition-colors"
                  >
                    <User className="w-5 h-5 text-text-main dark:text-white" />
                    <span className="hidden sm:inline text-sm font-medium text-text-main dark:text-white">
                      {user?.full_name?.split(" ")[0] || "User"}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${isProfileOpen ? "transform rotate-180" : ""
                        }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  <div
                    className={`absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-50 transition-all duration-200 ease-in-out ${isProfileOpen
                      ? "opacity-100 visible"
                      : "opacity-0 invisible lg:group-hover:opacity-100 lg:group-hover:visible"
                      }`}
                    onMouseLeave={() =>
                      window.innerWidth >= 1024 && setIsProfileOpen(false)
                    }
                  >
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-text-main dark:text-gray-200 hover:bg-bg-light dark:hover:bg-gray-700"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsProfileOpen(false);
                      }}
                      className="w-full text-left flex items-center px-4 py-2 text-sm text-text-main dark:text-gray-200 hover:bg-bg-light dark:hover:bg-gray-700"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;