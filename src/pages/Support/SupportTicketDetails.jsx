import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCw, Send } from "lucide-react";
import {
  getSupportTicket,
  replyToSupportTicket,
} from "../../services/supportApi";

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

export default function SupportTicketDetails() {
  const { id } = useParams();

  const [ticket, setTicket] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const loadTicket = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getSupportTicket(id);
      const data =
        response.data?.ticket ?? response.data?.data ?? response.data;

      setTicket(data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load this support ticket."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  const handleReply = async (event) => {
    event.preventDefault();

    if (!message.trim()) return;

    try {
      setSending(true);
      setError("");

      await replyToSupportTicket(id, {
        message: message.trim(),
      });

      setMessage("");
      await loadTicket();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to send your reply."
      );
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-16 text-center text-gray-500">
        Loading ticket...
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
        <Link
          to="/my-account/support"
          className="mt-5 inline-flex items-center gap-2 text-blue-600"
        >
          <ArrowLeft size={17} />
          Back to tickets
        </Link>
      </div>
    );
  }

  if (!ticket) return null;

  const messages = ticket.messages || ticket.supportMessages || [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        to="/my-account/support"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
      >
        <ArrowLeft size={17} />
        Back to support tickets
      </Link>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-semibold text-blue-600">
              {ticket.ticketNumber || `Ticket #${ticket.id}`}
            </p>
            <h1 className="mt-2 text-xl font-bold text-gray-900">
              {ticket.subject}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              {ticket.category?.replaceAll("_", " ")} · Priority:{" "}
              {ticket.priority}
            </p>
          </div>

          <span
            className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
              statusStyles[ticket.status] || "bg-gray-100 text-gray-600"
            }`}
          >
            {formatStatus(ticket.status)}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 sm:p-7">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Conversation
          </h2>

          <button
            onClick={loadTicket}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {messages.length === 0 ? (
          <p className="py-8 text-center text-gray-500">
            No replies yet. Send a message to continue.
          </p>
        ) : (
          <div className="space-y-5">
            {messages.map((item) => {
              const sender =
                item.sender ||
                item.user ||
                item.admin ||
                item.author ||
                {};

              const senderName =
                sender.name ||
                sender.fullName ||
                sender.email ||
                item.senderName ||
                (item.isAdmin ? "Support Team" : "You");

              return (
                <div
                  key={item.id}
                  className="rounded-lg bg-gray-50 p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-800">
                      {senderName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString()
                        : ""}
                    </p>
                  </div>

                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                    {item.message || item.content || item.body}
                  </p>

                  {Array.isArray(item.attachmentUrls) &&
                    item.attachmentUrls.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {item.attachmentUrls.map((url, index) => (
                          <a
                            key={`${url}-${index}`}
                            href={
                              url.startsWith("http")
                                ? url
                                : `${import.meta.env.VITE_API_URL || "http://localhost:3000"}${url}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="block text-sm text-blue-600 underline"
                          >
                            Attachment {index + 1}
                          </a>
                        ))}
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {ticket.status !== "CLOSED" && (
        <form
          onSubmit={handleReply}
          className="rounded-xl border border-gray-200 bg-white p-5 sm:p-7"
        >
          <label className="mb-2 block font-semibold text-gray-800">
            Your reply
          </label>

          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            required
            minLength={1}
            maxLength={5000}
            rows={5}
            placeholder="Write your message..."
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <button
            type="submit"
            disabled={sending || !message.trim()}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send size={17} />
            {sending ? "Sending..." : "Send Reply"}
          </button>
        </form>
      )}

      {ticket.status === "CLOSED" && (
        <div className="rounded-lg bg-gray-100 p-4 text-sm text-gray-600">
          This ticket is closed. If you still need help, please create a new
          support ticket.
        </div>
      )}
    </div>
  );
}