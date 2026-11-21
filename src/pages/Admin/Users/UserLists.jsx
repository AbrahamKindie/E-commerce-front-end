
import { useEffect, useState } from "react";
import {
  Search,
  Users,
  UserRound,
  Store,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X,
  Lock,
} from "lucide-react";

import { useAuth } from "../../../context/AuthContext";
import adminService from "../../../services/adminService";

const roleStyles = {
  USER: "bg-blue-100 text-blue-700",
  SHOP_OWNER: "bg-purple-100 text-purple-700",
};

const UsersList = () => {
  const { user: currentUser } = useAuth();

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const permissions = currentUser?.adminPermissions || [];

  // Granular permissions
  const canViewUsers =
    isSuperAdmin || permissions.includes("VIEW_USERS");

  const canActivateUsers =
    isSuperAdmin || permissions.includes("ACTIVATE_USERS");

  const canDeactivateUsers =
    isSuperAdmin || permissions.includes("DEACTIVATE_USERS");

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const [loading, setLoading] = useState(canViewUsers);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Confirmation modal state
  const [selectedUser, setSelectedUser] = useState(null);

  const limit = 10;

  useEffect(() => {
    let isActive = true;

    if (!canViewUsers) {
      setLoading(false);
      setUsers([]);
      return;
    }

    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await adminService.getUsers({
          page,
          limit,
          ...(search.trim() && { search: search.trim() }),
          ...(role && { role }),
          ...(status && { isActive: status }),
        });

        if (!isActive) return;

        setUsers(response.users || []);
        setPagination(response.pagination || null);
      } catch (err) {
        if (!isActive) return;

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load marketplace users. Please try again."
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    const timeout = setTimeout(fetchUsers, 300);

    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [page, search, role, status, refreshKey, canViewUsers]);

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
    setSuccess("");
    setActionError("");
  };

  const handleRoleChange = (value) => {
    setRole(value);
    setPage(1);
    setSuccess("");
    setActionError("");
  };

  const handleStatusChange = (value) => {
    setStatus(value);
    setPage(1);
    setSuccess("");
    setActionError("");
  };

  // Check whether the current Admin can change this user's status
  const canChangeUserStatus = (user) => {
    return user.isActive ? canDeactivateUsers : canActivateUsers;
  };

  // Open confirmation popup
  const openStatusModal = (user) => {
    if (!canChangeUserStatus(user)) return;

    setSelectedUser(user);
    setActionError("");
    setSuccess("");
  };

  // Close confirmation popup
  const closeStatusModal = () => {
    if (updatingUserId !== null) return;
    setSelectedUser(null);
    setActionError("");
  };

  // Confirm and update user status
  const handleUserStatusChange = async () => {
    if (!selectedUser) return;

    const user = selectedUser;
    const nextStatus = !user.isActive;

    // Additional frontend permission check
    if (nextStatus && !canActivateUsers) {
      setActionError("You do not have permission to activate users.");
      return;
    }

    if (!nextStatus && !canDeactivateUsers) {
      setActionError("You do not have permission to deactivate users.");
      return;
    }

    try {
      setUpdatingUserId(user.id);
      setActionError("");
      setSuccess("");

      const response = await adminService.updateUserStatus(
        user.id,
        nextStatus
      );

      setSuccess(
        response.message ||
          `User account ${nextStatus ? "activated" : "deactivated"} successfully.`
      );

      setSelectedUser(null);
      setRefreshKey((current) => current + 1);
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          err.message ||
          "Unable to update user status. Please try again."
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRetry = () => {
    setRefreshKey((current) => current + 1);
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString();
  };

  const isActivating = selectedUser ? !selectedUser.isActive : false;

  // Access denied
  if (!canViewUsers) {
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
            You do not have permission to view marketplace users.
            Please contact your Super Admin if you need access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              User Management
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              View and manage customer and Shop Owner accounts.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users size={19} />
            <span>{pagination?.total ?? 0} Total Users</span>
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
            placeholder="Search by name, email, or phone..."
            className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { label: "All Users", value: "" },
              { label: "Customers", value: "USER" },
              { label: "Shop Owners", value: "SHOP_OWNER" },
            ].map((filter) => (
              <button
                key={filter.value || "ALL"}
                type="button"
                onClick={() => handleRoleChange(filter.value)}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                  role === filter.value
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-600 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">All Account Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {/* Feedback */}
        {error && (
          <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-red-700">{error}</p>

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

        {actionError && !selectedUser && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {actionError}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Users Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">User</th>
                  <th className="px-5 py-4 font-semibold">Phone</th>
                  <th className="px-5 py-4 font-semibold">Role</th>
                  <th className="px-5 py-4 font-semibold">Shop</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Joined Date</th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-12 text-center">
                      <div className="flex items-center justify-center gap-2 text-gray-500">
                        <RefreshCw size={18} className="animate-spin" />
                        Loading users...
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-12 text-center">
                      <Users
                        size={35}
                        className="mx-auto mb-3 text-gray-300"
                      />

                      <p className="font-medium text-gray-700">
                        No users found
                      </p>

                      <p className="mt-1 text-gray-500">
                        Try changing your search or filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {user.profileImage ? (
                            <img
                              src={user.profileImage}
                              alt={user.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                              <UserRound size={19} />
                            </div>
                          )}

                          <div>
                            <p className="font-semibold text-gray-800">
                              {user.name}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {user.email}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              ID: {user.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {user.phone || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            roleStyles[user.role] ||
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {user.role === "SHOP_OWNER"
                            ? "Shop Owner"
                            : "Customer"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {user.role === "SHOP_OWNER" && user.shop ? (
                          <div>
                            <div className="flex items-center gap-2 font-medium text-gray-700">
                              <Store size={15} />
                              {user.shop.name}
                            </div>

                            <p className="mt-1 text-xs text-gray-500">
                              {user.shop.status || "—"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                            user.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {user.isActive ? (
                            <CheckCircle size={13} />
                          ) : (
                            <XCircle size={13} />
                          )}
                          {user.isActive ? "Active" : "Inactive"}
                        </span>

                        {!user.isVerified && (
                          <p className="mt-1 text-xs text-yellow-600">
                            Not verified
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {formatDate(user.createdAt)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {canChangeUserStatus(user) ? (
                          <button
                            type="button"
                            onClick={() => openStatusModal(user)}
                            disabled={updatingUserId === user.id}
                            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              user.isActive
                                ? "border-red-200 text-red-600 hover:bg-red-50"
                                : "border-green-200 text-green-700 hover:bg-green-50"
                            }`}
                          >
                            {user.isActive ? (
                              <XCircle size={14} />
                            ) : (
                              <ShieldCheck size={14} />
                            )}

                            {user.isActive ? "Deactivate" : "Activate"}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">
                            No permission
                          </span>
                        )}
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
                Showing page {pagination.page} of {pagination.totalPages} (
                {pagination.total} users)
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

      {/* Activate / Deactivate Confirmation Modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={closeStatusModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-status-modal-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  isActivating
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {isActivating ? (
                  <ShieldCheck size={24} />
                ) : (
                  <AlertTriangle size={24} />
                )}
              </div>

              <button
                type="button"
                onClick={closeStatusModal}
                disabled={updatingUserId !== null}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <h2
              id="user-status-modal-title"
              className="mt-4 text-xl font-bold text-gray-900"
            >
              {isActivating
                ? "Activate User Account?"
                : "Deactivate User Account?"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Are you sure you want to{" "}
              <strong
                className={
                  isActivating ? "text-green-700" : "text-red-700"
                }
              >
                {isActivating ? "activate" : "deactivate"}
              </strong>{" "}
              <strong>{selectedUser.name}</strong>'s account?
            </p>

            <div
              className={`mt-4 rounded-lg p-3 text-sm ${
                isActivating
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-800"
              }`}
            >
              {isActivating
                ? "This user will regain access to their account."
                : "This user may lose access to their account and marketplace activities."}
            </div>

            {actionError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {actionError}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeStatusModal}
                disabled={updatingUserId !== null}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleUserStatusChange}
                disabled={updatingUserId !== null}
                className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  isActivating
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {updatingUserId !== null ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Updating...
                  </>
                ) : isActivating ? (
                  "Yes, Activate"
                ) : (
                  "Yes, Deactivate"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UsersList;
