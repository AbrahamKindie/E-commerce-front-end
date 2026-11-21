
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  ShieldCheck,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  X,
  Lock,
  Shield,
  Users,
  KeyRound,
  AlertTriangle,
  Power,
  Eye,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";

import adminRolesService from "../../services/adminRolesService";
import { useAuth } from "../../context/AuthContext";

// ==========================================
// HELPERS
// ==========================================

const LEGACY_PERMISSION = "MANAGE_ADMIN_PERMISSIONS";

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  "Something went wrong. Please try again.";

const unwrapResponse = (response) =>
  response?.data?.data ?? response?.data ?? response ?? null;

const normalizePermissions = (permissions) => {
  if (!Array.isArray(permissions)) return [];

  return [
    ...new Set(
      permissions
        .map((permission) =>
          typeof permission === "string"
            ? permission
            : permission?.key || permission?.name
        )
        .filter(
          (permission) =>
            typeof permission === "string" &&
            permission.trim() &&
            permission !== LEGACY_PERMISSION
        )
    ),
  ].sort();
};

const normalizePermissionCatalog = (response) => {
  const data = unwrapResponse(response);

  if (Array.isArray(data)) return normalizePermissions(data);
  if (Array.isArray(data?.permissions))
    return normalizePermissions(data.permissions);
  if (Array.isArray(data?.availablePermissions))
    return normalizePermissions(data.availablePermissions);

  return [];
};

const normalizeRole = (role) => ({
  ...role,
  permissions: normalizePermissions(role?.permissions),
  assignedAdmins: Array.isArray(role?.assignedAdmins)
    ? role.assignedAdmins
    : Array.isArray(role?.adminsList)
      ? role.adminsList
      : [],
});

const formatPermissionLabel = (permission) =>
  permission
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());

const formatDateTime = (date) => {
  if (!date) return "Not available";
  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime())
    ? "Not available"
    : parsedDate.toLocaleString();
};

const getPermissionGroup = (permission) => {
  if (
    permission.includes("ADMIN_ROLE") ||
    permission === "ASSIGN_ADMIN_ROLES"
  )
    return "Role & Permission Management";

  if (permission.includes("ACTIVITY_LOG")) return "Activity Logs";
  if (permission.includes("USER")) return "User Management";
  if (permission.includes("SHOP")) return "Shop Management";
  if (permission.includes("PRODUCT_REPORT")) return "Product Reports";
  if (permission.includes("PRODUCT")) return "Product Management";
  if (permission.includes("ADMIN")) return "Admin Management";
  if (permission.includes("CATEGOR")) return "Category Management";
  if (permission.includes("ORDER")) return "Order Management";
  if (permission.includes("PAYMENT")) return "Payment Management";
  if (permission.includes("DISCOUNT")) return "Discount Management";
  if (permission.includes("REVIEW")) return "Review Management";
  if (permission.includes("NOTIFICATION")) return "Notification Management";
  if (permission.includes("REPORT")) return "Reports & Analytics";
  if (permission.includes("SETTING")) return "System Settings";

  return "Other Permissions";
};

const getAdminCount = (role) => {
  if (typeof role?.admins === "number") return role.admins;
  if (typeof role?.admins?.count === "number") return role.admins.count;
  if (typeof role?.assignedAdminCount === "number")
    return role.assignedAdminCount;
  if (Array.isArray(role?.assignedAdmins)) return role.assignedAdmins.length;
  return 0;
};

const getActiveAdminCount = (role) => {
  if (typeof role?.activeAdmins === "number") return role.activeAdmins;
  if (typeof role?.activeAdminCount === "number")
    return role.activeAdminCount;
  return null;
};

