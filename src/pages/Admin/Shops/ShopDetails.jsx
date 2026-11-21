
import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Store,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  RefreshCw,
  LoaderCircle,
  AlertCircle,
  X,
  ShieldCheck,
  AlertTriangle,
  Lock,
} from "lucide-react";

import adminService from "../../../services/adminService";
import { useAuth } from "../../../context/AuthContext";

// ==========================================
// SHOP STATUS STYLES
// ==========================================

const statusStyles = {
  ACTIVE: "bg-green-100 text-green-800",
  DEACTIVATED: "bg-red-100 text-red-800",
};

// ==========================================
// FORMAT DATE
// ==========================================

const formatDate = (date) => {
  if (!date) return "Not available";

  return new Date(date).toLocaleString();
};

// ==========================================
// STATUS ACTION CONFIGURATION
// ==========================================

const actionConfig = {
  ACTIVE: {
    title: "Activate Shop",
    description:
      "Are you sure you want to activate this shop? Customers will be able to access its products again.",
    button: "Activate Shop",
    buttonClass: "bg-green-600 hover:bg-green-700",
    icon: CheckCircle,
    iconClass: "bg-green-100 text-green-600",
  },

  DEACTIVATED: {
    title: "Deactivate Shop",
    description:
      "Are you sure you want to deactivate this shop? Its products will no longer be available to customers.",
    button: "Deactivate Shop",
    buttonClass: "bg-red-600 hover:bg-red-700",
    icon: XCircle,
    iconClass: "bg-red-100 text-red-600",
  },
};

