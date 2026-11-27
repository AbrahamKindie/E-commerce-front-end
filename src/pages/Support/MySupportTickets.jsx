import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Ticket,
} from "lucide-react";
import { getMySupportTickets } from "../../services/supportApi";

const statusStyles = {
  OPEN: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  WAITING_FOR_USER: "bg-purple-100 text-purple-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-600",
};

const formatStatus = (status = "") =>
  status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) =>
    letter.toUpperCase()
  );

export default function MySupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getMySupportTickets({
        page: 1,
        limit: 50,
      });

      const data = response.data?.tickets ?? response.data?.data ?? response.data;
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load your support tickets."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const filteredTickets = tickets.filter((ticket) => {
    const text = `${ticket.ticketNumber || ""} ${ticket.subject || ""} ${
      ticket.category || ""
    }`.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            My Support Tickets
          </h1>
          <p className="mt-2 text-gray-600">
            Track your requests and communicate with our support team.
          </p>
        </div>

        <Link
          to="/my-account/support/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Create Ticket
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tickets..."
            className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <button
          onClick={loadTickets}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-500">
          Loading support tickets...
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-6 py-16 text-center">
          <Ticket className="mx-auto mb-4 text-gray-400" size={40} />
          <h2 className="text-lg font-semibold text-gray-800">
            No support tickets found
          </h2>
          <p className="mt-2 text-gray-500">
            Create a ticket if you need help with an order or your account.
          </p>
          <Link
            to="/my-account/support/new"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-white hover:bg-blue-700"
          >
            <Plus size={17} />
            Create Ticket
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <div className="hidden grid-cols-12 gap-4 bg-gray-50 px-5 py-4 text-sm font-semibold text-gray-600 md:grid">
            <div className="col-span-3">Ticket</div>
            <div className="col-span-4">Subject</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3">Last Updated</div>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredTickets.map((ticket) => (
              <Link
                key={ticket.id}
                to={`/my-account/support/${ticket.id}`}
                className="grid grid-cols-1 gap-3 px-5 py-5 transition hover:bg-gray-50 md:grid-cols-12 md:items-center md:gap-4"
              >
                <div className="md:col-span-3">
                  <span className="text-sm font-semibold text-blue-600">
                    {ticket.ticketNumber || `Ticket #${ticket.id}`}
                  </span>
                  <p className="mt-1 text-xs text-gray-500">
                    {ticket.category?.replaceAll("_", " ")}
                  </p>
                </div>

                <div className="md:col-span-4">
                  <p className="font-medium text-gray-900">
                    {ticket.subject}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 md:hidden">
                    {formatStatus(ticket.status)}
                  </p>
                </div>

                <div className="hidden md:col-span-2 md:block">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      statusStyles[ticket.status] ||
                      "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {formatStatus(ticket.status)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500 md:col-span-3">
                  <MessageCircle size={16} />
                  {ticket.updatedAt
                    ? new Date(ticket.updatedAt).toLocaleString()
                    : "Recently created"}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}