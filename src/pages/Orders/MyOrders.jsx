
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package,
  ShoppingBag,
  LoaderCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  RefreshCw,
  CalendarDays,
  CreditCard,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import orderService from "../../services/orderService";

// ======================================================
// HELPERS
// ======================================================

const ORDERS_PER_PAGE = 8;

const formatPrice = (price) =>
  `${Number(price || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ETB`;

const formatDate = (date) => {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const statusOptions = [
  { label: "All Orders", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const statusConfig = {
  PENDING: {
    label: "Pending",
    style: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  CONFIRMED: {
    label: "Confirmed",
    style: "bg-blue-100 text-blue-800",
    icon: CheckCircle,
  },
  SHIPPED: {
    label: "Shipped",
    style: "bg-purple-100 text-purple-800",
    icon: Truck,
  },
  DELIVERED: {
    label: "Delivered",
    style: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    style: "bg-red-100 text-red-800",
    icon: XCircle,
  },
};

const getStatusConfig = (status) =>
  statusConfig[status] || {
    label: status || "Unknown",
    style: "bg-gray-100 text-gray-700",
    icon: Package,
  };

const getPaymentLabel = (method) => {
  if (method === "CASH_ON_DELIVERY") return "Cash on Delivery";
  if (method === "CHAPA") return "Chapa";
  return method || "Not specified";
};

const getPaymentStyle = (status) => {
  switch (status) {
    case "PAID":
      return "text-green-600";
    case "FAILED":
      return "text-red-600";
    case "REFUNDED":
      return "text-purple-600";
    default:
      return "text-amber-600";
  }
};

// ======================================================
// COMPONENT
// ======================================================

const MyOrders = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);

  const [activeStatus, setActiveStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // ====================================================
  // FETCH ALL CUSTOMER ORDERS
  // ====================================================

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      navigate("/login", {
        replace: true,
        state: { from: "/my-orders" },
      });
      return;
    }

    let isMounted = true;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch the first page with the maximum allowed limit.
        const firstResult = await orderService.getMyOrders(1, 100);

        let allOrders = firstResult.orders || [];

        const totalPages = Math.max(
          1,
          Number(firstResult.pagination?.totalPages) || 1
        );

        // Fetch remaining pages if the customer has more than 100 orders.
        if (totalPages > 1) {
          const remainingPages = await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, index) =>
              orderService.getMyOrders(index + 2, 100)
            )
          );

          remainingPages.forEach((result) => {
            allOrders = [
              ...allOrders,
              ...(result.orders || []),
            ];
          });
        }

        if (isMounted) {
          setOrders(allOrders);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              "Unable to retrieve your orders. Please try again."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, authLoading, navigate, retryCount]);

  // ====================================================
  // FILTER ORDERS
  // ====================================================

  const filteredOrders = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        activeStatus === "ALL" || order.status === activeStatus;

      const matchesSearch =
        !search ||
        String(order.id).includes(search) ||
        order.items?.some((item) =>
          item.product?.name?.toLowerCase().includes(search)
        );

      return matchesStatus && matchesSearch;
    });
  }, [orders, activeStatus, searchTerm]);

  // ====================================================
  // STATUS COUNTS
  // ====================================================

  const getStatusCount = (status) => {
    if (status === "ALL") return orders.length;

    return orders.filter((order) => order.status === status).length;
  };

  // ====================================================
  // LOCAL PAGINATION
  // ====================================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / ORDERS_PER_PAGE)
  );

  const paginatedOrders = filteredOrders.slice(
    (page - 1) * ORDERS_PER_PAGE,
    page * ORDERS_PER_PAGE
  );

  const handleStatusChange = (status) => {
    setActiveStatus(status);
    setPage(1);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleRetry = () => {
    setRetryCount((previous) => previous + 1);
  };

  if (authLoading || (!isAuthenticated && loading)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoaderCircle
          size={36}
          className="animate-spin text-blue-600"
        />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* HEADER */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="text-xs font-bold tracking-widest text-gray-500">
              YOUR ACCOUNT
            </span>

            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              My Orders
            </h1>

            <p className="mt-2 text-gray-500">
              View and track all your purchases in one place.
            </p>
          </div>

          <Link
            to="/products"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            <ShoppingBag size={18} />
            Continue Shopping
          </Link>
        </div>

        {/* ERROR */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex flex-col justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center"
          >
            <p>{error}</p>

            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 font-semibold hover:text-red-900"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        )}

        {/* SUMMARY CARDS */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Orders</p>
                <h3 className="mt-2 text-2xl font-bold text-gray-900">
                  {loading ? "..." : getStatusCount("ALL")}
                </h3>
              </div>

              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Package size={25} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <h3 className="mt-2 text-2xl font-bold text-gray-900">
                  {loading ? "..." : getStatusCount("PENDING")}
                </h3>
              </div>

              <div className="rounded-xl bg-yellow-50 p-3 text-yellow-600">
                <Clock size={25} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Shipped</p>
                <h3 className="mt-2 text-2xl font-bold text-gray-900">
                  {loading ? "..." : getStatusCount("SHIPPED")}
                </h3>
              </div>

              <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
                <Truck size={25} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Delivered</p>
                <h3 className="mt-2 text-2xl font-bold text-gray-900">
                  {loading ? "..." : getStatusCount("DELIVERED")}
                </h3>
              </div>

              <div className="rounded-xl bg-green-50 p-3 text-green-600">
                <CheckCircle size={25} />
              </div>
            </div>
          </div>
        </div>

        {/* STATUS FILTERS */}
        <div className="mb-6 overflow-x-auto rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="flex min-w-max items-center gap-2">
            {statusOptions.map((status) => {
              const isActive = activeStatus === status.value;

              return (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => handleStatusChange(status.value)}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {status.label}

                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {loading ? "..." : getStatusCount(status.value)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SEARCH */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search order ID or product name..."
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
            <LoaderCircle
              size={36}
              className="animate-spin text-blue-600"
            />
            <p className="text-gray-500">
              Loading your orders...
            </p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && orders.length === 0 && (
          <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 text-center">
            <Package size={65} className="text-gray-300" />

            <h2 className="mt-5 text-2xl font-bold text-gray-900">
              No orders yet
            </h2>

            <p className="mt-2 max-w-md text-gray-500">
              Your purchases will appear here after you make your first order.
            </p>

            <Link
              to="/products"
              className="mt-6 rounded-xl bg-blue-600 px-7 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Start Shopping
            </Link>
          </div>
        )}

        {/* NO FILTER RESULTS */}
        {!loading && !error && orders.length > 0 && filteredOrders.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-16 text-center">
            <Search size={45} className="mx-auto text-gray-300" />

            <h2 className="mt-4 text-xl font-bold text-gray-900">
              No matching orders found
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Try changing your status filter or search term.
            </p>

            <button
              onClick={() => {
                setActiveStatus("ALL");
                setSearchTerm("");
                setPage(1);
              }}
              className="mt-5 font-semibold text-blue-600 hover:text-blue-700"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* ORDERS LIST */}
        {!loading && !error && paginatedOrders.length > 0 && (
          <div className="space-y-5">
            {paginatedOrders.map((order) => {
              const status = getStatusConfig(order.status);
              const StatusIcon = status.icon;
              const items = order.items || [];

              const totalQuantity = items.reduce(
                (total, item) => total + Number(item.quantity || 0),
                0
              );

              return (
                <article
                  key={order.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  {/* ORDER HEADER */}
                  <div className="flex flex-col justify-between gap-4 border-b border-gray-100 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Order Number
                        </p>

                        <h2 className="mt-1 text-lg font-bold text-gray-900">
                          #{order.id}
                        </h2>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Order Date
                        </p>

                        <p className="mt-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                          <CalendarDays size={15} />
                          {formatDate(order.createdAt)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Products
                        </p>

                        <p className="mt-1 text-sm font-medium text-gray-700">
                          {totalQuantity} item(s)
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${status.style}`}
                    >
                      <StatusIcon size={15} />
                      {status.label}
                    </span>
                  </div>

                  {/* PRODUCT INFORMATION */}
                  <div className="space-y-4 px-5 py-5 sm:px-6">
                    {items.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4"
                      >
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                          <Package size={24} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-semibold text-gray-900">
                            {item.product?.name || "Product unavailable"}
                          </h3>

                          <p className="mt-1 text-sm text-gray-500">
                            Quantity: {item.quantity}
                          </p>
                        </div>

                        <p className="whitespace-nowrap text-sm font-semibold text-gray-800">
                          {formatPrice(
                            Number(item.price) * Number(item.quantity)
                          )}
                        </p>
                      </div>
                    ))}

                    {items.length > 3 && (
                      <p className="text-sm font-semibold text-blue-600">
                        +{items.length - 3} more product(s)
                      </p>
                    )}

                    {items.length === 0 && (
                      <p className="text-sm text-gray-500">
                        No product information available.
                      </p>
                    )}
                  </div>

                  {/* ORDER FOOTER */}
                  <div className="flex flex-col justify-between gap-5 border-t border-gray-100 bg-gray-50 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
                    <div className="flex flex-wrap gap-8">
                      <div>
                        <p className="text-xs text-gray-400">
                          Order Total
                        </p>

                        <p className="mt-1 text-xl font-bold text-gray-900">
                          {formatPrice(order.totalPrice)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400">
                          Payment Method
                        </p>

                        <p className="mt-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                          <CreditCard size={15} />
                          {getPaymentLabel(order.paymentMethod)}
                        </p>

                        <p
                          className={`mt-1 text-xs font-semibold ${getPaymentStyle(
                            order.paymentStatus
                          )}`}
                        >
                          Payment: {order.paymentStatus || "PENDING"}
                        </p>
                      </div>
                    </div>

                    <Link
                      to={`/order-confirmation/${order.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-600 bg-white px-5 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-600 hover:text-white"
                    >
                      <Eye size={17} />
                      View Details
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* PAGINATION */}
        {!loading && !error && filteredOrders.length > 0 && (
          <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row">
            <p className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-semibold text-gray-900">
                {(page - 1) * ORDERS_PER_PAGE + 1}
              </span>
              {" - "}
              <span className="font-semibold text-gray-900">
                {Math.min(
                  page * ORDERS_PER_PAGE,
                  filteredOrders.length
                )}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-900">
                {filteredOrders.length}
              </span>{" "}
              orders
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  setPage((previous) => Math.max(1, previous - 1))
                }
                disabled={page <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={17} />
                Previous
              </button>

              <span className="text-sm font-semibold text-gray-700">
                {page} / {totalPages}
              </span>

              <button
                onClick={() =>
                  setPage((previous) =>
                    Math.min(totalPages, previous + 1)
                  )
                }
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default MyOrders;
