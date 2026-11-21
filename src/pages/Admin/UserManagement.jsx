
import { useState } from "react";
import { Users, ShieldCheck, Lock } from "lucide-react";

import { useAuth } from "../../context/AuthContext";

import UsersList from "./Users/UserLists";
import AdminsList from "./Admins/AdminsList";

const UserManagement = () => {
  const { user } = useAuth();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const permissions = user?.adminPermissions || [];

  // ==========================================
  // ACCESS PERMISSIONS
  // ==========================================

  const canViewUsers =
    isSuperAdmin || permissions.includes("VIEW_USERS");

  const canViewAdmins =
    isSuperAdmin || permissions.includes("VIEW_ADMINS");

  const canAccessUserManagement =
    canViewUsers || canViewAdmins;

  // ==========================================
  // ACTIVE TAB
  // ==========================================

  const [activeTab, setActiveTab] = useState(() =>
    canViewUsers ? "users" : "admins"
  );

  const currentTab =
    activeTab === "users" && canViewUsers
      ? "users"
      : canViewAdmins
        ? "admins"
        : "users";

  // ==========================================
  // ACCESS DENIED
  // ==========================================

  if (!canAccessUserManagement) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <Lock size={30} className="mx-auto text-red-500" />

          <h2 className="mt-4 text-xl font-bold text-gray-900">
            Access Denied
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            You do not have permission to access User Management.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN PAGE
  // ==========================================

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          User Management
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage marketplace users and administrator accounts.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {/* Users Tab */}
          {canViewUsers && (
            <button
              type="button"
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 border-b-2 px-2 pb-3 text-sm font-semibold transition ${
                currentTab === "users"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <Users size={18} />
              Users
            </button>
          )}

          {/* Admins Tab */}
          {canViewAdmins && (
            <button
              type="button"
              onClick={() => setActiveTab("admins")}
              className={`flex items-center gap-2 border-b-2 px-2 pb-3 text-sm font-semibold transition ${
                currentTab === "admins"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <ShieldCheck size={18} />
              Admins
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {currentTab === "users" && canViewUsers && (
          <UsersList />
        )}

        {currentTab === "admins" && canViewAdmins && (
          <AdminsList />
        )}
      </div>
    </div>
  );
};

export default UserManagement;
