
import { useCallback, useEffect, useState } from "react";

import {
  ClipboardList,
  Eye,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Package,
  UserRound,
  Store,
  CreditCard,
  CalendarDays,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle,
  Clock,
  Truck,
  Ban,
} from "lucide-react";

import adminService from "../../../services/adminService";

// ==========================================
// ORDER CONFIGURATION
// ==========================================

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const PAYMENT_STATUSES = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
];

const STATUS_TRANSITIONS = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

// ==========================================
// STATUS STYLING
// ==========================================

const getStatusStyle = (status) => {
  const styles = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
    SHIPPED: "bg-indigo-50 text-indigo-700 border-indigo-200",
    DELIVERED: "bg-green-50 text-green-700 border-green-200",
    CANCELLED: "bg-red-50 text-red-700 border-red-200",

    PAID: "bg-green-50 text-green-700 border-green-200",
    FAILED: "bg-red-50 text-red-700 border-red-200",
    REFUNDED: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return styles[status] || "bg-gray-50 text-gray-600 border-gray-200";
};

// ==========================================
// FORMATTERS
// ==========================================

const formatCurrency = (amount) =>
  `${Number(amount || 0).toLocaleString("en-ET", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ETB`;

const formatDate = (date) => {
  if (!date) return "N/A";

  return new Date(date).toLocaleString("en-ET", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatLabel = (value) => {
  if (!value) return "N/A";

  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// ==========================================
// STATUS BADGE
// ==========================================

const StatusBadge = ({ status }) => (
  <span
    className={`
      inline-flex items-center rounded-full border
      px-2.5 py-1 text-[11px] font-semibold
      ${getStatusStyle(status)}
    `}
  >
    {formatLabel(status)}
  </span>
);

// ==========================================
// AVAILABLE STATUS TRANSITIONS
// ==========================================

const getAvailableStatuses = (order) => {
  const available = STATUS_TRANSITIONS[order?.status] || [];

  // Paid orders cannot be cancelled without refund handling.
  if (order?.paymentStatus === "PAID") {
    return available.filter((status) => status !== "CANCELLED");
  }

  return available;
};

// ==========================================
// REUSABLE INFORMATION ITEM
// ==========================================

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
      <Icon size={17} />
    </div>

    <div className="min-w-0">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-gray-800">
        {value || "N/A"}
      </p>
    </div>
  </div>
);

// ==========================================
// ORDER DETAILS MODAL
// ==========================================

const OrderDetailsModal = ({
  order,
  onClose,
  onUpdate,
  updating,
}) => {
  const availableStatuses = getAvailableStatuses(order);

  const [nextStatus, setNextStatus] = useState(
    availableStatuses[0] || ""
  );

  const [error, setError] = useState("");

  if (!order) return null;

  const handleUpdate = async () => {
    if (!nextStatus) return;

    setError("");

    try {
      await onUpdate(order.id, nextStatus);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update order status."
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-modal-title"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* MODAL HEADER */}

        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <h2
              id="order-modal-title"
              className="text-lg font-bold text-gray-900"
            >
              Order Details
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Order #{order.id}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close order details"
          >
            <X size={20} />
          </button>
        </div>

        {/* MODAL CONTENT */}

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">

          {/* ORDER STATUS */}

          <div className="flex flex-wrap items-center gap-3">
            <div>
              <p className="mb-1 text-xs text-gray-400">
                Order Status
              </p>
              <StatusBadge status={order.status} />
            </div>

            <div>
              <p className="mb-1 text-xs text-gray-400">
                Payment Status
              </p>
              <StatusBadge status={order.paymentStatus} />
            </div>

            <div>
              <p className="mb-1 text-xs text-gray-400">
                Order Date
              </p>
              <p className="text-xs font-medium text-gray-700">
                {formatDate(order.createdAt)}
              </p>
            </div>
          </div>

          {/* CUSTOMER AND SHOP */}

          <div className="grid gap-5 sm:grid-cols-2">

            <div className="rounded-xl border border-gray-100 p-4">
              <div className="mb-4 flex items-center gap-2">
                <UserRound size={17} className="text-indigo-600" />
                <h3 className="text-sm font-bold text-gray-900">
                  Customer Information
                </h3>
              </div>

              <div className="space-y-3">
                <InfoItem
                  icon={UserRound}
                  label="Customer Name"
                  value={order.user?.name}
                />

                <InfoItem
                  icon={Mail}
                  label="Email"
                  value={order.user?.email}
                />

                <InfoItem
                  icon={Phone}
                  label="Phone"
                  value={order.user?.phone}
                />
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 p-4">
              <div className="mb-4 flex items-center gap-2">
                <Store size={17} className="text-indigo-600" />
                <h3 className="text-sm font-bold text-gray-900">
                  Shop Information
                </h3>
              </div>

              <div className="space-y-3">
                <InfoItem
                  icon={Store}
                  label="Shop Name"
                  value={order.shop?.name}
                />

                <InfoItem
                  icon={Package}
                  label="Products Ordered"
                  value={`${order.items?.length || 0} item types`}
                />
              </div>
            </div>
          </div>

          {/* SHIPPING INFORMATION */}

          <div className="rounded-xl border border-gray-100 p-4">
            <div className="mb-4 flex items-center gap-2">
              <MapPin size={17} className="text-indigo-600" />
              <h3 className="text-sm font-bold text-gray-900">
                Shipping Information
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoItem
                icon={UserRound}
                label="Recipient"
                value={order.shippingName}
              />

              <InfoItem
                icon={Phone}
                label="Shipping Phone"
                value={order.shippingPhone}
              />

              <InfoItem
                icon={MapPin}
                label="Address"
                value={order.shippingAddress}
              />

              <InfoItem
                icon={MapPin}
                label="City / Country"
                value={[
                  order.shippingCity,
                  order.shippingCountry,
                ]
                  .filter(Boolean)
                  .join(", ")}
              />
            </div>
          </div>

          {/* ORDER ITEMS */}

          <div>
            <div className="mb-3 flex items-center gap-2">
              <Package size={17} className="text-indigo-600" />
              <h3 className="text-sm font-bold text-gray-900">
                Ordered Products
              </h3>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-100">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500">
                        Product
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500">
                        Unit Price
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">
                        Subtotal
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {order.items?.map((item, index) => {
                      const productName =
                        item.product?.name ||
                        item.product?.title ||
                        "Product";

                      return (
                        <tr key={item.id || index}>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-800">
                              {productName}
                            </p>
                          </td>

                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.quantity}
                          </td>

                          <td className="px-4 py-3 text-sm text-gray-600">
                            {formatCurrency(item.price)}
                          </td>

                          <td className="px-4 py-3 text-right text-sm font-semibold text-gray-800">
                            {formatCurrency(
                              Number(item.price || 0) *
                                Number(item.quantity || 0)
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {!order.items?.length && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-6 text-center text-sm text-gray-400"
                        >
                          No order items found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-4">
                <span className="text-sm font-semibold text-gray-600">
                  Order Total
                </span>

                <span className="text-lg font-extrabold text-gray-900">
                  {formatCurrency(order.totalPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* PAYMENT INFORMATION */}

          <div className="rounded-xl border border-gray-100 p-4">
            <div className="mb-3 flex items-center gap-2">
              <CreditCard size={17} className="text-indigo-600" />
              <h3 className="text-sm font-bold text-gray-900">
                Payment Information
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoItem
                icon={CreditCard}
                label="Payment Method"
                value={formatLabel(order.paymentMethod)}
              />

              <InfoItem
                icon={CheckCircle}
                label="Payment Status"
                value={formatLabel(order.paymentStatus)}
              />
            </div>
          </div>

          {/* STATUS UPDATE */}

          {availableStatuses.length > 0 && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
              <h3 className="text-sm font-bold text-gray-900">
                Update Order Status
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                Select the next valid status for this order.
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <select
                  value={nextStatus}
                  onChange={(event) =>
                    setNextStatus(event.target.value)
                  }
                  className="min-h-11 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  {availableStatuses.map((status) => (
                    <option key={status} value={status}>
                      {formatLabel(status)}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={!nextStatus || updating}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updating ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle size={16} />
                  )}

                  {updating ? "Updating..." : "Update Status"}
                </button>
              </div>

              {error && (
                <p className="mt-3 flex items-center gap-2 text-xs text-red-600">
                  <AlertCircle size={14} />
                  {error}
                </p>
              )}
            </div>
          )}

          {order.paymentStatus === "PAID" &&
            ["PENDING", "CONFIRMED"].includes(order.status) && (
              <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                This order is paid. Cancellation is unavailable through
                this page because refund handling is not implemented.
              </p>
            )}
        </div>

        {/* MODAL FOOTER */}

        <div className="shrink-0 border-t border-gray-100 px-5 py-3 text-right sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// ADMIN ORDERS PAGE
// ==========================================

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    limit: 10,
  });

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);

  // ==========================================
  // FETCH ORDERS
  // ==========================================

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await adminService.getOrders({
        page,
        limit: 10,
        ...(statusFilter ? { status: statusFilter } : {}),
      });

      setOrders(
        Array.isArray(response?.data) ? response.data : []
      );

      setPagination(
        response?.pagination || {
          currentPage: page,
          totalPages: 1,
          totalOrders: 0,
          limit: 10,
        }
      );
    } catch (err) {
      console.error("Failed to fetch orders:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load orders. Please try again."
      );

      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ==========================================
  // FILTER HANDLER
  // ==========================================

  const handleFilterChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  // ==========================================
  // UPDATE ORDER STATUS
  // ==========================================

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      setUpdating(true);

      await adminService.updateOrderStatus(orderId, status);

      await fetchOrders();

      setSelectedOrder(null);
    } catch (err) {
      console.error("Failed to update order status:", err);
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  // ==========================================
  // OPEN ORDER DETAILS
  // ==========================================

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
  };

  // ==========================================
  // SUMMARY COUNTS
  // ==========================================

  const pendingCount = orders.filter(
    (order) => order.status === "PENDING"
  ).length;

  const confirmedCount = orders.filter(
    (order) => order.status === "CONFIRMED"
  ).length;

  const deliveredCount = orders.filter(
    (order) => order.status === "DELIVERED"
  ).length;

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <ClipboardList size={22} />
            </div>

            <div>
              <h1 className="text-xl font-extrabold text-gray-900 sm:text-2xl">
                Order Management
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                View and manage marketplace orders.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchOrders}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* SUMMARY CARDS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">
                Total Orders
              </p>

              <h3 className="mt-2 text-2xl font-extrabold text-gray-900">
                {pagination.totalOrders || 0}
              </h3>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <ShoppingBagIcon />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">
                Pending Orders
              </p>

              <h3 className="mt-2 text-2xl font-extrabold text-amber-600">
                {pendingCount}
              </h3>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">
                Confirmed Orders
              </p>

              <h3 className="mt-2 text-2xl font-extrabold text-blue-600">
                {confirmedCount}
              </h3>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CheckCircle size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">
                Delivered Orders
              </p>

              <h3 className="mt-2 text-2xl font-extrabold text-green-600">
                {deliveredCount}
              </h3>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <Truck size={21} />
            </div>
          </div>
        </div>
      </div>

      {/* ORDERS TABLE */}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

        {/* TABLE HEADER */}

        <div className="flex flex-col justify-between gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              All Orders
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Manage and track customer orders.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  handleFilterChange(event.target.value)
                }
                className="h-10 w-full appearance-none rounded-lg border border-gray-200 bg-white pl-9 pr-8 text-sm text-gray-700 outline-none transition focus:border-indigo-500 sm:w-48"
              >
                <option value="">All Statuses</option>

                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {formatLabel(status)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="m-5 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            <AlertCircle size={18} />
            <span>{error}</span>

            <button
              type="button"
              onClick={fetchOrders}
              className="ml-auto font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* TABLE */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">

            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Order
                </th>

                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Customer
                </th>

                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Shop
                </th>

                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Total
                </th>

                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Payment
                </th>

                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Status
                </th>

                <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">

              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <RefreshCw
                      size={25}
                      className="mx-auto animate-spin text-indigo-600"
                    />

                    <p className="mt-3 text-sm text-gray-500">
                      Loading orders...
                    </p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-50 text-gray-400">
                      <ClipboardList size={25} />
                    </div>

                    <p className="mt-3 text-sm font-semibold text-gray-700">
                      No orders found
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      There are no orders matching your selected filter.
                    </p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className="transition hover:bg-gray-50/70"
                  >
                    {/* ORDER */}

                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-gray-900">
                        #{order.id}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {formatDate(order.createdAt)}
                      </p>
                    </td>

                    {/* CUSTOMER */}

                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-gray-800">
                        {order.user?.name || "N/A"}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {order.user?.email || "N/A"}
                      </p>
                    </td>

                    {/* SHOP */}

                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-gray-700">
                        {order.shop?.name || "N/A"}
                      </p>
                    </td>

                    {/* TOTAL */}

                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-gray-900">
                        {formatCurrency(order.totalPrice)}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {order.items?.length || 0} item types
                      </p>
                    </td>

                    {/* PAYMENT */}

                    <td className="px-5 py-4">
                      <p className="mb-1 text-xs font-medium text-gray-600">
                        {formatLabel(order.paymentMethod)}
                      </p>

                      <StatusBadge status={order.paymentStatus} />
                    </td>

                    {/* STATUS */}

                    <td className="px-5 py-4">
                      <StatusBadge status={order.status} />
                    </td>

                    {/* ACTION */}

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleViewOrder(order)}
                        className="inline-flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100"
                      >
                        <Eye size={15} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}

            </tbody>
          </table>
        </div>

        {/* PAGINATION */}

        {!loading && orders.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row">
            <p className="text-xs text-gray-500">
              Showing page{" "}
              <span className="font-semibold text-gray-800">
                {pagination.currentPage || page}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-800">
                {pagination.totalPages || 1}
              </span>{" "}
              ({pagination.totalOrders || 0} total orders)
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.max(1, current - 1))
                }
                disabled={page <= 1}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={15} />
                Previous
              </button>

              <span className="px-2 text-xs font-semibold text-gray-700">
                {pagination.currentPage || page}
              </span>

              <button
                type="button"
                onClick={() =>
                  setPage((current) =>
                    Math.min(
                      pagination.totalPages || 1,
                      current + 1
                    )
                  )
                }
                disabled={
                  page >= (pagination.totalPages || 1)
                }
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ORDER DETAILS MODAL */}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={handleUpdateOrderStatus}
          updating={updating}
        />
      )}
    </div>
  );
};

// ==========================================
// SHOPPING BAG ICON
// ==========================================

const ShoppingBagIcon = () => (
  <Package size={21} />
);

export default AdminOrders;
