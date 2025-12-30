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
    min_price: "",
    max_price: "",
  });
  const searchRef = useRef(null);
  const deliveriesRef = useRef(null);

  // Sync state with URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q") || "";
    const category = params.get("category") || "";
    const min_price = params.get("min_price") || "";
    const max_price = params.get("max_price") || "";

    setSearchQuery(q);
    setFilters({
      category_id: category,
      min_price,
      max_price,
    });
  }, [location.search]);

  // Debounced search for real-time results
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const currentQ = params.get("q") || "";

    if (searchQuery === currentQ) return;

    const timer = setTimeout(() => {
      const urlParams = new URLSearchParams(location.search);
      if (searchQuery.trim()) {
        urlParams.set("q", searchQuery.trim());
      } else {
        urlParams.delete("q");
      }

      navigate(`/search?${urlParams.toString()}`, { replace: location.pathname === "/search" });
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, navigate, location.search, location.pathname]);

  // Handle click outside for mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (window.innerWidth < 1024 && isProfileOpen && !event.target.closest('.profile-dropdown')) {
        setIsProfileOpen(false);
      }
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
    if (newFilters.min_price) urlParams.set("min_price", newFilters.min_price);
    if (newFilters.max_price) urlParams.set("max_price", newFilters.max_price);
    navigate(`/search?${urlParams.toString()}`);
  };

  const isAdminPage = location.pathname.startsWith("/admin");
  const isShopOwnerPage = location.pathname.startsWith("/shop-owner");
  const isDeliveryAdminPage = location.pathname.startsWith("/delivery-admin");
  const isItemAdderPage = location.pathname.startsWith("/item-adder");
  const isDeliveryPersonPage = location.pathname.startsWith("/delivery-person");
  const isRoleBasedPage = isAdminPage || isShopOwnerPage || isDeliveryAdminPage || isItemAdderPage || isDeliveryPersonPage;

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-bg-dark shadow-sm">
      <div className={`container mx-auto px-4 ${isRoleBasedPage ? "py-3" : "py-2"}`}>
        <div className="flex items-center justify-between gap-4 lg:gap-8">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link
              to={isRoleBasedPage ? (role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN ? "/admin/dashboard" : "/") : "/"}
              className="flex items-center space-x-2"
              onClick={() => {
                const targetPath = isRoleBasedPage ? (role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN ? "/admin/dashboard" : "/") : "/";
                window.scrollTo(0, 0);
                if (location.pathname === targetPath && !location.search) {
                  window.location.reload();
                }
              }}
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-white font-black text-lg sm:text-xl">IG</span>
              </div>
              <span className="text-xl sm:text-2xl font-black text-text-main dark:text-white hidden md:inline tracking-tight">
                InatGebeya
              </span>
            </Link>
          </div>

          {/* Center: Search (Public) or Nav (Admin) */}
          <div className="flex-1 flex justify-center px-4 max-w-4xl mx-auto">
            {isRoleBasedPage ? (
              /* Role-based Navigation */
              isAuthenticated && role && (
                <nav className="hidden lg:flex items-center gap-1">
                  {(role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN) && (
                    <>
                      <Link to="/admin/dashboard" className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${location.pathname === "/admin/dashboard" ? "bg-primary text-white" : "text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
                        <LayoutDashboard className="w-4 h-4 inline mr-1" /> Dashboard
                      </Link>
                      <Link to="/admin/users" className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${location.pathname === "/admin/users" ? "bg-primary text-white" : "text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
                        <Users className="w-4 h-4 inline mr-1" /> Users
                      </Link>
                      <Link to="/admin/products" className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${location.pathname === "/admin/products" ? "bg-primary text-white" : "text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
                        <Package className="w-4 h-4 inline mr-1" /> Products
                      </Link>
                      <Link to="/admin/categories" className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${location.pathname === "/admin/categories" ? "bg-primary text-white" : "text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
                        <FolderTree className="w-4 h-4 inline mr-1" /> Categories
                      </Link>
                      <Link to="/admin/shops" className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${location.pathname === "/admin/shops" ? "bg-primary text-white" : "text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
                        <ShoppingBag className="w-4 h-4 inline mr-1" /> Shops
                      </Link>

                      {/* Deliveries Dropdown */}
                      <div className="relative deliveries-dropdown group"
                        onMouseEnter={() => window.innerWidth >= 1024 && setIsDeliveriesOpen(true)}
                        onMouseLeave={() => window.innerWidth >= 1024 && setIsDeliveriesOpen(false)}>
                        <button className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${location.pathname.includes("/admin/deliveries") ? "bg-primary text-white" : "text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
                          <Truck className="w-4 h-4" /> Deliveries <ChevronDown className="w-4 h-4" />
                        </button>
                        <div className={`absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-2 z-50 border border-border-default dark:border-gray-700 transition-all ${isDeliveriesOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                          <Link to="/admin/team" className="block px-4 py-2 hover:bg-bg-light dark:hover:bg-gray-700">Manage Team</Link>
                          <Link to="/admin/deliveries" className="block px-4 py-2 hover:bg-bg-light dark:hover:bg-gray-700">All Deliveries</Link>
                        </div>
                      </div>
                    </>
                  )}
                </nav>
              )
            ) : (
              /* Public Search Bar - Extra Long and Centered */
              <form onSubmit={handleSearchSubmit} className="w-full relative group hidden sm:block">
                <div className="relative flex items-center">
                  <Search className="absolute left-4 text-text-muted w-5 h-5 group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search..."
                    className="w-full pl-12 pr-32 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-2 border-border-default 
                             dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 
                             focus:border-primary text-lg text-black dark:text-white transition-all shadow-sm
                             placeholder:text-gray-400 dark:placeholder:text-gray-500 font-medium"
                  />
                  <div className="absolute right-1.5">
                    <button type="submit" className="px-6 py-1.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover shadow-lg active:scale-95 transition-all">
                      Search
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
            {!isRoleBasedPage && (
              <>
                <div className="hidden lg:block">
                  <FilterDropdown onFilterChange={handleFilterChange} currentFilters={filters} />
                </div>
                {(!isAuthenticated || role === "user") && (
                  <Link to="/cart" className="p-2 sm:p-2.5 rounded-xl hover:bg-bg-light dark:hover:bg-gray-800 transition-all relative group">
                    <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-text-main dark:text-white group-hover:scale-110 transition-transform" />
                  </Link>
                )}
              </>
            )}

            <button onClick={toggleTheme} className="p-2 sm:p-2.5 rounded-xl hover:bg-bg-light dark:hover:bg-gray-800 transition-all group">
              {isDarkMode ? <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 group-hover:rotate-12 transition-transform" /> : <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-text-muted group-hover:-rotate-12 transition-transform" />}
            </button>

            {/* Profile */}
            <div className="relative profile-dropdown group">
              {isAuthenticated ? (
                <>
                  <button
                    onMouseEnter={() => window.innerWidth >= 1024 && setIsProfileOpen(true)}
                    onMouseLeave={() => window.innerWidth >= 1024 && setIsProfileOpen(false)}
                    className="flex items-center gap-2 p-1.5 sm:p-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-bg-light transition-all border border-border-default dark:border-gray-700"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <span className="hidden xl:inline text-sm font-bold text-text-main dark:text-white">{user?.full_name?.split(" ")[0]}</span>
                    <ChevronDown className="w-4 h-4 text-text-secondary" />
                  </button>
                  <div className={`absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl py-2 z-50 border border-border-default dark:border-gray-700 transition-all ${isProfileOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'}`}
                    onMouseEnter={() => setIsProfileOpen(true)}
                    onMouseLeave={() => setIsProfileOpen(false)}>
                    <Link to="/profile" className="block px-4 py-3 font-bold text-sm hover:bg-bg-light dark:hover:bg-gray-700">My Profile</Link>
                    {!isRoleBasedPage && <Link to="/orders" className="block px-4 py-3 font-bold text-sm hover:bg-bg-light dark:hover:bg-gray-700">My Orders</Link>}
                    <hr className="my-2 border-border-default dark:border-gray-700" />
                    <button onClick={logout} className="w-full text-left px-4 py-3 font-bold text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">Logout</button>
                  </div>
                </>
              ) : (
                location.pathname !== "/login" && (
                  <Link
                    to="/login"
                    className="flex items-center active:scale-95 transition-all group"
                  >
                    <span className="px-5 py-2 bg-primary text-white rounded-xl text-sm sm:text-base font-black hover:bg-primary-hover shadow-lg shadow-primary/20">
                      Login
                    </span>
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
