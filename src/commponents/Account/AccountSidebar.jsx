
import { NavLink, Link } from "react-router-dom";

import {
  LayoutDashboard,
  UserRound,
  LockKeyhole,
  ShoppingBag,
  Heart,
  ChevronRight,
  LogOut,
} from "lucide-react";

import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// ==========================================
// ACCOUNT SIDEBAR
// ==========================================

const AccountSidebar = ({
  user,
  activeSection,
  onSectionChange,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  // Both customers and Shop Owners can use shopping features.
  const hasShoppingAccess =
    user?.role === "USER" || user?.role === "SHOP_OWNER";

  // ==========================================
  // ROLE LABELS
  // ==========================================

  const roleLabels = {
    USER: "Customer Account",
    SHOP_OWNER: "Shop Owner",
    ADMIN: "Administrator",
    SUPER_ADMIN: "Super Administrator",
  };

  // ==========================================
  // PERSONAL ACCOUNT NAVIGATION
  // ==========================================

  const accountItems = [
    {
      id: "overview",
      label: "Overview",
      icon: LayoutDashboard,
      section: true,
    },
    {
      id: "profile",
      label: "Personal Information",
      icon: UserRound,
      section: true,
    },
    {
      id: "password",
      label: "Change Password",
      icon: LockKeyhole,
      section: true,
    },
  ];

  // ==========================================
  // CUSTOMER SHOPPING NAVIGATION
  // ==========================================

  const customerItems = [
    {
      id: "orders",
      label: "My Orders",
      icon: ShoppingBag,
      path: "/my-orders",
    },
    {
      id: "wishlist",
      label: "Liked Products",
      icon: Heart,
      path: "/wishlist",
    },
  ];

  // ==========================================
  // ACTIVE ITEM CHECK
  // ==========================================

  const isItemActive = (item) => {
    if (item.section) {
      return activeSection === item.id;
    }

    return (
      location.pathname === item.path ||
      location.pathname.startsWith(`${item.path}/`)
    );
  };

  // ==========================================
  // NAVIGATION HANDLER
  // ==========================================

  const handleItemClick = (item) => {
    if (item.path) {
      navigate(item.path);
      return;
    }

    if (item.section) {
      onSectionChange(item.id);
    }
  };

  // ==========================================
  // SIGN OUT
  // ==========================================

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // ==========================================
  // RENDER NAVIGATION ITEMS
  // ==========================================

  const renderItems = (items) =>
    items.map((item) => {
      const Icon = item.icon;
      const isActive = isItemActive(item);

      return (
        <button
          key={item.id}
          type="button"
          onClick={() => handleItemClick(item)}
          className={`
            group flex w-full items-center gap-3
            rounded-xl px-3 py-3 text-left
            text-sm font-medium transition-all duration-200
            ${
              isActive
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }
          `}
        >
          <span
            className={`
              flex h-9 w-9 shrink-0 items-center justify-center
              rounded-lg transition
              ${
                isActive
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-50 text-gray-500 group-hover:bg-white group-hover:text-blue-600"
              }
            `}
          >
            <Icon size={18} />
          </span>

          <span className="min-w-0 flex-1">
            {item.label}
          </span>

          {isActive && (
            <ChevronRight
              size={16}
              className="shrink-0 text-blue-600"
            />
          )}
        </button>
      );
    });

  // ==========================================
  // PROFILE INITIALS
  // ==========================================

  const initials = (user?.name || "User")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  // ==========================================
  // SIDEBAR
  // ==========================================

  return (
    <aside className="w-full shrink-0 lg:w-72">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

        {/* PROFILE INFORMATION */}

        <div className="border-b border-gray-100 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name || "Profile"}
                className="h-12 w-12 shrink-0 rounded-full border border-gray-100 object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-bold text-white">
                {initials || "U"}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-bold text-gray-900">
                {user?.name || "My Account"}
              </h3>

              <p className="mt-1 truncate text-xs font-medium text-gray-500">
                {roleLabels[user?.role] || "Account"}
              </p>
            </div>
          </div>

          {user?.email && (
            <p className="mt-3 truncate text-xs text-gray-400">
              {user.email}
            </p>
          )}
        </div>

        {/* NAVIGATION */}

        <nav className="max-h-[calc(100vh-260px)] space-y-5 overflow-y-auto p-3">

          {/* PERSONAL ACCOUNT */}

          <div>
            <p className="mb-2 px-3 pt-2 text-[10px] font-bold uppercase tracking-[1.5px] text-gray-400">
              Personal Account
            </p>

            <div className="space-y-1">
              {renderItems(accountItems)}
            </div>
          </div>

          {/* CUSTOMER SHOPPING */}

          {hasShoppingAccess && (
            <div>
              <div className="mb-2 border-t border-gray-100" />

              <p className="mb-2 px-3 pt-3 text-[10px] font-bold uppercase tracking-[1.5px] text-gray-400">
                Shopping
              </p>

              <div className="space-y-1">
                {renderItems(customerItems)}
              </div>
            </div>
          )}
        </nav>

        {/* SIGN OUT */}

        <div className="border-t border-gray-100 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 transition group-hover:bg-red-100">
              <LogOut size={18} />
            </span>

            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AccountSidebar;
