
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  UserRound,
  Clock,
  X,
  Eye,
} from "lucide-react";

import adminService from "../../../services/adminService";

const PAGE_LIMIT = 20;

const EMPTY_PAGINATION = {
  total: 0,
  page: 1,
  limit: PAGE_LIMIT,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

const EMPTY_FILTERS = {
  actorId: "",
  action: "",
  targetType: "",
  startDate: "",
  endDate: "",
};

const formatAction = (action) => {
  if (!action) return "Unknown Action";

  return action
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleString();
};

const parseDetails = (details) => {
  if (!details) return {};

  if (typeof details === "object") {
    return details;
  }

  if (typeof details === "string") {
    try {
      return JSON.parse(details);
    } catch {
      return {};
    }
  }

  return {};
};

const normalizeActor = (log) => {
  const details = parseDetails(log.details);
  const snapshot = details.actorSnapshot || {};

  return {
    name: log.actor?.name || snapshot.name || "Deleted Admin",
    email:
      log.actor?.email ||
      snapshot.email ||
      "Account unavailable",
    role: log.actor?.role || snapshot.role || "Former Admin",
  };
};

const normalizeResponse = (response) => {
  const result = response?.data ?? response;

  return {
    logs: Array.isArray(result?.logs)
      ? result.logs
      : [],
    pagination: {
      ...EMPTY_PAGINATION,
      ...(result?.pagination || {}),
    },
  };
};

const ActivityLogs = () => {
  const navigate = useNavigate();

  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(
    async ({ showLoader = true } = {}) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        setErrorMessage("");

        const response = await adminService.getActivityLogs({
          page,
          limit: PAGE_LIMIT,
          ...appliedFilters,
        });

        const result = normalizeResponse(response);

        setLogs(result.logs);
        setPagination(result.pagination);
      } catch (error) {
        setErrorMessage(
          error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            "Failed to load activity logs."
        );
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [page, appliedFilters]
  );

  useEffect(() => {
    let cancelled = false;

    const loadLogs = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await adminService.getActivityLogs({
          page,
          limit: PAGE_LIMIT,
          ...appliedFilters,
        });

        if (cancelled) return;

        const result = normalizeResponse(response);

        setLogs(result.logs);
        setPagination(result.pagination);
      } catch (error) {
        if (cancelled) return;

        setErrorMessage(
          error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            "Failed to load activity logs."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadLogs();

    return () => {
      cancelled = true;
    };
  }, [page, appliedFilters]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLogs({ showLoader: false });
    setRefreshing(false);
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleApplyFilters = (event) => {
    event.preventDefault();

    if (
      filters.startDate &&
      filters.endDate &&
      filters.startDate > filters.endDate
    ) {
      setErrorMessage("Start date cannot be after end date.");
      return;
    }

    const nextFilters = {};

    if (filters.actorId.trim()) {
      nextFilters.actorId = filters.actorId.trim();
    }

    if (filters.action.trim()) {
      nextFilters.action = filters.action.trim();
    }

    if (filters.targetType.trim()) {
      nextFilters.targetType = filters.targetType.trim();
    }

    if (filters.startDate) {
      nextFilters.startDate = new Date(
        `${filters.startDate}T00:00:00`
      ).toISOString();
    }

    if (filters.endDate) {
      nextFilters.endDate = new Date(
        `${filters.endDate}T23:59:59.999`
      ).toISOString();
    }

    setErrorMessage("");
    setPage(1);
    setAppliedFilters(nextFilters);
  };

  const handleResetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters({});
    setPage(1);
    setErrorMessage("");
  };

  const openDetails = (logId) => {
    navigate(`/admin/activity-logs/${logId}`);
  };

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-7 w-7 text-indigo-600" />

            <h1 className="text-2xl font-bold text-gray-900">
              Admin Activity Logs
            </h1>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Monitor administrator actions and review historical activity.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh Logs
        </button>
      </div>

      {/* ERROR */}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <span className="flex-1">{errorMessage}</span>

          <button
            type="button"
            onClick={() => setErrorMessage("")}
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* SUMMARY */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-50 p-3 text-indigo-600">
            <Activity size={23} />
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Total Recorded Activities
            </p>

            <h2 className="text-2xl font-bold text-gray-900">
              {pagination.total}
            </h2>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Search size={19} className="text-gray-500" />

          <h2 className="font-semibold text-gray-900">
            Filter Activity Logs
          </h2>
        </div>

        <form onSubmit={handleApplyFilters}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Admin ID
              </label>

              <input
                type="number"
                min="1"
                name="actorId"
                value={filters.actorId}
                onChange={handleFilterChange}
                placeholder="Enter Admin ID"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Action
              </label>

              <input
                type="text"
                name="action"
                value={filters.action}
                onChange={handleFilterChange}
                placeholder="e.g. CREATE_ADMIN"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Target Type
              </label>

              <input
                type="text"
                name="targetType"
                value={filters.targetType}
                onChange={handleFilterChange}
                placeholder="e.g. USER, SHOP, ADMIN"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Start Date
              </label>

              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                End Date
              </label>

              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              <Search size={16} />
              Apply Filters
            </button>

            <button
              type="button"
              onClick={handleResetFilters}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Reset Filters
            </button>
          </div>
        </form>
      </div>

      {/* ACTIVITY TABLE */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">
            Activity History
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Latest administrator activities appear first.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <RefreshCw className="h-7 w-7 animate-spin text-indigo-600" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <Activity className="mx-auto h-12 w-12 text-gray-300" />

            <h3 className="mt-3 font-medium text-gray-800">
              No Activity Logs Found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              No records match the selected filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">
                    Administrator
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Action
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Target
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Date & Time
                  </th>

                  <th className="px-5 py-4 text-right font-semibold">
                    Details
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => {
                  const actor = normalizeActor(log);

                  return (
                    <tr
                      key={log.id}
                      className="transition hover:bg-gray-50"
                    >
                      {/* ADMINISTRATOR */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                            <UserRound size={19} />
                          </div>

                          <div>
                            <p className="font-semibold text-gray-900">
                              {actor.name}
                            </p>

                            <p className="text-xs text-gray-500">
                              {actor.email}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              {actor.role}
                              {log.actorId
                                ? ` · ID: ${log.actorId}`
                                : " · Historical account"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* ACTION */}
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-md bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700">
                          {formatAction(log.action)}
                        </span>
                      </td>

                      {/* TARGET */}
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-800">
                          {log.targetType || "—"}
                        </p>

                        {log.targetId != null && (
                          <p className="mt-1 text-xs text-gray-400">
                            ID: {log.targetId}
                          </p>
                        )}
                      </td>

                      {/* DATE */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock
                            size={15}
                            className="text-gray-400"
                          />

                          <span>{formatDate(log.createdAt)}</span>
                        </div>
                      </td>

                      {/* DETAILS */}
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openDetails(log.id)}
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          <Eye size={15} />
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        {!loading && logs.length > 0 && (
          <div className="flex flex-col justify-between gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center">
            <p className="text-xs text-gray-500">
              Page {pagination.page} of {pagination.totalPages} ·{" "}
              {pagination.total} total records
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setPage((previous) => Math.max(1, previous - 1))
                }
                disabled={!pagination.hasPreviousPage || loading}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <button
                type="button"
                onClick={() =>
                  setPage((previous) => previous + 1)
                }
                disabled={!pagination.hasNextPage || loading}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;
