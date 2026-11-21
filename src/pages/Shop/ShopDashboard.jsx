
import { Link } from "react-router-dom";
import {
  Package,
  ShoppingBag,
  Clock,
  DollarSign,
  Store,
  TrendingUp,
  ArrowUpRight,
  ArrowRight,
  BarChart3,
  Star,
  Truck,
  CircleCheck,
  AlertCircle,
  CalendarDays,
  Layers,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

// ==========================================
// DASHBOARD STATISTICS
// ==========================================

const stats = [
  {
    title: "Total Products",
    value: "—",
    subtitle: "Products in your shop",
    icon: Package,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
    link: "/shop/products",
  },
  {
    title: "Total Orders",
    value: "—",
    subtitle: "All customer orders",
    icon: ShoppingBag,
    iconColor: "text-purple-600",
    iconBg: "bg-purple-50",
    link: "/shop/orders",
  },
  {
    title: "Pending Orders",
    value: "—",
    subtitle: "Orders awaiting action",
    icon: Clock,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50",
    link: "/shop/orders",
  },
  {
    title: "Total Revenue",
    value: "—",
    subtitle: "Your shop earnings",
    icon: DollarSign,
    iconColor: "text-green-600",
    iconBg: "bg-green-50",
    link: "/shop/orders",
  },
];

// ==========================================
// ORDER STATUSES
// ==========================================

const orderStatuses = [
  {
    title: "Pending",
    description: "Awaiting confirmation",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    title: "Processing",
    description: "Currently being prepared",
    icon: Truck,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Completed",
    description: "Successfully delivered",
    icon: CircleCheck,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    title: "Cancelled",
    description: "Cancelled orders",
    icon: AlertCircle,
    color: "text-red-600",
    bg: "bg-red-50",
  },
];

// ==========================================
// EMPTY SALES CHART
// ==========================================

const EmptyChart = () => (
  <div className="relative mt-6 h-64 overflow-hidden rounded-lg">
    <div className="absolute inset-0 flex flex-col justify-between">
      {[1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          className="border-t border-dashed border-gray-200"
        />
      ))}
    </div>

    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
        <BarChart3 size={27} className="text-blue-500" />
      </div>

      <p className="mt-4 text-sm font-semibold text-gray-700">
        No sales analytics available yet
      </p>

      <p className="mt-1 text-center text-xs text-gray-400">
        Your sales performance chart will appear here
        <br />
        when analytics data is connected.
      </p>
    </div>
  </div>
);

// ==========================================
// SHOP DASHBOARD
// ==========================================

