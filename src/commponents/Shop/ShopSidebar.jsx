
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Tags,
  ClipboardList,
  Star,
  Settings,
  Store,
  ArrowLeft,
  X,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

const ShopSidebar = ({ onNavigate = () => {} }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    {
      name: "Dashboard",
      path: "/shop/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "My Products",
      path: "/shop/products",
      icon: Package,
    },
    {
      name: "Product Categories",
      path: "/shop/categories",
      icon: Tags,
    },
    {
      name: "Orders",
      path: "/shop/orders",
      icon: ClipboardList,
    },
    {
      name: "Product Reviews",
      path: "/shop/reviews",
      icon: Star,
    },
    {
      name: "Shop Settings",
      path: "/shop/settings",
      icon: Settings,
    },
  ];

  const handleBackToShopping = () => {
    onNavigate();
    navigate("/");
  };

  return (
    <aside className="flex h-full min-h-[70vh] flex-col border-r border-gray-200 bg-white">
      {/* Shop Information */}
      <div className="border-b border-gray-100 p-5">
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-indigo-100 text-indigo-600">
              {user?.shop?.logo ? (
                <img
                  src={user.shop.logo}
                  alt={user.shop.name || "Shop logo"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Store size={23} />
              )}
            </div>

            <div className="min-w-0">
              <h2 className="truncate font-bold text-gray-900">
                {user?.shop?.name || "My Shop"}
              </h2>
              <p className="text-xs text-gray-500">
                Shop Owner Panel
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigate}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 lg:hidden"
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        </div>

        <div className="mt-4">
          <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
            {user?.shop?.status || "APPROVED"}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Shop Management
        </p>

        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/shop/dashboard"}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              <Icon size={19} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Back to Shopping */}
      <div className="border-t border-gray-100 p-4">
        <button
          type="button"
          onClick={handleBackToShopping}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
        >
          <ArrowLeft size={19} />
          Back to Shopping
        </button>
      </div>
    </aside>
  );
};

export default ShopSidebar;
