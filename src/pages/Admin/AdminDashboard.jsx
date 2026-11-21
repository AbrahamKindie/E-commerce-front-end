
import { useEffect, useState } from "react";
import {
  Store,
  ArrowRight,
  ShieldCheck,
  Users,
  Package,
  ShoppingCart,
  CheckCircle,
  XCircle,
  RefreshCw,
  Activity,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import adminService from "../../services/adminService";

// ==========================================
// HELPERS
// ==========================================

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleString();
};

const formatAction = (action) => {
  if (!action) return "Unknown activity";

  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

// ==========================================
// STAT CARD
// ==========================================

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-gray-500">
          {title}
        </p>

        <p className="mt-2 text-2xl font-bold text-gray-900">
          {value ?? 0}
        </p>
      </div>

      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${color}`}
      >
        <Icon size={24} />
      </div>
    </div>
  </div>
);

// ==========================================
// RECENT ACTIVITY TABLE
// ==========================================

const RecentActivityTable = ({ activities }) => (
  <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
          <Activity size={20} />
        </div>

        <div>
          <h3 className="font-semibold text-gray-800">
            Recent Admin Activity
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Latest recorded administrator actions.
          </p>
        </div>
      </div>

      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
        {activities.length} Recent Records
      </span>
    </div>

    {activities.length > 0 ? (
      <>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Administrator
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Action
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Target Type
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Target ID
                </th>

                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Date & Time
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {activities.map((activity) => (
                <tr
                  key={activity.id}
                  className="transition hover:bg-gray-50"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-700">
                        {(activity.actor?.name || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {activity.actor?.name || "Unknown Admin"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      {formatAction(activity.action)}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-600">
                    {activity.targetType || "—"}
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-500">
                    {activity.targetId || "—"}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                    {formatDate(activity.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end border-t border-gray-100 px-5 py-4">
          <a
            href="/admin/activity-logs"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition hover:text-indigo-800"
          >
            View All Activity Logs
            <ArrowRight size={16} />
          </a>
        </div>
      </>
    ) : (
      <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <Activity size={23} />
        </div>

        <p className="mt-3 text-sm font-semibold text-gray-700">
          No Recent Activity
        </p>

        <p className="mt-1 text-sm text-gray-500">
          Administrator activities will appear here when recorded.
        </p>
      </div>
    )}
  </section>
);

// ==========================================
// ADMIN DASHBOARD
// ==========================================

const AdminDashboard = () => {
  const { user } = useAuth();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const permissions = user?.adminPermissions || [];

  // ==========================================
  // PERMISSION CHECKS
  // ==========================================

  const hasPermission = (permission) =>
    isSuperAdmin || permissions.includes(permission);

  const canViewReports = hasPermission("VIEW_REPORTS");
  const canViewUsers = hasPermission("VIEW_USERS");
  const canViewShops = hasPermission("VIEW_SHOPS");
  const canViewProducts = hasPermission("VIEW_PRODUCTS");
  const canViewOrders = hasPermission("VIEW_ORDERS");

  // ==========================================
  // STATE
  // ==========================================

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(canViewReports);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // ==========================================
  // FETCH DASHBOARD STATISTICS
  // ==========================================

  useEffect(() => {
    let isActive = true;

    if (!canViewReports) {
      setStats(null);
      setLoading(false);
      setError("");
      return;
    }

    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await adminService.getDashboardStats();

        if (!isActive) return;

        setStats(response.data);
      } catch (err) {
        if (!isActive) return;

        setError(
          err.response?.data?.message ||
            "Unable to load dashboard statistics."
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchDashboardStats();

    return () => {
      isActive = false;
    };
  }, [canViewReports, refreshKey]);

  // ==========================================
  // MAIN STATISTICS
  // ==========================================

  const mainStatistics = [
    ...(canViewUsers
      ? [
          {
            title: "Customer Accounts",
            value: stats?.users?.total,
            icon: Users,
            color: "bg-blue-100 text-blue-700",
          },
        ]
      : []),

    ...(canViewProducts
      ? [
          {
            title: "Total Products",
            value: stats?.products?.total,
            icon: Package,
            color: "bg-orange-100 text-orange-700",
          },
        ]
      : []),

    ...(canViewOrders
      ? [
          {
            title: "Total Orders",
            value: stats?.orders?.total,
            icon: ShoppingCart,
            color: "bg-green-100 text-green-700",
          },
        ]
      : []),
  ];

  // ==========================================
  // SHOP STATISTICS
  // ==========================================

  const shopStatistics = [
    {
      title: "Total Shops",
      value: stats?.shops?.total,
      icon: Store,
      color: "bg-indigo-100 text-indigo-700",
    },
    {
      title: "Active Shops",
      value: stats?.shops?.active,
      icon: CheckCircle,
      color: "bg-green-100 text-green-700",
    },
    {
      title: "Deactivated Shops",
      value: stats?.shops?.deactivated,
      icon: XCircle,
      color: "bg-red-100 text-red-700",
    },
    {
      title: "Total Shop Owners",
      value: stats?.shops?.shopOwners,
      icon: Users,
      color: "bg-purple-100 text-purple-700",
    },
  ];

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="space-y-8">
      {/* WELCOME SECTION */}

      <section className="rounded-2xl bg-gradient-to-r from-indigo-700 to-indigo-500 p-6 text-white shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <ShieldCheck size={32} />

          <div>
            <h1 className="text-2xl font-bold">
              Welcome, {user?.name || "Administrator"}!
            </h1>

            <p className="mt-1 text-sm text-indigo-100">
              Manage and monitor your ShopEase marketplace.
            </p>
          </div>
        </div>
      </section>

      {/* DASHBOARD STATISTICS */}

      {canViewReports && (
        <section>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Marketplace Overview
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Statistics available according to your assigned permissions.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setRefreshKey((current) => current + 1)}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {/* ERROR */}

          {error && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>

              <button
                type="button"
                onClick={() => setRefreshKey((current) => current + 1)}
                className="text-sm font-semibold text-red-700 hover:text-red-900"
              >
                Try Again
              </button>
            </div>
          )}

          {/* LOADING */}

          {loading ? (
            <div className="flex min-h-40 items-center justify-center rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center gap-2 text-gray-500">
                <RefreshCw size={20} className="animate-spin" />
                Loading dashboard statistics...
              </div>
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* MAIN STATISTICS */}

              {mainStatistics.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {mainStatistics.map((item) => (
                    <StatCard key={item.title} {...item} />
                  ))}
                </div>
              )}

              {/* SHOP STATISTICS */}

              {canViewShops && (
                <div>
                  <h3 className="mb-4 text-base font-semibold text-gray-800">
                    Shop Statistics
                  </h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {shopStatistics.map((item) => (
                      <StatCard key={item.title} {...item} />
                    ))}
                  </div>
                </div>
              )}

              {/* RECENT ADMIN ACTIVITY TABLE */}

              {isSuperAdmin && (
                <RecentActivityTable
                  activities={stats.recentActivity || []}
                />
              )}

              {/* NO AVAILABLE STATISTICS */}

              {mainStatistics.length === 0 &&
                !canViewShops &&
                !isSuperAdmin && (
                  <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
                    <p className="text-sm text-gray-500">
                      No additional statistics are available for your assigned permissions.
                    </p>
                  </div>
                )}
            </div>
          ) : (
            !error && (
              <p className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
                Dashboard statistics are currently unavailable.
              </p>
            )
          )}
        </section>
      )}

      {/* NO REPORTS PERMISSION */}

      {!canViewReports && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 text-center">
          <ShieldCheck
            size={32}
            className="mx-auto text-gray-400"
          />

          <h2 className="mt-3 font-semibold text-gray-800">
            Dashboard Statistics Unavailable
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            You do not have permission to view marketplace reports.
            Contact your Super Admin if you need access.
          </p>
        </section>
      )}
    </div>
  );
};

export default AdminDashboard;
