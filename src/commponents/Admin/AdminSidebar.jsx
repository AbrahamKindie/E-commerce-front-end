
import { NavLink, Link } from "react-router-dom";

import {
  LayoutDashboard,
  Store,
  Users,
  X,
  ShieldCheck,
  Activity,
  ShoppingBag,
  Package,
  ClipboardList,
  ChevronRight,
  Tags,
  Shield,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

// ==========================================
// ADMIN SIDEBAR
// ==========================================

const AdminSidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  // ==========================================
  // EFFECTIVE ADMIN PERMISSIONS
  // ==========================================

  // Permissions are calculated by the backend
  // from the Admin's currently assigned active role.

  const permissions = Array.isArray(user?.adminPermissions)
    ? user.adminPermissions.filter(
        (permission) =>
          permission !== "MANAGE_ADMIN_PERMISSIONS"
      )
    : [];

  const hasPermission = (permission) =>
    isSuperAdmin || permissions.includes(permission);

  // ==========================================
  // NAVIGATION ITEMS
  // ==========================================

const navigationGroups = [
  {
    title: "Overview",
    items: [
      {
        name: "Dashboard",
        path: "/admin",
        icon: LayoutDashboard,
        visible: hasPermission("VIEW_REPORTS"),
        end: true,
      },
    ],
  },

  {
    title: "Marketplace Management",
    items: [
      {
        name: "User Management",
        path: "/admin/users",
        icon: Users,
        visible:
          hasPermission("VIEW_USERS") ||
          hasPermission("VIEW_ADMINS"),
      },
      {
        name: "Role & Permissions",
        path: "/admin/roles",
        icon: Shield,
        visible: hasPermission("VIEW_ADMIN_ROLES"),
      },
      {
        name: "Shop Management",
        path: "/admin/shops",
        icon: Store,
        visible: hasPermission("VIEW_SHOPS"),
      },
      {
        name: "Shop Categories",
        path: "/admin/categories",
        icon: Tags,
        visible: hasPermission("VIEW_CATEGORIES"),
      },
      {
        name: "Product Management",
        path: "/admin/products",
        icon: Package,
        visible: hasPermission("VIEW_PRODUCTS"),
      },
      {
        name: "Order Management",
        path: "/admin/orders",
        icon: ClipboardList,
        visible: hasPermission("VIEW_ORDERS"),
      },
    ],
  },

  {
    title: "Administration",
    items: [
      {
        name: "Activity Logs",
        path: "/admin/activity-logs",
        icon: Activity,
        visible: hasPermission("VIEW_ACTIVITY_LOGS"),
      },
    ],
  },
];

  // ==========================================
  // ROLE INFORMATION
  // ==========================================

  const roleLabel = isSuperAdmin
    ? "SUPER ADMINISTRATOR"
    : "ADMINISTRATOR";

  const initials = (user?.name || "Admin")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  // ==========================================
  // SIDEBAR
  // ==========================================

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50
        flex h-screen w-72 flex-col
        border-r border-slate-800
        bg-slate-950 text-white
        shadow-2xl shadow-slate-950/20
        transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      {/* BRAND HEADER */}

      <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/10 px-5">
        <Link
          to="/admin"
          onClick={onClose}
          className="group flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-600/20 transition group-hover:scale-105">
            <ShoppingBag size={23} className="text-white" />
          </div>

          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-white">
              Shop<span className="text-indigo-400">Ease</span>
            </h2>

            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[2px] text-slate-400">
              Administration
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      {/* ADMIN PROFILE */}

      <div className="shrink-0 px-4 py-5">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-sm font-bold text-white">
              {initials || "A"}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {user?.name || "Administrator"}
              </p>

              <p className="mt-1 truncate text-[11px] text-slate-400">
                {user?.email || "Administrator"}
              </p>
            </div>

            <div className="h-2 w-2 shrink-0 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
            <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-indigo-400">
              <ShieldCheck size={12} />
              {roleLabel}
            </p>

            {!isSuperAdmin && (
              <span className="rounded-md bg-white/[0.06] px-2 py-1 text-[10px] font-medium text-slate-400">
                {permissions.length} permissions
              </span>
            )}
          </div>

          {!isSuperAdmin && user?.adminRole?.name && (
            <p className="mt-2 text-xs text-slate-400">
              Assigned Role:{" "}
              <span className="font-semibold text-slate-200">
                {user.adminRole.name}
              </span>
            </p>
          )}

          {isSuperAdmin && (
            <p className="mt-2 text-xs font-semibold text-slate-300">
              Full system access
            </p>
          )}
        </div>
      </div>

      {/* NAVIGATION */}

      <nav className="min-h-0 flex-1 space-y-7 overflow-y-auto px-4 pb-5 [scrollbar-color:#475569_transparent] [scrollbar-width:thin]">
        {navigationGroups.map((group) => {
          const visibleItems = group.items.filter(
            (item) => item.visible
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title}>
              <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[1.8px] text-slate-500">
                {group.title}
              </p>

              <div className="space-y-1.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.end}
                      onClick={onClose}
                      className={({ isActive }) => `
                        group relative flex items-center gap-3
                        rounded-xl px-3 py-3
                        text-[13px] font-medium
                        transition-all duration-200
                        ${
                          isActive
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950/30"
                            : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                        }
                      `}
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={`
                              flex h-9 w-9 shrink-0 items-center justify-center
                              rounded-lg transition
                              ${
                                isActive
                                  ? "bg-white/15 text-white"
                                  : "bg-white/[0.04] text-slate-400 group-hover:bg-white/10 group-hover:text-white"
                              }
                            `}
                          >
                            <Icon size={18} />
                          </span>

                          <span className="flex-1">
                            {item.name}
                          </span>

                          {isActive && (
                            <ChevronRight
                              size={16}
                              className="text-white/80"
                            />
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* SIDEBAR FOOTER */}

      <div className="shrink-0 border-t border-white/10 bg-slate-950 px-4 py-5">
        <div className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-3 text-center">
          <p className="text-[10px] font-medium tracking-wide text-slate-500">
            ShopEase Administration
          </p>

          <p className="mt-1 text-[10px] text-slate-600">
            Management Dashboard
          </p>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
