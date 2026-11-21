
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  X,
  Lock,
  Shield,
  Mail,
  User,
  ArrowRightLeft,
  BriefcaseBusiness,
} from "lucide-react";

import adminService from "../../../services/adminService";
import adminRolesService from "../../../services/adminRolesService";
import { useAuth } from "../../../context/AuthContext";

// ==========================================
// HELPERS
// ==========================================

const getErrorMessage = (error) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  error.message ||
  "Something went wrong. Please try again.";

const getDateInputValue = (date) => {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  return [
    parsedDate.getFullYear(),
    String(parsedDate.getMonth() + 1).padStart(2, "0"),
    String(parsedDate.getDate()).padStart(2, "0"),
  ].join("-");
};

const getResponseRoles = (response) => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.roles)) return response.roles;
  if (Array.isArray(response?.data?.roles)) return response.data.roles;
  return [];
};

const getResponseAdmins = (response) => {
  if (Array.isArray(response?.admins)) return response.admins;
  if (Array.isArray(response?.data?.admins)) return response.data.admins;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const AdminsList = () => {
  const { user } = useAuth();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const currentUserId = user?.id ?? user?.userId;

  const currentPermissions = user?.adminPermissions || [];

  // ==========================================
  // ADMIN ACCOUNT PERMISSIONS
  // ==========================================

  const canViewAdmins =
    isSuperAdmin || currentPermissions.includes("VIEW_ADMINS");

  const canCreateAdmins =
    isSuperAdmin || currentPermissions.includes("CREATE_ADMINS");

  const canUpdateAdmins =
    isSuperAdmin || currentPermissions.includes("UPDATE_ADMINS");

  const canActivateAdmins =
    isSuperAdmin || currentPermissions.includes("ACTIVATE_ADMINS");

  const canDeactivateAdmins =
    isSuperAdmin || currentPermissions.includes("DEACTIVATE_ADMINS");

  const canDeleteAdmins =
    isSuperAdmin || currentPermissions.includes("DELETE_ADMINS");

  const canResendSetupEmail =
    isSuperAdmin ||
    currentPermissions.includes("RESEND_ADMIN_SETUP_EMAIL");

  // ==========================================
  // ADMIN ROLE PERMISSIONS
  // ==========================================

  const canViewAdminRoles =
    isSuperAdmin || currentPermissions.includes("VIEW_ADMIN_ROLES");

  const canAssignAdminRoles =
    isSuperAdmin || currentPermissions.includes("ASSIGN_ADMIN_ROLES");

  // Viewing roles is required by the backend role-list endpoint.
  const canLoadRoles = canViewAdminRoles;

  // ==========================================
  // STATE
  // ==========================================

  const [admins, setAdmins] = useState([]);
  const [roles, setRoles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  const [confirmationAction, setConfirmationAction] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    adminRoleId: "",
  });

  const [selectedRoleId, setSelectedRoleId] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [resendingAdminId, setResendingAdminId] = useState(null);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // ==========================================
  // ADMIN ACCESS HELPERS
  // ==========================================

  const isOwnAccount = (admin) =>
    currentUserId != null &&
    String(admin.id) === String(currentUserId);

  const canEditProfile = (admin) =>
    canUpdateAdmins && admin?.role === "ADMIN" && !isOwnAccount(admin);

  const canChangeRole = (admin) =>
    canAssignAdminRoles &&
    canViewAdminRoles &&
    admin?.role === "ADMIN" &&
    !isOwnAccount(admin);

  const canChangeStatus = (admin) =>
    !isOwnAccount(admin) &&
    (admin.isActive ? canDeactivateAdmins : canActivateAdmins);

  const canDeleteAdmin = (admin) =>
    canDeleteAdmins && !isOwnAccount(admin);

  // ==========================================
  // ROLE ASSIGNMENT AUTHORITY
  // ADMINS CANNOT GRANT PERMISSIONS
  // THEY DO NOT PERSONALLY POSSESS
  // ==========================================

  const canUseRole = (role) => {
    if (!role?.isActive) return false;
    if (isSuperAdmin) return true;

    const rolePermissions = role.permissions || [];

    return rolePermissions.every((permission) =>
      currentPermissions.includes(permission)
    );
  };

  const assignableRoles = useMemo(
    () => roles.filter(canUseRole),
    [roles, isSuperAdmin, currentPermissions]
  );

  const activeRoles = useMemo(
    () => roles.filter((role) => role.isActive),
    [roles]
  );

  // ==========================================
  // FETCH ADMINS
  // ==========================================

  const fetchAdmins = async (isRefresh = false) => {
    if (!canViewAdmins) {
      setLoading(false);
      setRefreshing(false);
      setErrorMessage(
        "You do not have permission to view Admin accounts."
      );
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await adminService.getAdmins();

      setAdmins(getResponseAdmins(response));
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ==========================================
  // FETCH ADMIN ROLES
  // VIEW_ADMIN_ROLES REQUIRED BY BACKEND
  // ==========================================

  const fetchRoles = async () => {
    if (!canLoadRoles) {
      setRoles([]);
      return;
    }

    try {
      setRolesLoading(true);

      const response = await adminRolesService.getAdminRoles();

      setRoles(getResponseRoles(response));
    } catch (error) {
      setRoles([]);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => {
    if (canViewAdmins) {
      fetchAdmins();
    } else {
      setLoading(false);
    }
  }, [canViewAdmins]);

  useEffect(() => {
    if (canLoadRoles) {
      fetchRoles();
    } else {
      setRoles([]);
    }
  }, [canLoadRoles]);

  // ==========================================
  // RESET MESSAGES
  // ==========================================

  const clearMessages = () => {
    setSuccessMessage("");
    setErrorMessage("");
  };

  // ==========================================
  // RESET FORM
  // ==========================================

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      gender: "",
      adminRoleId: "",
    });
  };

  // ==========================================
  // OPEN CREATE MODAL
  // ==========================================

  const openCreateModal = () => {
    if (!canCreateAdmins) return;

    clearMessages();
    resetForm();

    setModalMode("create");
    setSelectedAdmin(null);
    setShowModal(true);
  };

  // ==========================================
  // OPEN PROFILE EDIT MODAL
  // ==========================================

  const openProfileModal = (admin) => {
    if (!canEditProfile(admin)) return;

    clearMessages();

    setModalMode("profile");
    setSelectedAdmin(admin);

    setFormData({
      name: admin.name || "",
      email: admin.email || "",
      phone: admin.phone || "",
      dateOfBirth: getDateInputValue(admin.dateOfBirth),
      gender: admin.gender || "",
      adminRoleId: "",
    });

    setShowModal(true);
  };

  // ==========================================
  // OPEN ROLE ASSIGNMENT MODAL
  // ==========================================

  const openRoleModal = (admin) => {
    if (!canChangeRole(admin)) return;

    clearMessages();

    setSelectedAdmin(admin);
    setSelectedRoleId(String(admin.adminRoleId ?? admin.adminRole?.id ?? ""));
    setModalMode("role");
    setShowModal(true);
  };

  // ==========================================
  // CLOSE MODAL
  // ==========================================

  const closeModal = () => {
    if (submitting) return;

    setShowModal(false);
    setSelectedAdmin(null);
    setSelectedRoleId("");
    setErrorMessage("");
  };

  // ==========================================
  // FORM INPUT HANDLER
  // ==========================================

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================
  // VALIDATE ADMIN FORM
  // ==========================================

  const validateAdminForm = () => {
    if (formData.name.trim().length < 2) {
      setErrorMessage(
        "Admin name must contain at least 2 characters."
      );
      return false;
    }

    if (!formData.email.trim()) {
      setErrorMessage("Admin email is required.");
      return false;
    }

    return true;
  };

  // ==========================================
  // CREATE ADMIN
  // ROLE IS REQUIRED
  // ==========================================

  const handleCreateAdmin = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!canCreateAdmins) {
      setErrorMessage(
        "You do not have permission to create Admins."
      );
      return;
    }

    if (!validateAdminForm()) return;

    if (!formData.adminRoleId) {
      setErrorMessage("Please select an Admin Role.");
      return;
    }

    const selectedRole = roles.find(
      (role) => String(role.id) === String(formData.adminRoleId)
    );

    if (!selectedRole || !canUseRole(selectedRole)) {
      setErrorMessage(
        "Please select an active role that you are authorized to assign."
      );
      return;
    }

    try {
      setSubmitting(true);

      const adminData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        adminRoleId: Number(formData.adminRoleId),
      };

      if (formData.phone.trim()) {
        adminData.phone = formData.phone.trim();
      }

      if (formData.dateOfBirth) {
        adminData.dateOfBirth = formData.dateOfBirth;
      }

      if (formData.gender) {
        adminData.gender = formData.gender;
      }

      const response = await adminService.createAdmin(adminData);

      setShowModal(false);
      resetForm();

      if (response.setupEmailSent === false) {
        setErrorMessage(
          response.message ||
            "Admin account was created, but the password setup email could not be sent. You can resend it from the Admin list."
        );
      } else {
        setSuccessMessage(
          response.message ||
            "Admin account created. A password setup email has been sent."
        );
      }

      await fetchAdmins(true);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // UPDATE ADMIN PROFILE
  // ==========================================

  const handleUpdateAdminProfile = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!selectedAdmin || !canEditProfile(selectedAdmin)) {
      setErrorMessage(
        "You do not have permission to update this Admin."
      );
      return;
    }

    if (!validateAdminForm()) return;

    try {
      setSubmitting(true);

      const adminData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,
        dateOfBirth: formData.dateOfBirth || null,
        gender: formData.gender || null,
      };

      const response = await adminService.updateAdmin(
        selectedAdmin.id,
        adminData
      );

      setShowModal(false);
      setSuccessMessage(
        response.message || "Admin profile updated successfully."
      );

      await fetchAdmins(true);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // ASSIGN ADMIN ROLE
  // PATCH /admin/:adminId/role
  // BODY: { adminRoleId }
  // ==========================================

  const handleAssignAdminRole = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!selectedAdmin || !canChangeRole(selectedAdmin)) {
      setErrorMessage(
        "You do not have permission to assign this Admin's role."
      );
      return;
    }

    if (!selectedRoleId) {
      setErrorMessage("Please select an Admin Role.");
      return;
    }

    const selectedRole = roles.find(
      (role) => String(role.id) === String(selectedRoleId)
    );

    if (!selectedRole || !canUseRole(selectedRole)) {
      setErrorMessage(
        "You can only assign an active role whose permissions you possess."
      );
      return;
    }

    const currentRoleId = String(
      selectedAdmin.adminRoleId ?? selectedAdmin.adminRole?.id ?? ""
    );

    if (currentRoleId === String(selectedRoleId)) {
      setErrorMessage(
        "This Admin is already assigned to the selected role."
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await adminRolesService.assignAdminRole(
        selectedAdmin.id,
        Number(selectedRoleId)
      );

      setShowModal(false);
      setSelectedAdmin(null);
      setSelectedRoleId("");

      setSuccessMessage(
        response.message || "Admin role assigned successfully."
      );

      await Promise.all([fetchAdmins(true), fetchRoles()]);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // RESEND ADMIN PASSWORD SETUP EMAIL
  // ==========================================

  const handleResendSetupEmail = async (admin) => {
    if (!canResendSetupEmail) return;

    if (
      !admin.isActive ||
      admin.adminPasswordSetupCompleted !== false
    ) {
      return;
    }

    clearMessages();

    try {
      setResendingAdminId(admin.id);

      const response =
        await adminService.resendAdminPasswordSetupEmail(admin.id);

      if (!response.setupEmailSent) {
        setErrorMessage(
          response.message ||
            "The password setup email could not be sent. Please try again."
        );
        return;
      }

      setSuccessMessage(
        response.message || "Password setup email sent successfully."
      );

      await fetchAdmins(true);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setResendingAdminId(null);
    }
  };

  // ==========================================
  // OPEN CONFIRMATION MODAL
  // ==========================================

  const openConfirmationModal = (admin, action) => {
    if (action === "activate" && !canActivateAdmins) return;
    if (action === "deactivate" && !canDeactivateAdmins) return;
    if (action === "delete" && !canDeleteAdmin(admin)) return;

    if (isOwnAccount(admin)) return;

    clearMessages();

    setConfirmationAction({
      admin,
      action,
    });
  };

  // ==========================================
  // CLOSE CONFIRMATION MODAL
  // ==========================================

  const closeConfirmationModal = () => {
    if (actionLoading !== null) return;

    setConfirmationAction(null);
  };

  // ==========================================
  // CONFIRM ADMIN ACTION
  // ==========================================

  const handleConfirmAdminAction = async () => {
    if (!confirmationAction) return;

    const { admin, action } = confirmationAction;

    if (isOwnAccount(admin)) {
      setErrorMessage(
        "You cannot perform this action on your own account."
      );
      return;
    }

    if (action === "activate" && !canActivateAdmins) return;
    if (action === "deactivate" && !canDeactivateAdmins) return;
    if (action === "delete" && !canDeleteAdmin(admin)) return;

    clearMessages();

    try {
      setActionLoading(admin.id);

      let response;

      if (action === "activate") {
        response = await adminService.updateAdminStatus(admin.id, true);
      } else if (action === "deactivate") {
        response = await adminService.updateAdminStatus(admin.id, false);
      } else if (action === "delete") {
        response = await adminService.deleteAdmin(admin.id);
      } else {
        return;
      }

      const defaultMessages = {
        activate: "Admin account activated successfully.",
        deactivate: "Admin account deactivated successfully.",
        delete: "Admin account permanently deleted successfully.",
      };

      setConfirmationAction(null);

      setSuccessMessage(
        response.message || defaultMessages[action]
      );

      await fetchAdmins(true);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setActionLoading(null);
    }
  };

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredAdmins = admins.filter((admin) => {
    const search = searchTerm.toLowerCase();

    return (
      admin.name?.toLowerCase().includes(search) ||
      admin.email?.toLowerCase().includes(search) ||
      admin.phone?.toLowerCase().includes(search) ||
      admin.adminRole?.name?.toLowerCase().includes(search)
    );
  });

  // ==========================================
  // DATE FORMAT
  // ==========================================

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString();
  };

  // ==========================================
  // CONFIRMATION MODAL CONFIGURATION
  // ==========================================

  const confirmationConfig = {
    activate: {
      title: "Activate Admin Account?",
      description:
        "You are about to activate this administrator account.",
      warning:
        "The administrator will regain access to the Admin Dashboard according to their assigned Admin Role.",
      buttonText: "Yes, Activate",
      icon: ShieldCheck,
      buttonClass: "bg-green-600 hover:bg-green-700",
      iconClass: "bg-green-100 text-green-600",
      warningClass: "bg-green-50 text-green-800",
    },
    deactivate: {
      title: "Deactivate Admin Account?",
      description:
        "You are about to deactivate this administrator account.",
      warning:
        "The administrator will lose access to the Admin Dashboard until their account is activated again.",
      buttonText: "Yes, Deactivate",
      icon: Lock,
      buttonClass: "bg-orange-600 hover:bg-orange-700",
      iconClass: "bg-orange-100 text-orange-600",
      warningClass: "bg-orange-50 text-orange-800",
    },
    delete: {
      title: "Permanently Delete Admin?",
      description:
        "You are about to permanently delete this administrator account.",
      warning:
        "This action cannot be undone. The administrator account will be deleted, but historical activity logs will be preserved for auditing.",
      buttonText: "Yes, Permanently Delete",
      icon: Trash2,
      buttonClass: "bg-red-600 hover:bg-red-700",
      iconClass: "bg-red-100 text-red-600",
      warningClass: "bg-red-50 text-red-800",
    },
  };

  const currentConfirmation = confirmationAction
    ? confirmationConfig[confirmationAction.action]
    : null;

  const ConfirmationIcon = currentConfirmation?.icon;

  // ==========================================
  // ACCESS DENIED
  // ==========================================

  if (!canViewAdmins) {
    return (
      <div className="rounded-xl border border-red-200 bg-white p-10 text-center shadow-sm">
        <Lock className="mx-auto h-12 w-12 text-red-400" />

        <h2 className="mt-4 text-lg font-semibold text-gray-900">
          Access Denied
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          You do not have permission to view administrator accounts.
        </p>
      </div>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <>
      <div className="space-y-6">
        {/* PAGE HEADER */}

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-7 w-7 text-indigo-600" />

              <h1 className="text-2xl font-bold text-gray-900">
                Admin Management
              </h1>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Create and manage administrator accounts and their assigned roles.
            </p>
          </div>

          {canCreateAdmins && (
            <button
              type="button"
              onClick={openCreateModal}
              disabled={!canViewAdminRoles || rolesLoading || activeRoles.length === 0}
              title={
                !canViewAdminRoles
                  ? "VIEW_ADMIN_ROLES is required to select an Admin Role."
                  : activeRoles.length === 0
                    ? "Create and activate an Admin Role first."
                    : "Create Admin"
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <UserPlus size={18} />
              Create Admin
            </button>
          )}
        </div>

        {/* FEEDBACK */}

        {successMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            <CheckCircle size={18} />
            <span className="flex-1">{successMessage}</span>

            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              className="ml-auto"
              aria-label="Dismiss success message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {errorMessage && !showModal && !confirmationAction && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <XCircle size={18} />
            <span className="flex-1">{errorMessage}</span>

            <button
              type="button"
              onClick={() => setErrorMessage("")}
              className="ml-auto"
              aria-label="Dismiss error message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ROLE ACCESS NOTICE */}

        {!canViewAdminRoles && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
            You can manage permitted Admin account actions, but viewing and
            selecting Admin Roles requires the VIEW_ADMIN_ROLES permission.
          </div>
        )}

        {/* SUMMARY */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Admins</p>
                <h2 className="mt-2 text-2xl font-bold text-gray-900">
                  {admins.length}
                </h2>
              </div>

              <div className="rounded-lg bg-indigo-50 p-3 text-indigo-600">
                <Users size={23} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Admins</p>
                <h2 className="mt-2 text-2xl font-bold text-green-600">
                  {admins.filter((admin) => admin.isActive).length}
                </h2>
              </div>

              <div className="rounded-lg bg-green-50 p-3 text-green-600">
                <CheckCircle size={23} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Inactive Admins</p>
                <h2 className="mt-2 text-2xl font-bold text-red-600">
                  {admins.filter((admin) => !admin.isActive).length}
                </h2>
              </div>

              <div className="rounded-lg bg-red-50 p-3 text-red-600">
                <XCircle size={23} />
              </div>
            </div>
          </div>
        </div>

        {/* ADMIN TABLE */}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold text-gray-900">
                Administrator Accounts
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Manage administrator accounts and their assigned Admin Roles.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search admins..."
                  className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:w-64"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  fetchAdmins(true);
                  fetchRoles();
                }}
                disabled={refreshing || rolesLoading}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={
                    refreshing || rolesLoading ? "animate-spin" : ""
                  }
                />
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <RefreshCw className="h-7 w-7 animate-spin text-indigo-600" />
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-300" />

              <h3 className="mt-3 font-medium text-gray-800">
                No Admin Accounts Found
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {searchTerm
                  ? "Try a different search term."
                  : "No administrator accounts are available."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">
                      Administrator
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Contact
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Assigned Role
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Status
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Password Setup
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Joined
                    </th>

                    <th className="px-5 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredAdmins.map((admin) => {
                    const isSelf = isOwnAccount(admin);

                    const showResend =
                      canResendSetupEmail &&
                      admin.isActive &&
                      admin.adminPasswordSetupCompleted === false;

                    const showProfileEdit = canEditProfile(admin);
                    const showRoleEdit = canChangeRole(admin);
                    const showStatusAction = canChangeStatus(admin);
                    const showDelete = canDeleteAdmin(admin);

                    const assignedRole = admin.adminRole;
                    const assignedPermissions =
                      admin.adminPermissions || [];

                    return (
                      <tr
                        key={admin.id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                              <ShieldCheck size={20} />
                            </div>

                            <div>
                              <p className="font-semibold text-gray-900">
                                {admin.name}

                                {isSelf && (
                                  <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                                    You
                                  </span>
                                )}
                              </p>

                              <p className="text-xs text-gray-400">
                                ID: {admin.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-gray-700">{admin.email}</p>

                          <p className="mt-1 text-xs text-gray-400">
                            {admin.phone || "No phone number"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          {assignedRole ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                                <BriefcaseBusiness size={13} />
                                {assignedRole.name}
                              </span>

                              <p className="text-xs text-gray-500">
                                {assignedRole.isActive === false
                                  ? "Inactive role"
                                  : `${assignedPermissions.length} effective permissions`}
                              </p>
                            </div>
                          ) : (
                            <span className="inline-flex rounded-md bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700">
                              No role assigned
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                              admin.isActive
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {admin.isActive ? (
                              <CheckCircle size={13} />
                            ) : (
                              <XCircle size={13} />
                            )}

                            {admin.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                              admin.adminPasswordSetupCompleted
                                ? "bg-green-50 text-green-700"
                                : "bg-yellow-50 text-yellow-700"
                            }`}
                          >
                            {admin.adminPasswordSetupCompleted ? (
                              <CheckCircle size={13} />
                            ) : (
                              <Lock size={13} />
                            )}

                            {admin.adminPasswordSetupCompleted
                              ? "Completed"
                              : "Pending"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {formatDate(admin.createdAt)}
                        </td>

                        {/* ADMIN ACTIONS */}

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {showResend && (
                              <button
                                type="button"
                                onClick={() => handleResendSetupEmail(admin)}
                                disabled={
                                  resendingAdminId === admin.id ||
                                  actionLoading === admin.id
                                }
                                title="Resend password setup email"
                                className="rounded-lg border border-blue-200 p-2 text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {resendingAdminId === admin.id ? (
                                  <RefreshCw
                                    size={16}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Mail size={16} />
                                )}
                              </button>
                            )}

                            {showProfileEdit && (
                              <button
                                type="button"
                                onClick={() => openProfileModal(admin)}
                                disabled={actionLoading === admin.id}
                                title="Edit Admin profile"
                                className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                              >
                                <User size={16} />
                              </button>
                            )}

                            {showRoleEdit && (
                              <button
                                type="button"
                                onClick={() => openRoleModal(admin)}
                                disabled={
                                  actionLoading === admin.id ||
                                  rolesLoading ||
                                  assignableRoles.length === 0
                                }
                                title="Assign Admin Role"
                                className="rounded-lg border border-indigo-200 p-2 text-indigo-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <ArrowRightLeft size={16} />
                              </button>
                            )}

                            {showStatusAction && (
                              <button
                                type="button"
                                onClick={() =>
                                  openConfirmationModal(
                                    admin,
                                    admin.isActive
                                      ? "deactivate"
                                      : "activate"
                                  )
                                }
                                disabled={
                                  actionLoading === admin.id ||
                                  resendingAdminId === admin.id
                                }
                                title={
                                  admin.isActive
                                    ? "Deactivate Admin"
                                    : "Activate Admin"
                                }
                                className={`rounded-lg border p-2 transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                  admin.isActive
                                    ? "border-orange-200 text-orange-600 hover:bg-orange-50"
                                    : "border-green-200 text-green-600 hover:bg-green-50"
                                }`}
                              >
                                {admin.isActive ? (
                                  <Lock size={16} />
                                ) : (
                                  <CheckCircle size={16} />
                                )}
                              </button>
                            )}

                            {showDelete && (
                              <button
                                type="button"
                                onClick={() =>
                                  openConfirmationModal(admin, "delete")
                                }
                                disabled={
                                  actionLoading === admin.id ||
                                  resendingAdminId === admin.id
                                }
                                title="Permanently delete Admin"
                                className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}

                            {isSelf && (
                              <span className="text-xs text-gray-400">
                                Own account
                              </span>
                            )}

                            {!isSelf &&
                              !showResend &&
                              !showProfileEdit &&
                              !showRoleEdit &&
                              !showStatusAction &&
                              !showDelete && (
                                <span className="text-xs text-gray-400">
                                  No actions
                                </span>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-gray-200 px-5 py-3 text-xs text-gray-500">
            Showing {filteredAdmins.length} of {admins.length} administrator
            accounts
          </div>
        </div>

        {/* CREATE / PROFILE / ROLE MODAL */}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
            <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
              {/* MODAL HEADER */}

              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 sm:px-6">
                <div>
                  <div className="flex items-center gap-2">
                    {modalMode === "profile" ? (
                      <User className="h-5 w-5 text-indigo-600" />
                    ) : modalMode === "role" ? (
                      <BriefcaseBusiness className="h-5 w-5 text-indigo-600" />
                    ) : (
                      <Shield className="h-5 w-5 text-indigo-600" />
                    )}

                    <h2 className="text-lg font-bold text-gray-900">
                      {modalMode === "create"
                        ? "Create Admin Account"
                        : modalMode === "profile"
                          ? "Edit Admin Profile"
                          : "Assign Admin Role"}
                    </h2>
                  </div>

                  <p className="mt-1 text-xs text-gray-500">
                    {modalMode === "create"
                      ? "Create a new administrator and assign an active role."
                      : modalMode === "profile"
                        ? `Update profile information for ${selectedAdmin?.name}.`
                        : `Change the assigned role for ${selectedAdmin?.name}.`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              {/* MODAL BODY */}

              <form
                onSubmit={
                  modalMode === "create"
                    ? handleCreateAdmin
                    : modalMode === "profile"
                      ? handleUpdateAdminProfile
                      : handleAssignAdminRole
                }
                className="overflow-y-auto p-5 sm:p-6"
              >
                {errorMessage && (
                  <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <XCircle size={18} className="mt-0.5 shrink-0" />

                    <span className="flex-1">{errorMessage}</span>

                    <button
                      type="button"
                      onClick={() => setErrorMessage("")}
                      aria-label="Dismiss error"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {/* ADMIN ACCOUNT INFORMATION */}

                {(modalMode === "create" || modalMode === "profile") && (
                  <div>
                    <h3 className="mb-4 font-semibold text-gray-900">
                      Administrator Information
                    </h3>

                    {modalMode === "create" && (
                      <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <div className="flex items-start gap-3">
                          <Mail
                            size={20}
                            className="mt-0.5 shrink-0 text-blue-600"
                          />

                          <div>
                            <p className="text-sm font-semibold text-blue-900">
                              First-Time Password Setup
                            </p>

                            <p className="mt-1 text-sm leading-6 text-blue-800">
                              The administrator will receive an email
                              containing a secure password setup link.
                              They will create their own password before
                              logging in.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          Full Name *
                        </label>

                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          minLength={2}
                          maxLength={100}
                          placeholder="Enter admin name"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          Email Address *
                        </label>

                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          placeholder="admin@example.com"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          Phone Number
                        </label>

                        <input
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="Enter phone number"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          Date of Birth
                        </label>

                        <input
                          type="date"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleInputChange}
                          max={new Date().toISOString().split("T")[0]}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          Gender
                        </label>

                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        >
                          <option value="">Select gender</option>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* ROLE SELECTION DURING ADMIN CREATION */}

                    {modalMode === "create" && (
                      <div className="mt-6">
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          Assign Admin Role *
                        </label>

                        <select
                          name="adminRoleId"
                          value={formData.adminRoleId}
                          onChange={handleInputChange}
                          required
                          disabled={rolesLoading}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
                        >
                          <option value="">
                            {rolesLoading
                              ? "Loading Admin Roles..."
                              : "Select an active Admin Role"}
                          </option>

                          {assignableRoles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>

                        <p className="mt-1.5 text-xs text-gray-500">
                          Only active roles whose permissions you are
                          authorized to grant are available.
                        </p>

                        {!rolesLoading && assignableRoles.length === 0 && (
                          <p className="mt-2 text-xs text-red-600">
                            No assignable active roles are available. Create
                            or activate an appropriate Admin Role first, or
                            ask a Super Admin for access.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* EXISTING ADMIN ROLE ASSIGNMENT */}

                {modalMode === "role" && (
                  <div>
                    <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-4">
                      <div className="flex items-start gap-3">
                        <ShieldCheck
                          size={20}
                          className="mt-0.5 shrink-0 text-blue-600"
                        />

                        <div>
                          <p className="text-sm font-semibold text-blue-900">
                            Role-Based Access
                          </p>

                          <p className="mt-1 text-sm leading-6 text-blue-800">
                            The selected role determines this Admin's
                            effective permissions. Changing the role
                            immediately changes the permissions associated
                            with the account.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs font-medium uppercase text-gray-500">
                        Administrator
                      </p>

                      <p className="mt-1 font-semibold text-gray-900">
                        {selectedAdmin?.name}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {selectedAdmin?.email}
                      </p>

                      <p className="mt-3 text-xs text-gray-500">
                        Current Role
                      </p>

                      <p className="mt-1 text-sm font-semibold text-indigo-700">
                        {selectedAdmin?.adminRole?.name || "No role assigned"}
                      </p>
                    </div>

                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      New Admin Role *
                    </label>

                    <select
                      value={selectedRoleId}
                      onChange={(event) =>
                        setSelectedRoleId(event.target.value)
                      }
                      required
                      disabled={rolesLoading}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
                    >
                      <option value="">
                        Select an active Admin Role
                      </option>

                      {assignableRoles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>

                    <p className="mt-1.5 text-xs text-gray-500">
                      Only active roles containing permissions you possess
                      are available for assignment.
                    </p>

                    {assignableRoles.length === 0 && !rolesLoading && (
                      <p className="mt-2 text-xs text-red-600">
                        No assignable active Admin Roles are available.
                      </p>
                    )}
                  </div>
                )}

                {/* MODAL FOOTER */}

                <div className="mt-7 flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={submitting}
                    className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      (modalMode === "create" &&
                        (!formData.adminRoleId ||
                          !assignableRoles.some(
                            (role) =>
                              String(role.id) ===
                              String(formData.adminRoleId)
                          ))) ||
                      (modalMode === "role" &&
                        (!selectedRoleId ||
                          !assignableRoles.some(
                            (role) =>
                              String(role.id) === String(selectedRoleId)
                          )))
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting && (
                      <RefreshCw size={16} className="animate-spin" />
                    )}

                    {modalMode === "create"
                      ? submitting
                        ? "Creating..."
                        : "Create Admin"
                      : modalMode === "profile"
                        ? submitting
                          ? "Saving..."
                          : "Save Profile"
                        : submitting
                          ? "Assigning..."
                          : "Assign Role"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ACTIVATE / DEACTIVATE / DELETE CONFIRMATION MODAL */}

        {confirmationAction && currentConfirmation && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={closeConfirmationModal}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-confirmation-title"
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              {/* MODAL HEADER */}

              <div className="flex items-start justify-between">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${currentConfirmation.iconClass}`}
                >
                  <ConfirmationIcon size={24} />
                </div>

                <button
                  type="button"
                  onClick={closeConfirmationModal}
                  disabled={actionLoading !== null}
                  className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                  aria-label="Close confirmation"
                >
                  <X size={20} />
                </button>
              </div>

              {/* MODAL CONTENT */}

              <h2
                id="admin-confirmation-title"
                className="mt-4 text-xl font-bold text-gray-900"
              >
                {currentConfirmation.title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                {currentConfirmation.description}
              </p>

              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">
                  {confirmationAction.admin.name}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {confirmationAction.admin.email}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Admin ID: {confirmationAction.admin.id}
                </p>
              </div>

              <div
                className={`mt-4 rounded-lg p-3 text-sm leading-6 ${currentConfirmation.warningClass}`}
              >
                {currentConfirmation.warning}
              </div>

              {errorMessage && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <XCircle size={18} className="mt-0.5 shrink-0" />

                  <span className="flex-1">{errorMessage}</span>
                </div>
              )}

              {/* MODAL ACTIONS */}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeConfirmationModal}
                  disabled={actionLoading !== null}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAdminAction}
                  disabled={actionLoading !== null}
                  className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${currentConfirmation.buttonClass}`}
                >
                  {actionLoading !== null ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    currentConfirmation.buttonText
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminsList;
