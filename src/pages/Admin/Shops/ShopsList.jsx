
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Store,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Lock,
} from "lucide-react";

import { useAuth } from "../../../context/AuthContext";
import adminService from "../../../services/adminService";

// ==========================================
// SHOP STATUS FILTERS
// ==========================================

const statusFilters = [
  { label: "All Shops", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Deactivated", value: "DEACTIVATED" },
];

// ==========================================
// SHOP STATUS STYLES
// ==========================================

const statusStyles = {
  ACTIVE: "bg-green-100 text-green-700",
  DEACTIVATED: "bg-red-100 text-red-700",
};

const ShopsList = () => {
  const { user } = useAuth();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const permissions = user?.adminPermissions || [];

  const canViewShops =
    isSuperAdmin || permissions.includes("VIEW_SHOPS");

  // ==========================================
  // STATE
  // ==========================================

  const [shops, setShops] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const [loading, setLoading] = useState(canViewShops);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const limit = 10;

  // ==========================================
  // FETCH SHOPS
  // ==========================================

  useEffect(() => {
    let isActive = true;

    if (!canViewShops) {
      setLoading(false);
      setShops([]);
      return;
    }

    const fetchShops = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await adminService.getShops({
          page,
          limit,
          ...(search.trim() && {
            search: search.trim(),
          }),
          ...(status && { status }),
        });

        if (!isActive) return;

        setShops(response.shops || []);
        setPagination(response.pagination || null);
      } catch (err) {
        if (!isActive) return;

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load shops. Please try again."
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    const timeout = setTimeout(fetchShops, 300);

    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [page, search, status, refreshKey, canViewShops]);

  // ==========================================
  // FILTER HANDLERS
  // ==========================================

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    setPage(1);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  // ==========================================
  // RETRY
  // ==========================================

  const handleRetry = () => {
    setRefreshKey((current) => current + 1);
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString();
  };

  // ==========================================
  // ACCESS DENIED
  // ==========================================

  if (!canViewShops) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
            <Lock size={30} />
          </div>

          <h2 className="mt-5 text-xl font-bold text-gray-900">
            Access Denied
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            You do not have permission to view marketplace shops.
            Please contact your Super Admin if you need access.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Shop Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View and manage active and deactivated marketplace shops.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Store size={18} />
          <span>
            {pagination?.total ?? 0} Total Shops
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-lg">
        <Search
          size={19}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search shops, owners, phone, or category..."
          className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 overflow-x-auto border-b border-gray-200 pb-2">
        {statusFilters.map((filter) => (
          <button
            key={filter.value || "ALL"}
            type="button"
            onClick={() => handleStatusChange(filter.value)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
              status === filter.value
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={handleRetry}
            disabled={loading}
            className="flex items-center gap-2 text-sm font-semibold text-red-700 hover:text-red-900 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Retry
          </button>
        </div>
      )}

      {/* Shops Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-4 font-semibold">
                  Shop
                </th>

                <th className="px-5 py-4 font-semibold">
                  Owner
                </th>

                <th className="px-5 py-4 font-semibold">
                  Phone
                </th>

                <th className="px-5 py-4 font-semibold">
                  Status
                </th>

                <th className="px-5 py-4 font-semibold">
                  Registered Date
                </th>

                <th className="px-5 py-4 text-right font-semibold">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <RefreshCw
                        size={18}
                        className="animate-spin"
                      />
                      Loading shops...
                    </div>
                  </td>
                </tr>
              ) : shops.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center">
                    <Store
                      size={35}
                      className="mx-auto mb-3 text-gray-300"
                    />

                    <p className="font-medium text-gray-700">
                      No shops found
                    </p>

                    <p className="mt-1 text-gray-500">
                      Try changing your search or status filter.
                    </p>
                  </td>
                </tr>
              ) : (
                shops.map((shop) => (
                  <tr
                    key={shop.id}
                    className="transition hover:bg-gray-50"
                  >
                    {/* Shop */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-800">
                        {shop.name}
                      </div>

                      <div className="mt-1 text-xs text-gray-500">
                        {shop.shopCategory?.name || "Uncategorized"}
                      </div>
                    </td>

                    {/* Owner */}
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-700">
                        {shop.owner?.name || "Unknown"}
                      </div>

                      <div className="mt-1 text-xs text-gray-500">
                        {shop.owner?.email || "—"}
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-5 py-4 text-gray-600">
                      {shop.phone || "—"}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          statusStyles[shop.status] ||
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {shop.status === "ACTIVE"
                          ? "Active"
                          : shop.status === "DEACTIVATED"
                            ? "Deactivated"
                            : shop.status}
                      </span>
                    </td>

                    {/* Registered Date */}
                    <td className="px-5 py-4 text-gray-600">
                      {formatDate(shop.createdAt)}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/admin/shops/${shop.id}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50"
                      >
                        <Eye size={15} />
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && pagination && pagination.total > 0 && (
          <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              Showing page {pagination.page} of{" "}
              {pagination.totalPages} ({pagination.total} shops)
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!pagination.hasPreviousPage}
                onClick={() => setPage((current) => current - 1)}
                className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={17} />
                Previous
              </button>

              <button
                type="button"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((current) => current + 1)}
                className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopsList;