const ShopDetails = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();

  const { user } = useAuth();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const permissions = user?.adminPermissions || [];

  const hasPermission = (permission) =>
    isSuperAdmin || permissions.includes(permission);

  const canViewShops = hasPermission("VIEW_SHOPS");
  const canActivateShops = hasPermission("ACTIVATE_SHOPS");
  const canDeactivateShops = hasPermission("DEACTIVATE_SHOPS");

  // ==========================================
  // STATE
  // ==========================================

  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modalAction, setModalAction] = useState("");

  // ==========================================
  // FETCH SHOP DETAILS
  // ==========================================

  const fetchShop = useCallback(async () => {
    if (!canViewShops) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await adminService.getShopById(shopId);

      setShop(response.shop);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load shop details."
      );
    } finally {
      setLoading(false);
    }
  }, [shopId, canViewShops]);

  useEffect(() => {
    fetchShop();
  }, [fetchShop]);

  // ==========================================
  // MODAL HANDLERS
  // ==========================================

  const openActionModal = (status) => {
    setError("");
    setSuccess("");
    setModalAction(status);
  };

  const closeActionModal = () => {
    if (updating) return;

    setModalAction("");
  };

  // ==========================================
  // UPDATE SHOP STATUS
  // ==========================================

  const updateShopStatus = async () => {
    if (!modalAction || updating || !shop) return;

    const hasRequiredPermission =
      modalAction === "ACTIVE"
        ? canActivateShops
        : modalAction === "DEACTIVATED"
          ? canDeactivateShops
          : false;

    if (!hasRequiredPermission) {
      setError(
        "You do not have permission to perform this action."
      );
      setModalAction("");
      return;
    }

    if (shop.status === modalAction) {
      setError(
        `This shop is already ${modalAction.toLowerCase()}.`
      );
      setModalAction("");
      return;
    }

    try {
      setUpdating(true);
      setError("");
      setSuccess("");

      const response = await adminService.updateShopStatus(
        shopId,
        modalAction
      );

      setShop(response.shop);

      setSuccess(
        response.message ||
          `Shop ${modalAction.toLowerCase()} successfully.`
      );

      setModalAction("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update shop status."
      );
    } finally {
      setUpdating(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // ==========================================
  // ACCESS DENIED
  // ==========================================

  if (!canViewShops) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          <ShieldCheck className="mb-2" size={24} />

          <h2 className="font-semibold">
            Access Denied
          </h2>

          <p className="mt-2 text-sm">
            You do not have permission to view shop details.
          </p>

          <Link
            to="/admin"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // SHOP NOT FOUND
  // ==========================================

  if (!shop) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Link
          to="/admin/shops"
          className="mb-6 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={18} />
          Back to Shops
        </Link>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          <AlertCircle className="mb-2" size={24} />

          <p>{error || "Shop not found."}</p>

          <button
            type="button"
            onClick={fetchShop}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // ACTION PERMISSIONS
  // ==========================================

  const canPerformCurrentAction =
    modalAction === "ACTIVE"
      ? canActivateShops
      : modalAction === "DEACTIVATED"
        ? canDeactivateShops
        : false;

  const currentAction = actionConfig[modalAction];
  const ActionIcon = currentAction?.icon;

  const availableActions = [];

  if (shop.status === "ACTIVE" && canDeactivateShops) {
    availableActions.push("DEACTIVATED");
  }

  if (shop.status === "DEACTIVATED" && canActivateShops) {
    availableActions.push("ACTIVE");
  }

  const hasAvailableActions = availableActions.length > 0;

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to="/admin/shops"
            className="mb-3 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft size={18} />
            Back to Shops
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">
            Shop Details
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View shop information and manage its activation status.
          </p>
        </div>

        <span
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            statusStyles[shop.status] ||
            "bg-gray-100 text-gray-700"
          }`}
        >
          {shop.status === "ACTIVE"
            ? "Active"
            : shop.status === "DEACTIVATED"
              ? "Deactivated"
              : shop.status}
        </span>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={20} className="shrink-0" />

          <p>{error}</p>

          <button
            type="button"
            onClick={() => setError("")}
            className="ml-auto text-red-500 hover:text-red-800"
            aria-label="Dismiss error"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle size={20} className="shrink-0" />

          <p>{success}</p>

          <button
            type="button"
            onClick={() => setSuccess("")}
            className="ml-auto text-green-600 hover:text-green-800"
            aria-label="Dismiss success"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Cover Image */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="h-48 bg-gray-100 sm:h-64">
          {shop.coverImage ? (
            <img
              src={shop.coverImage}
              alt={`${shop.name} cover`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              <Store size={56} />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 p-5">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
            {shop.logo ? (
              <img
                src={shop.logo}
                alt={`${shop.name} logo`}
                className="h-full w-full object-cover"
              />
            ) : (
              <Store size={32} className="text-gray-400" />
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {shop.name}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {shop.shopCategory?.name || "Uncategorized"}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Shop ID: {shop.id}
            </p>
          </div>
        </div>
      </div>

      {/* Shop Information and Owner Information */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Shop Information */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-5 flex items-center gap-2">
            <Store className="text-blue-600" size={21} />

            <h3 className="text-lg font-semibold text-gray-900">
              Shop Information
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Description
              </p>

              <p className="mt-1 text-sm leading-6 text-gray-700">
                {shop.description || "No description provided."}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Category
              </p>

              <p className="mt-1 text-sm text-gray-800">
                {shop.shopCategory?.name || "Not provided"}
              </p>
            </div>

            <div className="flex items-start gap-3">
              <MapPin size={18} className="mt-1 text-gray-400" />

              <div>
                <p className="text-xs font-medium uppercase text-gray-400">
                  Address
                </p>

                <p className="mt-1 text-sm text-gray-700">
                  {[shop.address, shop.city, shop.region]
                    .filter(Boolean)
                    .join(", ") || "Not provided"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone size={18} className="text-gray-400" />

              <div>
                <p className="text-xs font-medium uppercase text-gray-400">
                  Shop Phone
                </p>

                <p className="mt-1 text-sm text-gray-700">
                  {shop.phone || "Not provided"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail size={18} className="text-gray-400" />

              <div>
                <p className="text-xs font-medium uppercase text-gray-400">
                  Shop Email
                </p>

                <p className="mt-1 text-sm text-gray-700">
                  {shop.email || "Not provided"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Shop Owner */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-5 flex items-center gap-2">
            <User className="text-blue-600" size={21} />

            <h3 className="text-lg font-semibold text-gray-900">
              Shop Owner
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Full Name
              </p>

              <p className="mt-1 text-sm font-medium text-gray-800">
                {shop.owner?.name || "Not available"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Mail size={18} className="text-gray-400" />

              <div>
                <p className="text-xs font-medium uppercase text-gray-400">
                  Email
                </p>

                <p className="mt-1 break-all text-sm text-gray-700">
                  {shop.owner?.email || "Not available"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone size={18} className="text-gray-400" />

              <div>
                <p className="text-xs font-medium uppercase text-gray-400">
                  Phone
                </p>

                <p className="mt-1 text-sm text-gray-700">
                  {shop.owner?.phone || "Not provided"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Account Status
              </p>

              <span
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  shop.owner?.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {shop.owner?.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Registration Information */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-5 flex items-center gap-2">
          <Calendar className="text-blue-600" size={21} />

          <h3 className="text-lg font-semibold text-gray-900">
            Registration Information
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase text-gray-400">
              Registration Date
            </p>

            <p className="mt-1 text-sm text-gray-700">
              {formatDate(shop.createdAt)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-gray-400">
              Last Updated
            </p>

            <p className="mt-1 text-sm text-gray-700">
              {formatDate(shop.updatedAt)}
            </p>
          </div>
        </div>
      </section>

      {/* Shop Status Management */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck size={21} className="text-blue-600" />

          <h3 className="text-lg font-semibold text-gray-900">
            Shop Status Management
          </h3>
        </div>

        <p className="mt-1 text-sm text-gray-500">
          Activate or deactivate this shop based on your assigned permissions.
        </p>

        {hasAvailableActions ? (
          <div className="mt-5 flex flex-wrap gap-3">
            {shop.status === "ACTIVE" && canDeactivateShops && (
              <button
                type="button"
                onClick={() => openActionModal("DEACTIVATED")}
                disabled={updating}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <XCircle size={18} />
                Deactivate Shop
              </button>
            )}

            {shop.status === "DEACTIVATED" && canActivateShops && (
              <button
                type="button"
                onClick={() => openActionModal("ACTIVE")}
                disabled={updating}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw size={18} />
                Activate Shop
              </button>
            )}
          </div>
        ) : (
          <div className="mt-5 flex items-start gap-3 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
            <Lock size={19} className="mt-0.5 shrink-0 text-gray-400" />

            <p>
              {shop.status === "ACTIVE" ||
              shop.status === "DEACTIVATED"
                ? "You do not have permission to perform the available status action on this shop."
                : "This shop has an unsupported status. Please contact your Super Admin."}
            </p>
          </div>
        )}

        {updating && (
          <p className="mt-4 flex items-center gap-2 text-sm text-blue-600">
            <LoaderCircle size={17} className="animate-spin" />
            Updating shop status...
          </p>
        )}
      </section>

      {/* Back Button */}
      <div className="flex justify-start">
        <button
          type="button"
          onClick={() => navigate("/admin/shops")}
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to Shop Management
        </button>
      </div>

      {/* Confirmation Modal */}
      {modalAction && currentAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeActionModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="shop-action-title"
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2
                id="shop-action-title"
                className="text-lg font-bold text-gray-900"
              >
                {currentAction.title}
              </h2>

              <button
                type="button"
                onClick={closeActionModal}
                disabled={updating}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${currentAction.iconClass}`}
                >
                  <ActionIcon size={25} />
                </div>

                <div>
                  <p className="font-semibold text-gray-900">
                    {shop.name}
                  </p>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    {currentAction.description}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-start gap-2 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
                <AlertTriangle
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <p>
                  Please confirm that you want to perform this action on
                  this shop.
                </p>
              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeActionModal}
                  disabled={updating}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={updateShopStatus}
                  disabled={
                    updating ||
                    !canPerformCurrentAction
                  }
                  className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${currentAction.buttonClass}`}
                >
                  {updating ? (
                    <>
                      <LoaderCircle
                        size={17}
                        className="animate-spin"
                      />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={17} />
                      {currentAction.button}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopDetails;
