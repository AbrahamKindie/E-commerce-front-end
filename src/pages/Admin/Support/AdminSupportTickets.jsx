
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  RefreshCw,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Filter,
} from "lucide-react";

import { useAuth } from "../../../context/AuthContext";
import { getAdminSupportTickets } from "../../../services/adminSupportApi";

const STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_USER",
  "RESOLVED",
  "REJECTED",
  "CLOSED",
];

const CATEGORIES = [
  "ACCOUNT",
  "ORDER",
  "PAYMENT",
  "PRODUCT",
  "SHOP",
  "SHIPPING",
  "RETURN_REFUND",
  "TECHNICAL",
  "OTHER",
];

const statusStyles = {
  OPEN: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  WAITING_FOR_USER: "bg-purple-100 text-purple-700",
  RESOLVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  CLOSED: "bg-gray-100 text-gray-600",
};

const priorityStyles = {
  LOW: "text-gray-500",
  NORMAL: "text-blue-600",
  HIGH: "text-orange-600",
  URGENT: "text-red-600",
};

const formatLabel = (value = "") =>
  value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const getErrorMessage = (error) =>
  error.response?.data?.message ||
  "Something went wrong. Please try again.";

function AdminSupportTickets() {
  const { user } = useAuth();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const permissions = user?.adminPermissions || [];

  const canView =
    isSuperAdmin ||
    permissions.includes("VIEW_SHOP_CUSTOMER_TICKETS");

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");

  const loadTickets = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await getAdminSupportTickets({
        search: search.trim(),
        status: status || undefined,
        category: category || undefined,
      });

      const data = response.data;

      setTickets(
        Array.isArray(data)
          ? data
          : data?.tickets ||
              data?.data?.tickets ||
              data?.data ||
              []
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [canView, search, status, category]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  if (!canView) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        You do not have permission to view support tickets.
      </div>
    );
  }

  const openCount = tickets.filter(
    (ticket) => ticket.status === "OPEN"
  ).length;

  const progressCount = tickets.filter(
    (ticket) => ticket.status === "IN_PROGRESS"
  ).length;

  const waitingCount = tickets.filter(
    (ticket) => ticket.status === "WAITING_FOR_USER"
  ).length;

  const resolvedCount = tickets.filter(
    (ticket) =>
      ["RESOLVED", "REJECTED", "CLOSED"].includes(ticket.status)
  ).length;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Customer Support
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage customer and guest support requests.
          </p>
        </div>

        <button
          type="button"
          onClick={loadTickets}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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
        <SummaryCard
          title="Open Tickets"
          value={openCount}
          icon={<AlertCircle size={21} />}
          color="text-blue-600 bg-blue-50"
        />

        <SummaryCard
          title="In Progress"
          value={progressCount}
          icon={<Clock size={21} />}
          color="text-yellow-600 bg-yellow-50"
        />

        <SummaryCard
          title="Waiting for Customer"
          value={waitingCount}
          icon={<MessageSquare size={21} />}
          color="text-purple-600 bg-purple-50"
        />

        <SummaryCard
          title="Resolved / Closed"
          value={resolvedCount}
          icon={<CheckCircle size={21} />}
          color="text-green-600 bg-green-50"
        />
      </div>

      {/* FILTERS */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search ticket, customer, email..."
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="">All statuses</option>

            {STATUSES.map((item) => (
              <option key={item} value={item}>
                {formatLabel(item)}
              </option>
            ))}
          </select>

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="">All categories</option>

            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {formatLabel(item)}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <Filter size={14} />
            Filter support requests
          </span>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatus("");
              setCategory("");
            }}
            className="font-medium text-blue-600 hover:text-blue-700"
          >
            Clear filters
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* TICKETS TABLE */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">
            Support Requests ({tickets.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-gray-500">
            Loading support tickets...
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare
              className="mx-auto mb-3 text-gray-300"
              size={36}
            />

            <h3 className="font-semibold text-gray-800">
              No support tickets found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              New customer requests will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="whitespace-nowrap px-5 py-3">
                    Ticket Number
                  </th>

                  {/* WIDER TITLE COLUMN */}
                  <th className="w-[380px] min-w-[380px] px-5 py-3">
                    Title
                  </th>

                  <th className="px-5 py-3">
                    Customer
                  </th>

                  <th className="px-5 py-3">
                    Category
                  </th>

                  <th className="px-5 py-3">
                    Priority
                  </th>

                  <th className="px-5 py-3">
                    Status
                  </th>

                  <th className="px-5 py-3">
                    Created
                  </th>

                  <th className="px-5 py-3 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-gray-50"
                  >
                    {/* TICKET NUMBER */}
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="font-semibold text-gray-900">
                        {ticket.ticketNumber || "—"}
                      </span>
                    </td>

                    {/* TITLE */}
                    <td className="w-[380px] min-w-[380px] px-5 py-4">
                      <p className="max-w-[380px] whitespace-normal break-words font-medium leading-5 text-gray-800">
                        {ticket.subject || "—"}
                      </p>
                    </td>

                    {/* CUSTOMER */}
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-800">
                        {ticket.requester?.name ||
                          ticket.guestName ||
                          "Guest Customer"}
                      </p>

                      <p className="text-xs text-gray-500">
                        {ticket.requester?.email ||
                          ticket.guestEmail ||
                          "—"}
                      </p>
                    </td>

                    {/* CATEGORY */}
                    <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                      {formatLabel(ticket.category)}
                    </td>

                    {/* PRIORITY */}
                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`font-semibold ${
                          priorityStyles[ticket.priority] ||
                          "text-gray-600"
                        }`}
                      >
                        {formatLabel(ticket.priority)}
                      </span>
                    </td>

                    {/* STATUS */}
                    <td className="px-5 py-4">
                      <span
                        className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                          statusStyles[ticket.status] ||
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {formatLabel(ticket.status)}
                      </span>
                    </td>

                    {/* CREATED DATE */}
                    <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                      {ticket.createdAt
                        ? new Date(
                            ticket.createdAt
                          ).toLocaleDateString()
                        : "—"}
                    </td>

                    {/* ACTION */}
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <Link
                        to={`/admin/support/${ticket.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800"
                      >
                        View
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon, color }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {value}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default AdminSupportTickets;