const ShopDashboard = () => {
  const { user } = useAuth();

  const shop = user?.shop;

  const shopStatus = shop?.status || "ACTIVE";

  const isShopActive = shopStatus === "ACTIVE";

  // ==========================================
  // DASHBOARD
  // ==========================================

  return (
    <div className="space-y-8">

      {/* DASHBOARD HEADER */}

      <section>
        <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
          <Store size={16} />
          <span>Shop Management</span>
          <span>/</span>
          <span className="font-medium text-blue-600">
            Dashboard
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Dashboard Overview
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Welcome back, {user?.name || "Shop Owner"}!
          Here's an overview of your shop.
        </p>
      </section>

      {/* SHOP INFORMATION */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500" />

        <div className="flex flex-col justify-between gap-5 p-5 sm:flex-row sm:items-center sm:p-6">

          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-blue-50 text-blue-600">
              {shop?.logo ? (
                <img
                  src={shop.logo}
                  alt={shop.name || "Shop logo"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Store size={30} />
              )}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Your Business
              </p>

              <h2 className="mt-1 truncate text-xl font-bold text-gray-900">
                {shop?.name || "My Shop"}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {shop?.category || "Shop Owner"}
              </p>
            </div>
          </div>

          {/* SHOP STATUS AND SETTINGS */}

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${
                isShopActive
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isShopActive
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              />

              {shopStatus}
            </span>

            <Link
              to="/shop/settings"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Shop Settings
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>

        {shop?.description && (
          <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
            <p className="text-sm leading-6 text-gray-600">
              {shop.description}
            </p>
          </div>
        )}
      </section>

      {/* BUSINESS STATISTICS */}

      <section>
        <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Business Statistics
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Monitor your shop's overall performance.
            </p>
          </div>

          <span className="inline-flex items-center gap-2 text-xs text-gray-400">
            <CalendarDays size={15} />
            All-time overview
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Link
                key={stat.title}
                to={stat.link}
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      {stat.title}
                    </p>

                    <h3 className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
                      {stat.value}
                    </h3>
                  </div>

                  <div
                    className={`rounded-xl p-3 ${stat.iconBg} ${stat.iconColor}`}
                  >
                    <Icon size={23} />
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    {stat.subtitle}
                  </p>

                  <ArrowUpRight
                    size={17}
                    className="text-gray-300 transition group-hover:text-blue-600"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* SALES PERFORMANCE AND ORDER STATUS */}

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">

        {/* SALES CHART */}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-2 sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Sales Performance
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Track your revenue over time.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-500">
              <CalendarDays size={15} />
              This Month
              <span className="text-gray-400">⌄</span>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <div>
              <p className="text-xs text-gray-400">
                Total Revenue
              </p>

              <h3 className="mt-1 text-2xl font-bold text-gray-900">
                ETB —
              </h3>
            </div>

            <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
              <TrendingUp size={13} />
              Awaiting data
            </span>
          </div>

          <EmptyChart />
        </div>

        {/* ORDER STATUS */}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Order Overview
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Track your order fulfillment.
            </p>
          </div>

          <div className="mt-6 space-y-5">
            {orderStatuses.map((status) => {
              const Icon = status.icon;

              return (
                <div
                  key={status.title}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${status.bg} ${status.color}`}
                    >
                      <Icon size={19} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800">
                        {status.title}
                      </p>

                      <p className="truncate text-xs text-gray-400">
                        {status.description}
                      </p>
                    </div>
                  </div>

                  <span className="text-lg font-bold text-gray-400">
                    —
                  </span>
                </div>
              );
            })}
          </div>

          <Link
            to="/shop/orders"
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          >
            View All Orders
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* TOP PRODUCTS AND CUSTOMER REVIEWS */}

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">

        {/* TOP PRODUCTS */}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Top Selling Products
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your best-performing products.
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Package size={21} />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
              <Layers size={26} className="text-gray-400" />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-gray-800">
              No product analytics available
            </h3>

            <p className="mt-1 max-w-xs text-xs leading-5 text-gray-400">
              Your top-selling products will appear here once sales data is available.
            </p>

            <Link
              to="/shop/products"
              className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Manage Products
            </Link>
          </div>
        </div>

        {/* CUSTOMER REVIEWS */}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Customer Reviews
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                See what customers say about your products.
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <Star size={21} />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
              <Star size={26} className="text-gray-400" />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-gray-800">
              No review statistics available
            </h3>

            <p className="mt-1 max-w-xs text-xs leading-5 text-gray-400">
              Customer ratings and reviews will appear here when review data is connected.
            </p>

            <Link
              to="/shop/reviews"
              className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View Reviews
            </Link>
          </div>
        </div>
      </section>

      {/* RECENT ORDERS */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Recent Orders
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Keep track of your latest customer orders.
            </p>
          </div>

          <Link
            to="/shop/orders"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            View All Orders
            <ArrowRight size={17} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Order ID
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Customer
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Date
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Amount
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <ShoppingBag
                    size={34}
                    className="mx-auto text-gray-300"
                  />

                  <p className="mt-3 text-sm font-semibold text-gray-700">
                    No recent orders
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Your latest customer orders will appear here.
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ShopDashboard;