const getAdminInitials = (name) => {
  if (!name) return "AD";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

// ==========================================
// STATUS BADGE
// ==========================================

const StatusBadge = ({
  active,
  activeLabel = "Active",
  inactiveLabel = "Inactive",
}) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
      active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
    }`}
  >
    {active ? <CheckCircle size={13} /> : <XCircle size={13} />}
    {active ? activeLabel : inactiveLabel}
  </span>
);

// ==========================================
// ASSIGNED ADMIN AVATAR
// ==========================================

const AssignedAdminAvatar = ({ admin }) => (
  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-indigo-100">
    {admin.profileImage ? (
      <img
        src={admin.profileImage}
        alt={admin.name || "Admin profile"}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    ) : (
      <div className="flex h-full w-full items-center justify-center text-sm font-bold text-indigo-700">
        {getAdminInitials(admin.name)}
      </div>
    )}
  </div>
);

// ==========================================
// ASSIGNED ADMIN TABLE
// ==========================================

const AssignedAdminTable = ({ admins = [] }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAdmins = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return admins;

    return admins.filter((admin) =>
      [admin.name, admin.email, admin.phone].some((value) =>
        value?.toLowerCase().includes(search)
      )
    );
  }, [admins, searchTerm]);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex flex-col justify-between gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center">
        <div>
          <h4 className="text-sm font-semibold text-gray-800">
            Admin Accounts
          </h4>
          <p className="mt-1 text-xs text-gray-500">
            Showing {filteredAdmins.length} of {admins.length} Admins
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-9 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              aria-label="Clear Admin search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="max-h-[360px] w-full overflow-auto">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
              <th className="min-w-[200px] px-5 py-4 font-semibold">Admin</th>
              <th className="min-w-[240px] px-5 py-4 font-semibold">Email</th>
              <th className="min-w-[170px] px-5 py-4 font-semibold">Phone</th>
              <th className="min-w-[140px] px-5 py-4 font-semibold">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {filteredAdmins.length ? (
              filteredAdmins.map((admin) => (
                <tr key={admin.id} className="transition hover:bg-gray-50">
                  <td className="whitespace-nowrap px-5 py-3">
                    <div className="flex items-center gap-3">
                      <AssignedAdminAvatar admin={admin} />
                      <span className="font-semibold text-gray-900">
                        {admin.name || "Unnamed Admin"}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail size={15} className="text-gray-400" />
                      {admin.email || "No email"}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-gray-600">
                    <div className="flex items-center gap-2">
                      <Phone size={15} className="text-gray-400" />
                      {admin.phone || "No phone number"}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3">
                    <StatusBadge active={Boolean(admin.isActive)} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center">
                  <Search className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="mt-2 font-medium text-gray-700">
                    No Admins Found
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Try searching with a different name, email, or phone number.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3">
        <p className="text-xs text-gray-500">
          {filteredAdmins.length} Admin
          {filteredAdmins.length !== 1 ? "s" : ""} displayed
        </p>
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
          >
            Clear Search
          </button>
        )}
      </div>
    </div>
  );
};

// ==========================================
// CONFIRMATION POPUP
// ==========================================

const ConfirmActionModal = ({
  action,
  onCancel,
  onConfirm,
  loading,
}) => {
  if (!action) return null;

  const isDelete = action.type === "delete";
  const isActivate = action.type === "activate";

  const title = isDelete
    ? "Delete Admin Role?"
    : isActivate
      ? "Activate Admin Role?"
      : "Deactivate Admin Role?";

  const description = isDelete
    ? `Are you sure you want to permanently delete the "${action.role.name}" role? This action cannot be undone.`
    : isActivate
      ? `Are you sure you want to activate the "${action.role.name}" role? Admins assigned to this role will be able to use it again.`
      : `Are you sure you want to deactivate the "${action.role.name}" role? This role will no longer be available for Admin access.`;

  const confirmLabel = isDelete
    ? "Delete Role"
    : isActivate
      ? "Activate Role"
      : "Deactivate Role";

  const confirmStyle = isDelete
    ? "bg-red-600 hover:bg-red-700 focus:ring-red-200"
    : isActivate
      ? "bg-green-600 hover:bg-green-700 focus:ring-green-200"
      : "bg-orange-600 hover:bg-orange-700 focus:ring-orange-200";

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-role-title"
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start gap-4 p-6">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
              isDelete
                ? "bg-red-100 text-red-600"
                : isActivate
                  ? "bg-green-100 text-green-600"
                  : "bg-orange-100 text-orange-600"
            }`}
          >
            {isDelete ? (
              <Trash2 size={23} />
            ) : (
              <Power size={23} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2
              id="confirm-role-title"
              className="text-lg font-bold text-gray-900"
            >
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            aria-label="Close confirmation"
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </div>

        {isDelete && (
          <div className="mx-6 mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertTriangle
              size={17}
              className="mt-0.5 shrink-0 text-red-600"
            />
            <p className="text-xs leading-5 text-red-700">
              Deleting this role is permanent. Make sure no Admin accounts
              depend on this role before continuing.
            </p>
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${confirmStyle}`}
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {isDelete ? (
                  <Trash2 size={16} />
                ) : (
                  <Power size={16} />
                )}
                {confirmLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const AdminRoles = () => {
  const auth = useAuth();
  const user = auth?.user;

  const isSuperAdmin =
    auth?.isSuperAdmin === true ||
    user?.isSuperAdmin === true ||
    user?.role === "SUPER_ADMIN";

  const currentPermissions = Array.isArray(user?.adminPermissions)
    ? user.adminPermissions
    : [];

  const checkPermission = useCallback(
    (permission) => {
      if (isSuperAdmin) return true;

      if (typeof auth?.hasPermission === "function") {
        return auth.hasPermission(permission) === true;
      }

      return currentPermissions.includes(permission);
    },
    [auth, currentPermissions, isSuperAdmin]
  );

  const canViewRoles = checkPermission("VIEW_ADMIN_ROLES");
  const canCreateRoles = checkPermission("CREATE_ADMIN_ROLES");
  const canUpdateRoles = checkPermission("UPDATE_ADMIN_ROLES");
  const canDeleteRoles = checkPermission("DELETE_ADMIN_ROLES");
  const canManageRolePermissions = checkPermission(
    "MANAGE_ADMIN_ROLE_PERMISSIONS"
  );

  // ==========================================
  // STATE
  // ==========================================

  const [roles, setRoles] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedRole, setSelectedRole] = useState(null);

  const [showDetails, setShowDetails] = useState(false);
  const [detailRole, setDetailRole] = useState(null);
  const [detailTargetRole, setDetailTargetRole] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [],
  });

  const [expandedGroups, setExpandedGroups] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // This state controls the custom Delete / Activate / Deactivate popup.
  const [confirmAction, setConfirmAction] = useState(null);

  // ==========================================
  // PERMISSION GROUPS
  // ==========================================

  const permissionGroups = useMemo(() => {
    const groups = {};

    availablePermissions.forEach((permission) => {
      if (permission === LEGACY_PERMISSION) return;

      const groupName = getPermissionGroup(permission);
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(permission);
    });

    return Object.entries(groups)
      .map(([label, permissions]) => ({
        label,
        permissions: permissions.sort(),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [availablePermissions]);

  // ==========================================
  // FETCH ROLES AND PERMISSIONS
  // ==========================================

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!canViewRoles) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        const [rolesResponse, permissionsResponse] = await Promise.all([
          adminRolesService.getAdminRoles(),
          adminRolesService.getAvailableAdminPermissions(),
        ]);

        const rolesData = unwrapResponse(rolesResponse);

        const roleList = Array.isArray(rolesData)
          ? rolesData
          : Array.isArray(rolesData?.roles)
            ? rolesData.roles
            : Array.isArray(rolesData?.data)
              ? rolesData.data
              : [];

        setRoles(roleList.map(normalizeRole));
        setAvailablePermissions(
          normalizePermissionCatalog(permissionsResponse)
        );
        setErrorMessage("");
      } catch (error) {
        setErrorMessage(getErrorMessage(error));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [canViewRoles]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ==========================================
  // MESSAGES
  // ==========================================

  const clearMessages = () => {
    setSuccessMessage("");
    setErrorMessage("");
  };

  // ==========================================
  // ROLE DETAILS
  // ==========================================

  const openRoleDetails = async (role) => {
    if (!role?.id) return;

    clearMessages();
    setDetailTargetRole(role);
    setShowDetails(true);
    setDetailRole(null);
    setDetailError("");
    setDetailLoading(true);

    try {
      const response = await adminRolesService.getAdminRoleById(role.id);
      const roleData = unwrapResponse(response);

      if (!roleData || typeof roleData !== "object") {
        throw new Error("Unable to load role details.");
      }

      setDetailRole(
        normalizeRole(roleData.role || roleData.data || roleData)
      );
    } catch (error) {
      setDetailError(getErrorMessage(error));
    } finally {
      setDetailLoading(false);
    }
  };

  const closeRoleDetails = () => {
    setShowDetails(false);
    setDetailRole(null);
    setDetailTargetRole(null);
    setDetailError("");
    setDetailLoading(false);
  };

  const detailPermissions = normalizePermissions(detailRole?.permissions);
  const assignedAdmins = Array.isArray(detailRole?.assignedAdmins)
    ? detailRole.assignedAdmins
    : [];

  const activeAssignedAdmins = assignedAdmins.filter(
    (admin) => admin.isActive
  );

  const inactiveAssignedAdmins = assignedAdmins.filter(
    (admin) => !admin.isActive
  );

  const detailPermissionGroups = useMemo(() => {
    const groups = {};

    detailPermissions.forEach((permission) => {
      const groupName = getPermissionGroup(permission);
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(permission);
    });

    return Object.entries(groups)
      .map(([label, permissions]) => ({
        label,
        permissions: permissions.sort(),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [detailRole]);

  // ==========================================
  // FORM HELPERS
  // ==========================================

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      permissions: [],
    });
  };

  const openCreateModal = () => {
    if (!canCreateRoles) return;

    clearMessages();
    resetForm();
    setModalMode("create");
    setSelectedRole(null);
    setExpandedGroups(permissionGroups.map((group) => group.label));
    setShowModal(true);
  };

  const openEditModal = (role) => {
    if (!canUpdateRoles) return;

    clearMessages();
    setModalMode("edit");
    setSelectedRole(role);

    setFormData({
      name: role.name || "",
      description: role.description || "",
      permissions: normalizePermissions(role.permissions),
    });

    setExpandedGroups(permissionGroups.map((group) => group.label));
    setShowModal(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setShowModal(false);
    setSelectedRole(null);
    setErrorMessage("");
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================
  // PERMISSION SELECTION
  // ==========================================

  const handlePermissionChange = (permission) => {
    if (!canManageRolePermissions || permission === LEGACY_PERMISSION) return;

    setFormData((previous) => {
      const exists = previous.permissions.includes(permission);

      return {
        ...previous,
        permissions: exists
          ? previous.permissions.filter((item) => item !== permission)
          : [...previous.permissions, permission],
      };
    });
  };

  const toggleGroup = (groupName) => {
    setExpandedGroups((previous) =>
      previous.includes(groupName)
        ? previous.filter((item) => item !== groupName)
        : [...previous, groupName]
    );
  };

  const handleGroupSelection = (group) => {
    if (!canManageRolePermissions) return;

    const allSelected = group.permissions.every((permission) =>
      formData.permissions.includes(permission)
    );

    setFormData((previous) => ({
      ...previous,
      permissions: allSelected
        ? previous.permissions.filter(
            (permission) => !group.permissions.includes(permission)
          )
        : [
            ...new Set([...previous.permissions, ...group.permissions]),
          ],
    }));
  };

  const selectablePermissions = availablePermissions.filter(
    (permission) => permission !== LEGACY_PERMISSION
  );

  const allPermissionsSelected =
    selectablePermissions.length > 0 &&
    selectablePermissions.every((permission) =>
      formData.permissions.includes(permission)
    );

  const handleSelectAll = () => {
    if (!canManageRolePermissions) return;

    setFormData((previous) => ({
      ...previous,
      permissions: allPermissionsSelected
        ? previous.permissions.filter(
            (permission) => !selectablePermissions.includes(permission)
          )
        : [
            ...new Set([
              ...previous.permissions,
              ...selectablePermissions,
            ]),
          ],
    }));
  };

  // ==========================================
  // SAVE ROLE
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();
    clearMessages();

    if (modalMode === "create" && !canCreateRoles) {
      setErrorMessage("You do not have permission to create roles.");
      return;
    }

    if (modalMode === "edit" && !canUpdateRoles) {
      setErrorMessage("You do not have permission to update roles.");
      return;
    }

    const roleName = formData.name.trim();
    const roleDescription = formData.description.trim();

    if (roleName.length < 2 || roleName.length > 100) {
      setErrorMessage("Role name must contain between 2 and 100 characters.");
      return;
    }

    if (roleDescription.length > 255) {
      setErrorMessage("Role description cannot exceed 255 characters.");
      return;
    }

    if (modalMode === "edit" && !selectedRole?.id) {
      setErrorMessage("The selected role is invalid. Please try again.");
      return;
    }

    try {
      setSubmitting(true);

      const roleData = {
        name: roleName,
        description: roleDescription,
      };

      if (canManageRolePermissions) {
        roleData.permissions = normalizePermissions(formData.permissions);
      }

      let response;

      if (modalMode === "create") {
        response = await adminRolesService.createAdminRole(roleData);
      } else {
        response = await adminRolesService.updateAdminRole(
          selectedRole.id,
          roleData
        );
      }

      setShowModal(false);
      setSelectedRole(null);

      const result = unwrapResponse(response);

      setSuccessMessage(
        result?.message ||
          response?.message ||
          (modalMode === "create"
            ? "Role created successfully."
            : "Role updated successfully.")
      );

      await fetchData(true);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // OPEN CONFIRMATION POPUP
  // ==========================================

  const requestRoleStatus = (role) => {
    if (!canUpdateRoles || actionLoading !== null) return;

    const isActivating = !role.isActive;
    const activeAdmins = getActiveAdminCount(role);

    if (!isActivating && activeAdmins == null) {
      setErrorMessage(
        "Cannot deactivate this role because its active Admin count is unavailable. Refresh the page or contact the system administrator."
      );
      return;
    }

    if (!isActivating && activeAdmins > 0) {
      setErrorMessage(
        `This role cannot be deactivated because ${activeAdmins} active Admin account(s) are assigned to it.`
      );
      return;
    }

    clearMessages();

    setConfirmAction({
      type: isActivating ? "activate" : "deactivate",
      role,
    });
  };

  const requestDeleteRole = (role) => {
    if (!canDeleteRoles || actionLoading !== null) return;

    const assignedAdminsCount = getAdminCount(role);

    if (assignedAdminsCount > 0) {
      setErrorMessage(
        "This role cannot be deleted because Admin accounts are assigned to it. Reassign those Admins first."
      );
      return;
    }

    clearMessages();

    setConfirmAction({
      type: "delete",
      role,
    });
  };

  const closeConfirmation = () => {
    if (actionLoading !== null) return;
    setConfirmAction(null);
  };

  // ==========================================
  // CONFIRM ACTION
  // ==========================================

  const handleConfirmAction = async () => {
    if (!confirmAction || actionLoading !== null) return;

    const { type, role } = confirmAction;

    if (!role?.id) {
      setConfirmAction(null);
      setErrorMessage("The selected role is invalid. Please refresh.");
      return;
    }

    clearMessages();
    setActionLoading(role.id);

    try {
      let response;

      if (type === "delete") {
        response = await adminRolesService.deleteAdminRole(role.id);
      } else {
        const isActivating = type === "activate";

        response = await adminRolesService.updateAdminRoleStatus(
          role.id,
          isActivating
        );
      }

      const result = unwrapResponse(response);

      const fallbackMessage =
        type === "delete"
          ? "Role deleted successfully."
          : type === "activate"
            ? "Role activated successfully."
            : "Role deactivated successfully.";

      setConfirmAction(null);

      setSuccessMessage(
        result?.message || response?.message || fallbackMessage
      );

      await fetchData(true);
    } catch (error) {
      setConfirmAction(null);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setActionLoading(null);
    }
  };

  // ==========================================
  // FILTER ROLES
  // ==========================================

  const filteredRoles = roles.filter((role) => {
    const search = searchTerm.toLowerCase();

    return (
      role.name?.toLowerCase().includes(search) ||
      role.description?.toLowerCase().includes(search)
    );
  });

  const activeRoles = roles.filter((role) => role.isActive).length;
  const inactiveRoles = roles.length - activeRoles;

  // ==========================================
  // ACCESS DENIED
  // ==========================================

  if (!canViewRoles) {
    return (
      <div className="rounded-xl border border-red-200 bg-white p-10 text-center shadow-sm">
        <Lock className="mx-auto h-12 w-12 text-red-400" />
        <h2 className="mt-4 text-lg font-semibold text-gray-900">
          Access Denied
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          You do not have permission to view Admin Roles.
        </p>
      </div>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Role & Permissions
            </h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Create administrator roles, manage permissions, and view assigned
            Admin accounts.
          </p>
        </div>

        {canCreateRoles && (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            <Plus size={18} />
            Create Role
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
            aria-label="Dismiss success message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {errorMessage && !showModal && !showDetails && !confirmAction && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <XCircle size={18} />
          <span className="flex-1">{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage("")}
            aria-label="Dismiss error message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* SUMMARY CARDS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Roles</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                {roles.length}
              </h2>
            </div>
            <div className="rounded-lg bg-indigo-50 p-3 text-indigo-600">
              <Shield size={23} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Roles</p>
              <h2 className="mt-2 text-2xl font-bold text-green-600">
                {activeRoles}
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
              <p className="text-sm text-gray-500">Inactive Roles</p>
              <h2 className="mt-2 text-2xl font-bold text-red-600">
                {inactiveRoles}
              </h2>
            </div>
            <div className="rounded-lg bg-red-50 p-3 text-red-600">
              <XCircle size={23} />
            </div>
          </div>
        </div>
      </div>

      {/* ROLES TABLE */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-gray-900">
              Administrator Roles
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Each role defines the permissions available to assigned Admins.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search roles..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:w-64"
              />
            </div>

            <button
              type="button"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <RefreshCw className="h-7 w-7 animate-spin text-indigo-600" />
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="py-16 text-center">
            <Shield className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-3 font-medium text-gray-800">No Roles Found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm
                ? "Try a different search term."
                : "Create your first Admin role to get started."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Role</th>
                  <th className="px-5 py-4 font-semibold">Permissions</th>
                  <th className="px-5 py-4 font-semibold">Assigned Admins</th>
                  <th className="px-5 py-4 font-semibold">Active Admins</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredRoles.map((role) => {
                  const assignedCount = getAdminCount(role);
                  const activeAdminCount = getActiveAdminCount(role);

                  const canDeactivate =
                    canUpdateRoles &&
                    role.isActive &&
                    activeAdminCount === 0;

                  const cannotDeactivateReason =
                    activeAdminCount == null
                      ? "Active Admin count is unavailable."
                      : activeAdminCount > 0
                        ? `${activeAdminCount} active Admin account(s) use this role.`
                        : "";

                  return (
                    <tr
                      key={role.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                            <ShieldCheck size={20} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {role.name}
                            </p>
                            <p className="mt-1 max-w-xs text-xs text-gray-400">
                              {role.description || "No description"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700">
                          <KeyRound size={14} />
                          {normalizePermissions(role.permissions).length}{" "}
                          permissions
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2 text-gray-700">
                          <Users size={15} className="text-gray-400" />
                          {assignedCount}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`font-medium ${
                            activeAdminCount > 0
                              ? "text-orange-600"
                              : "text-gray-600"
                          }`}
                        >
                          {activeAdminCount ?? "Not available"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge active={Boolean(role.isActive)} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openRoleDetails(role)}
                            disabled={actionLoading === role.id}
                            title="View role details and assigned Admins"
                            className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50"
                          >
                            <Eye size={16} />
                          </button>

                          {canUpdateRoles && (
                            <button
                              type="button"
                              onClick={() => openEditModal(role)}
                              disabled={actionLoading === role.id}
                              title="Edit role and permissions"
                              className="rounded-lg border border-indigo-200 p-2 text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-50"
                            >
                              <Edit size={16} />
                            </button>
                          )}

                          {canUpdateRoles && (
                            <button
                              type="button"
                              onClick={() => requestRoleStatus(role)}
                              disabled={
                                actionLoading === role.id ||
                                (role.isActive && !canDeactivate)
                              }
                              title={
                                role.isActive
                                  ? cannotDeactivateReason || "Deactivate role"
                                  : "Activate role"
                              }
                              className={`rounded-lg border p-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                role.isActive
                                  ? "border-orange-200 text-orange-600 hover:bg-orange-50"
                                  : "border-green-200 text-green-600 hover:bg-green-50"
                              }`}
                            >
                              {actionLoading === role.id ? (
                                <RefreshCw
                                  size={16}
                                  className="animate-spin"
                                />
                              ) : (
                                <Power size={16} />
                              )}
                            </button>
                          )}

                          {canDeleteRoles && (
                            <button
                              type="button"
                              onClick={() => requestDeleteRole(role)}
                              disabled={
                                actionLoading === role.id || assignedCount > 0
                              }
                              title={
                                assignedCount > 0
                                  ? "Reassign all Admins before deleting this role"
                                  : "Delete role"
                              }
                              className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Trash2 size={16} />
                            </button>
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
          Showing {filteredRoles.length} of {roles.length} roles
        </div>
      </div>

      {/* ======================================
          ROLE DETAILS MODAL
      ====================================== */}

      {showDetails && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-3 sm:p-5">
          <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <ShieldCheck size={23} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Role Details
                  </h2>
                  <p className="text-xs text-gray-500">
                    Role information, permissions, and assigned Admin profiles
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeRoleDetails}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close role details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-5 sm:p-6">
              {detailLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
                  <p className="mt-3 text-sm text-gray-500">
                    Loading role details...
                  </p>
                </div>
              ) : detailError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center">
                  <XCircle className="mx-auto h-9 w-9 text-red-500" />
                  <p className="mt-3 text-sm text-red-700">{detailError}</p>
                  <div className="mt-4 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (detailTargetRole) {
                          openRoleDetails(detailTargetRole);
                        }
                      }}
                      disabled={!detailTargetRole || detailLoading}
                      className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <RefreshCw size={15} />
                      Retry
                    </button>
                    <button
                      type="button"
                      onClick={closeRoleDetails}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : detailRole ? (
                <div className="space-y-7">
                  {/* ROLE INFORMATION */}

                  <section>
                    <div className="flex flex-col justify-between gap-4 rounded-xl border border-indigo-100 bg-indigo-50/60 p-5 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                          <Shield size={28} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {detailRole.name}
                          </h3>
                          <p className="mt-1 text-sm text-gray-600">
                            {detailRole.description ||
                              "No description provided."}
                          </p>
                        </div>
                      </div>
                      <StatusBadge active={Boolean(detailRole.isActive)} />
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-lg border border-gray-200 p-4">
                        <p className="text-xs text-gray-500">
                          Total Assigned Admins
                        </p>
                        <p className="mt-2 text-2xl font-bold text-gray-900">
                          {detailRole.assignedAdminCount ??
                            assignedAdmins.length}
                        </p>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-4">
                        <p className="text-xs text-gray-500">Active Admins</p>
                        <p className="mt-2 text-2xl font-bold text-green-600">
                          {detailRole.activeAdminCount ??
                            activeAssignedAdmins.length}
                        </p>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-4">
                        <p className="text-xs text-gray-500">
                          Inactive Admins
                        </p>
                        <p className="mt-2 text-2xl font-bold text-red-600">
                          {detailRole.inactiveAdminCount ??
                            inactiveAssignedAdmins.length}
                        </p>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-4">
                        <p className="text-xs text-gray-500">Permissions</p>
                        <p className="mt-2 text-2xl font-bold text-indigo-600">
                          {detailPermissions.length}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-gray-200 p-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-gray-500">Created At</p>
                        <p className="mt-1 text-sm font-medium text-gray-800">
                          {formatDateTime(detailRole.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Last Updated</p>
                        <p className="mt-1 text-sm font-medium text-gray-800">
                          {formatDateTime(detailRole.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* PERMISSIONS */}

                  <section>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="flex items-center gap-2 font-semibold text-gray-900">
                          <KeyRound size={18} className="text-indigo-600" />
                          Assigned Permissions
                        </h3>
                        <p className="mt-1 text-xs text-gray-500">
                          Permissions granted to Admins assigned to this role.
                        </p>
                      </div>
                      <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                        {detailPermissions.length} total
                      </span>
                    </div>

                    {detailPermissionGroups.length === 0 ? (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 text-center text-sm text-gray-500">
                        No permissions are assigned to this role.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                        {detailPermissionGroups.map((group) => (
                          <div
                            key={group.label}
                            className="rounded-xl border border-gray-200 p-4"
                          >
                            <div className="mb-3 flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-gray-900">
                                {group.label}
                              </h4>
                              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                                {group.permissions.length}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {group.permissions.map((permission) => (
                                <span
                                  key={permission}
                                  className="inline-flex items-center gap-1.5 rounded-md border border-indigo-100 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700"
                                >
                                  <CheckCircle size={12} />
                                  {formatPermissionLabel(permission)}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* ASSIGNED ADMINS */}

                  <section>
                    <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                      <div>
                        <h3 className="flex items-center gap-2 font-semibold text-gray-900">
                          <Users size={19} className="text-indigo-600" />
                          Assigned Admin Users
                        </h3>
                        <p className="mt-1 text-xs text-gray-500">
                          Admin accounts currently assigned to this role.
                        </p>
                      </div>
                      <span className="w-fit rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                        {detailRole.assignedAdminCount ??
                          assignedAdmins.length}{" "}
                        Admins
                      </span>
                    </div>

                    {assignedAdmins.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                        <UserRound className="mx-auto h-10 w-10 text-gray-300" />
                        <h4 className="mt-3 font-medium text-gray-800">
                          No Admins Assigned
                        </h4>
                        <p className="mt-1 text-sm text-gray-500">
                          No Admin accounts are currently using this role.
                        </p>
                      </div>
                    ) : (
                      <AssignedAdminTable admins={assignedAdmins} />
                    )}
                  </section>
                </div>
              ) : null}
            </div>

            <div className="flex justify-end border-t border-gray-200 px-5 py-4">
              <button
                type="button"
                onClick={closeRoleDetails}
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================
          CREATE / EDIT ROLE MODAL
      ====================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 sm:px-6">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-indigo-600" />
                  <h2 className="text-lg font-bold text-gray-900">
                    {modalMode === "create"
                      ? "Create Admin Role"
                      : "Edit Admin Role"}
                  </h2>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {modalMode === "create"
                    ? "Create a role and define its permissions."
                    : `Update the details and permissions for ${selectedRole?.name}.`}
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

            <form
              onSubmit={handleSubmit}
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

              {/* ROLE INFORMATION */}

              <div className="mb-7">
                <h3 className="mb-4 font-semibold text-gray-900">
                  Role Information
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Role Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      minLength={2}
                      maxLength={100}
                      placeholder="e.g. Shop Manager"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <input
                      type="text"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      maxLength={255}
                      placeholder="Describe this role's responsibilities"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>
              </div>

              {/* PERMISSION SELECTION */}

              <div>
                <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Assign Permissions
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Select the actions Admins with this role are allowed to
                      perform.
                    </p>
                  </div>

                  {canManageRolePermissions && (
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
                    >
                      {allPermissionsSelected ? "Deselect All" : "Select All"}
                    </button>
                  )}
                </div>

                {!canManageRolePermissions && (
                  <div className="mb-4 flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                    <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                    <span>
                      You can manage role details, but you do not have
                      permission to modify its permission list. Existing
                      permissions will be preserved.
                    </span>
                  </div>
                )}

                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-indigo-100 bg-indigo-50 p-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={19} className="text-indigo-600" />
                    <span className="text-sm font-medium text-indigo-900">
                      Selected Permissions
                    </span>
                  </div>
                  <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                    {formData.permissions.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {permissionGroups.map((group) => {
                    const selectedCount = group.permissions.filter(
                      (permission) =>
                        formData.permissions.includes(permission)
                    ).length;

                    const expanded = expandedGroups.includes(group.label);

                    const fullySelected =
                      group.permissions.length > 0 &&
                      selectedCount === group.permissions.length;

                    return (
                      <div
                        key={group.label}
                        className={`overflow-hidden rounded-xl border transition ${
                          selectedCount > 0
                            ? "border-indigo-200"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="flex flex-col justify-between gap-3 bg-gray-50 p-4 sm:flex-row sm:items-center">
                          <button
                            type="button"
                            onClick={() => toggleGroup(group.label)}
                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                              <ShieldCheck size={18} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-sm font-semibold text-gray-900">
                                  {group.label}
                                </h4>
                                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                                  {selectedCount}/{group.permissions.length}
                                </span>
                              </div>
                            </div>
                            <span className="ml-auto text-gray-400">
                              {expanded ? "−" : "+"}
                            </span>
                          </button>

                          {canManageRolePermissions && (
                            <button
                              type="button"
                              onClick={() => handleGroupSelection(group)}
                              className="shrink-0 text-left text-xs font-semibold text-indigo-600 hover:text-indigo-800 sm:text-right"
                            >
                              {fullySelected
                                ? "Deselect Group"
                                : "Select Group"}
                            </button>
                          )}
                        </div>

                        {expanded && (
                          <div className="grid grid-cols-1 gap-2 border-t border-gray-200 p-3 sm:grid-cols-2 lg:grid-cols-3">
                            {group.permissions.map((permission) => {
                              const checked =
                                formData.permissions.includes(permission);

                              return (
                                <label
                                  key={permission}
                                  className={`flex items-center gap-3 rounded-lg border p-3 transition ${
                                    !canManageRolePermissions
                                      ? "cursor-not-allowed border-gray-100 bg-gray-50"
                                      : checked
                                        ? "cursor-pointer border-indigo-300 bg-indigo-50"
                                        : "cursor-pointer border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={!canManageRolePermissions}
                                    onChange={() =>
                                      handlePermissionChange(permission)
                                    }
                                    className="h-4 w-4 shrink-0 accent-indigo-600"
                                  />
                                  <span
                                    className={`text-sm font-medium ${
                                      checked
                                        ? "text-indigo-800"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    {formatPermissionLabel(permission)}
                                  </span>
                                  {checked && (
                                    <CheckCircle
                                      size={15}
                                      className="ml-auto shrink-0 text-indigo-600"
                                    />
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {permissionGroups.length === 0 && (
                  <p className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                    No permissions are available for your account.
                  </p>
                )}
              </div>

              {/* FORM FOOTER */}

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
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting && (
                    <RefreshCw size={16} className="animate-spin" />
                  )}
                  {modalMode === "create"
                    ? submitting
                      ? "Creating..."
                      : "Create Role"
                    : submitting
                      ? "Saving..."
                      : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================
          DELETE / ACTIVATE / DEACTIVATE POPUP
      ====================================== */}

      <ConfirmActionModal
        action={confirmAction}
        onCancel={closeConfirmation}
        onConfirm={handleConfirmAction}
        loading={actionLoading !== null}
      />
    </div>
  );
};

export default AdminRoles;
