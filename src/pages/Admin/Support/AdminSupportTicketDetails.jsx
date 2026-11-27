
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  RefreshCw,
  User,
  Mail,
  Calendar,
  MessageSquare,
  CheckCircle,
  XCircle,
  ShieldCheck,
  AlertCircle,
  UserCheck,
  X,
} from "lucide-react";

import { useAuth } from "../../../context/AuthContext";

import {
  getAdminSupportTicket,
  replyToAdminSupportTicket,
  updateAdminSupportTicketStatus,
  updateAdminSupportTicketPriority,
  assignAdminSupportTicket,
  verifySupportAdminId,
  resolveAdminSupportTicket,
  rejectAdminSupportTicket,
} from "../../../services/adminSupportApi";

const STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_USER",
  "CLOSED",
];

const PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"];

const FINAL_STATUSES = ["RESOLVED", "REJECTED", "CLOSED"];

const formatLabel = (value = "") =>
  value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const getErrorMessage = (error) =>
  error.response?.data?.message ||
  "Something went wrong. Please try again.";

function AdminSupportTicketDetails() {
  const { id } = useParams();
  const { user } = useAuth();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const permissions = user?.adminPermissions || [];

  const canView =
    isSuperAdmin ||
    permissions.includes("VIEW_SHOP_CUSTOMER_TICKETS");

  const canReply =
    isSuperAdmin ||
    permissions.includes("REPLY_SHOP_CUSTOMER_TICKETS");

  const canManage =
    isSuperAdmin ||
    permissions.includes("UPDATE_SHOP_CUSTOMER_TICKET_STATUS");

  const [ticket, setTicket] = useState(null);

  const [message, setMessage] = useState("");

  // Admin assignment
  const [adminId, setAdminId] = useState("");
  const [verifiedAdmin, setVerifiedAdmin] = useState(null);
  const [adminIdError, setAdminIdError] = useState("");

  // Resolve / Reject popup
  const [actionModal, setActionModal] = useState(null);
  const [actionDescription, setActionDescription] = useState("");
  const [actionModalError, setActionModalError] = useState("");

  // Loading states
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // LOAD TICKET
  // ==========================================

  const loadTicket = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await getAdminSupportTicket(id);
      const data = response.data;

      setTicket(
        data.ticket ||
          data.data?.ticket ||
          data.data ||
          data
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id, canView]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  // ==========================================
  // REPLY TO CUSTOMER
  // ==========================================

  const handleReply = async (event) => {
    event.preventDefault();

    if (!message.trim()) return;

    try {
      setSending(true);
      setError("");
      setSuccess("");

      await replyToAdminSupportTicket(id, message.trim());

      setMessage("");
      setSuccess("Your reply has been sent.");

      await loadTicket();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  // ==========================================
  // UPDATE STATUS
  // ==========================================

  const handleStatusChange = async (nextStatus) => {
    try {
      setUpdating(true);
      setError("");
      setSuccess("");

      await updateAdminSupportTicketStatus(id, nextStatus);

      setSuccess("Ticket status updated.");
      await loadTicket();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  };

  // ==========================================
  // UPDATE PRIORITY
  // ==========================================

  const handlePriorityChange = async (nextPriority) => {
    try {
      setUpdating(true);
      setError("");
      setSuccess("");

      await updateAdminSupportTicketPriority(id, nextPriority);

      setSuccess("Ticket priority updated.");
      await loadTicket();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  };

  // ==========================================
  // VERIFY ADMIN ID
  // ==========================================

  const handleVerifyAdmin = async () => {
    setAdminIdError("");
    setVerifiedAdmin(null);
    setSuccess("");

    if (!adminId.trim()) {
      setAdminIdError("Please enter an Admin ID.");
      return;
    }

    if (!/^[1-9]\d*$/.test(adminId.trim())) {
      setAdminIdError("Please enter a valid positive Admin ID.");
      return;
    }

    try {
      setVerifying(true);

      const response = await verifySupportAdminId(Number(adminId));

      const admin =
        response.data.admin ||
        response.data.data?.admin ||
        response.data.data;

      if (!admin?.id) {
        setAdminIdError(
          "Admin verification failed. Please check the ID."
        );
        return;
      }

      setVerifiedAdmin(admin);
      setSuccess("Admin verified successfully.");
    } catch (err) {
      setVerifiedAdmin(null);
      setAdminIdError(getErrorMessage(err));
    } finally {
      setVerifying(false);
    }
  };

  // ==========================================
  // ASSIGN VERIFIED ADMIN
  // ==========================================

  const handleAssign = async () => {
    if (!verifiedAdmin?.id) {
      setAdminIdError("Please verify the Admin ID first.");
      return;
    }

    try {
      setAssigning(true);
      setError("");
      setSuccess("");

      await assignAdminSupportTicket(id, verifiedAdmin.id);

      setAdminId("");
      setVerifiedAdmin(null);
      setAdminIdError("");

      setSuccess("Ticket assigned successfully.");

      await loadTicket();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAssigning(false);
    }
  };

  // ==========================================
  // OPEN ACTION POPUP
  // ==========================================

  const openActionModal = (action) => {
    setActionModal(action);
    setActionDescription("");
    setActionModalError("");
    setError("");
    setSuccess("");
  };

  // ==========================================
  // CLOSE ACTION POPUP
  // ==========================================

  const closeActionModal = () => {
    if (resolving || rejecting) return;

    setActionModal(null);
    setActionDescription("");
    setActionModalError("");
  };

  // ==========================================
  // RESOLVE TICKET
  // ==========================================

  const handleResolve = async () => {
    setActionModalError("");

    try {
      setResolving(true);
      setError("");
      setSuccess("");

      await resolveAdminSupportTicket(
        id,
        actionDescription.trim()
      );

      setActionModal(null);
      setActionDescription("");
      setActionModalError("");

      setSuccess("Support ticket resolved successfully.");

      await loadTicket();
    } catch (err) {
      setActionModalError(getErrorMessage(err));
    } finally {
      setResolving(false);
    }
  };

  // ==========================================
  // REJECT TICKET
  // ==========================================

  const handleReject = async () => {
    const description = actionDescription.trim();

    setActionModalError("");

    if (description.length < 10) {
      setActionModalError(
        "Rejection description must be at least 10 characters."
      );
      return;
    }

    try {
      setRejecting(true);
      setError("");
      setSuccess("");

      await rejectAdminSupportTicket(id, description);

      setActionModal(null);
      setActionDescription("");
      setActionModalError("");

      setSuccess("Support ticket rejected successfully.");

      await loadTicket();
    } catch (err) {
      setActionModalError(getErrorMessage(err));
    } finally {
      setRejecting(false);
    }
  };

  // ==========================================
  // PERMISSION CHECK
  // ==========================================

  if (!canView) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        You do not have permission to view support tickets.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading ticket...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="space-y-4">
        <Link
          to="/admin/support"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to Support
        </Link>

        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-600">
          {error || "Support ticket not found."}
        </div>
      </div>
    );
  }

  const customerName =
    ticket.requester?.name ||
    ticket.guestName ||
    "Guest Customer";

  const customerEmail =
    ticket.requester?.email ||
    ticket.guestEmail ||
    "No email available";

  const messages = ticket.messages || [];

  const isFinalStatus = FINAL_STATUSES.includes(ticket.status);

  const isAdminMessage = (item) =>
    item.sender?.role === "ADMIN" ||
    item.sender?.role === "SUPER_ADMIN" ||
    (item.senderId != null &&
      String(item.senderId) === String(user?.id));

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to="/admin/support"
            className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft size={16} />
            Back to Support
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">
            {ticket.ticketNumber}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {ticket.subject}
          </p>
        </div>

        <button
          type="button"
          onClick={loadTicket}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* GENERAL FEEDBACK */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* CONVERSATION */}
        <div className="space-y-5 xl:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white">

            <div className="border-b border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-50 p-3 text-blue-600">
                  <MessageSquare size={20} />
                </div>

                <div>
                  <h2 className="font-semibold text-gray-900">
                    Ticket Conversation
                  </h2>

                  <p className="text-xs text-gray-500">
                    Customer and support team messages
                  </p>
                </div>
              </div>
            </div>

            <div className="max-h-[550px] space-y-4 overflow-y-auto bg-gray-50 p-5">

              {/* ORIGINAL DESCRIPTION */}
              <div className="max-w-[90%] rounded-xl border border-gray-200 bg-white p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-600">
                  <User size={14} />
                  {customerName}

                  <span className="font-normal text-gray-400">
                    · Ticket description
                  </span>
                </div>

                <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                  {ticket.description}
                </p>

                <p className="mt-3 text-xs text-gray-400">
                  {new Date(ticket.createdAt).toLocaleString()}
                </p>
              </div>

              {/* MESSAGES */}
              {messages.map((item) => {
                const adminMessage = isAdminMessage(item);

                return (
                  <div
                    key={item.id}
                    className={`flex ${
                      adminMessage ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[90%] rounded-xl p-4 ${
                        adminMessage
                          ? "bg-blue-600 text-white"
                          : "border border-gray-200 bg-white text-gray-800"
                      }`}
                    >
                      <p
                        className={`mb-2 text-xs font-semibold ${
                          adminMessage
                            ? "text-blue-100"
                            : "text-gray-500"
                        }`}
                      >
                        {item.sender?.name ||
                          (adminMessage ? "Support Team" : "Customer")}
                      </p>

                      <p className="whitespace-pre-wrap text-sm leading-6">
                        {item.message}
                      </p>

                      <p
                        className={`mt-3 text-xs ${
                          adminMessage
                            ? "text-blue-100"
                            : "text-gray-400"
                        }`}
                      >
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}

              {messages.length === 0 && (
                <p className="py-4 text-center text-sm text-gray-400">
                  No replies yet.
                </p>
              )}
            </div>

            {/* REPLY */}
            {canReply && !isFinalStatus && (
              <form
                onSubmit={handleReply}
                className="border-t border-gray-100 p-4"
              >
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Reply to Customer
                </label>

                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={4}
                  placeholder="Write your response..."
                  className="w-full resize-y rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />

                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={sending || !message.trim()}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send size={16} />
                    {sending ? "Sending..." : "Send Reply"}
                  </button>
                </div>
              </form>
            )}

            {!canReply && (
              <div className="border-t border-gray-100 bg-gray-50 p-4 text-sm text-gray-500">
                You do not have permission to reply to this ticket.
              </div>
            )}

            {canReply && isFinalStatus && (
              <div className="border-t border-gray-100 bg-gray-50 p-4 text-sm text-gray-500">
                This ticket is {formatLabel(ticket.status).toLowerCase()}.
                Replies are currently disabled.
              </div>
            )}
          </div>
        </div>

        {/* TICKET DETAILS */}
        <aside className="space-y-5">

          {/* CUSTOMER INFORMATION */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 font-semibold text-gray-900">
              Customer Information
            </h2>

            <div className="space-y-4">
              <InfoRow
                icon={<User size={17} />}
                label="Customer"
                value={customerName}
              />

              <InfoRow
                icon={<Mail size={17} />}
                label="Email"
                value={customerEmail}
              />

              <InfoRow
                icon={<Calendar size={17} />}
                label="Created"
                value={new Date(ticket.createdAt).toLocaleString()}
              />

              {ticket.requester?.phone && (
                <InfoRow
                  icon={<User size={17} />}
                  label="Phone"
                  value={ticket.requester.phone}
                />
              )}
            </div>
          </div>

          {/* TICKET MANAGEMENT */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 font-semibold text-gray-900">
              Ticket Management
            </h2>

            <div className="space-y-4">

              {/* STATUS */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
                  Status
                </label>

                <select
                  value={ticket.status}
                  disabled={!canManage || isFinalStatus || updating}
                  onChange={(event) =>
                    handleStatusChange(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-blue-500 disabled:bg-gray-100"
                >
                  {STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {formatLabel(item)}
                    </option>
                  ))}

                  {isFinalStatus && (
                    <option value={ticket.status}>
                      {formatLabel(ticket.status)}
                    </option>
                  )}
                </select>
              </div>

              {/* PRIORITY */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
                  Priority
                </label>

                <select
                  value={ticket.priority}
                  disabled={!canManage || updating}
                  onChange={(event) =>
                    handlePriorityChange(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-blue-500 disabled:bg-gray-100"
                >
                  {PRIORITIES.map((item) => (
                    <option key={item} value={item}>
                      {formatLabel(item)}
                    </option>
                  ))}
                </select>
              </div>

              {/* ASSIGN ADMIN */}
              {canManage && (
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="mb-3 text-sm font-semibold text-gray-800">
                    Assign Admin
                  </h3>

                  <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
                    Admin ID
                  </label>

                  <div className="flex items-start gap-2">
                    <input
                      type="number"
                      min="1"
                      value={adminId}
                      onChange={(event) => {
                        setAdminId(event.target.value);
                        setVerifiedAdmin(null);
                        setAdminIdError("");
                        setSuccess("");
                      }}
                      placeholder="Enter Admin ID"
                      aria-invalid={Boolean(adminIdError)}
                      className={`min-w-0 flex-1 rounded-lg border p-2.5 text-sm outline-none focus:ring-2 ${
                        adminIdError
                          ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                          : "border-gray-200 focus:border-blue-500 focus:ring-blue-100"
                      }`}
                    />

                    <button
                      type="button"
                      onClick={handleVerifyAdmin}
                      disabled={verifying || !adminId.trim()}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {verifying ? (
                        <>
                          <RefreshCw size={15} className="animate-spin" />
                          Checking
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={15} />
                          Check ID
                        </>
                      )}
                    </button>
                  </div>

                  {/* ADMIN ID ERROR */}
                  {adminIdError && (
                    <p className="mt-2 flex items-start gap-1.5 text-xs text-red-600">
                      <AlertCircle size={14} className="mt-0.5 shrink-0" />
                      <span>{adminIdError}</span>
                    </p>
                  )}

                  {/* VERIFIED ADMIN */}
                  {verifiedAdmin && (
                    <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-green-700">
                        <ShieldCheck size={17} />
                        Admin Verified
                      </div>

                      <div className="space-y-2">
                        <InfoRow
                          icon={<User size={15} />}
                          label="Name"
                          value={verifiedAdmin.name}
                        />

                        <InfoRow
                          icon={<Mail size={15} />}
                          label="Email"
                          value={verifiedAdmin.email}
                        />

                        <InfoRow
                          icon={<User size={15} />}
                          label="Phone"
                          value={verifiedAdmin.phone}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleAssign}
                        disabled={assigning}
                        className="mt-4 w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {assigning
                          ? "Assigning..."
                          : "Confirm Assignment"}
                      </button>
                    </div>
                  )}

                  {/* CURRENT ASSIGNMENT */}
                  <div className="mt-4 rounded-lg bg-gray-50 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase text-gray-500">
                      Currently Assigned To
                    </p>

                    {ticket.assignedAdmin ? (
                      <div className="flex items-start gap-2">
                        <UserCheck
                          size={18}
                          className="mt-0.5 text-green-600"
                        />

                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {ticket.assignedAdmin.name}
                          </p>

                          <p className="text-xs text-gray-500">
                            {ticket.assignedAdmin.email}
                          </p>

                          {ticket.assignedAdmin.phone && (
                            <p className="text-xs text-gray-500">
                              {ticket.assignedAdmin.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Not assigned yet.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* RESOLVE AND REJECT BUTTONS */}
              {canManage && !isFinalStatus && (
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="mb-3 text-sm font-semibold text-gray-800">
                    Ticket Actions
                  </h3>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => openActionModal("resolve")}
                      disabled={resolving || rejecting}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircle size={17} />
                      Resolve Ticket
                    </button>

                    <button
                      type="button"
                      onClick={() => openActionModal("reject")}
                      disabled={resolving || rejecting}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      <XCircle size={17} />
                      Reject Ticket
                    </button>
                  </div>
                </div>
              )}

              {/* EXISTING RESOLUTION DETAILS */}
              {ticket.resolutionSummary && (
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="mb-2 text-sm font-semibold text-green-700">
                    Resolution Summary
                  </h3>

                  <p className="whitespace-pre-wrap rounded-lg bg-green-50 p-3 text-sm text-gray-700">
                    {ticket.resolutionSummary}
                  </p>

                  {ticket.resolvedAt && (
                    <p className="mt-2 text-xs text-gray-400">
                      Resolved: {new Date(ticket.resolvedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* EXISTING REJECTION DETAILS */}
              {ticket.rejectionDescription && (
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="mb-2 text-sm font-semibold text-red-700">
                    Rejection Description
                  </h3>

                  <p className="whitespace-pre-wrap rounded-lg bg-red-50 p-3 text-sm text-gray-700">
                    {ticket.rejectionDescription}
                  </p>

                  {ticket.rejectedAt && (
                    <p className="mt-2 text-xs text-gray-400">
                      Rejected: {new Date(ticket.rejectedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {!canManage && (
                <p className="text-xs text-gray-500">
                  You have view-only access to ticket management.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* ======================================
          RESOLVE / REJECT MODAL
      ====================================== */}

      {actionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !resolving &&
              !rejecting
            ) {
              closeActionModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-action-title"
            className="w-full max-w-lg rounded-xl bg-white shadow-2xl"
          >
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-full p-2 ${
                    actionModal === "resolve"
                      ? "bg-green-50 text-green-600"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {actionModal === "resolve" ? (
                    <CheckCircle size={21} />
                  ) : (
                    <XCircle size={21} />
                  )}
                </div>

                <div>
                  <h2
                    id="ticket-action-title"
                    className="text-lg font-semibold text-gray-900"
                  >
                    {actionModal === "resolve"
                      ? "Resolve Support Ticket"
                      : "Reject Support Ticket"}
                  </h2>

                  <p className="text-xs text-gray-500">
                    Ticket: {ticket.ticketNumber}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeActionModal}
                disabled={resolving || rejecting}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                aria-label="Close popup"
              >
                <X size={20} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="space-y-4 p-6">
              <div>
                <label
                  htmlFor="action-description"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  {actionModal === "resolve"
                    ? "Resolution Description"
                    : "Rejection Description"}

                  {actionModal === "resolve" ? (
                    <span className="ml-1 font-normal text-gray-400">
                      (Optional)
                    </span>
                  ) : (
                    <span className="ml-1 text-red-500">*</span>
                  )}
                </label>

                <textarea
                  id="action-description"
                  value={actionDescription}
                  onChange={(event) => {
                    setActionDescription(event.target.value);
                    setActionModalError("");
                  }}
                  rows={5}
                  maxLength={5000}
                  placeholder={
                    actionModal === "resolve"
                      ? "Describe how the customer's issue was resolved..."
                      : "Explain why this support ticket is being rejected..."
                  }
                  disabled={resolving || rejecting}
                  className={`w-full resize-y rounded-lg border p-3 text-sm outline-none focus:ring-2 ${
                    actionModalError
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-100"
                  }`}
                />

                {actionModal === "reject" && (
                  <p className="mt-1 text-xs text-gray-400">
                    Minimum 10 characters. Maximum 5,000 characters.
                  </p>
                )}

                {actionModal === "resolve" && (
                  <p className="mt-1 text-xs text-gray-400">
                    Maximum 5,000 characters.
                  </p>
                )}

                {/* POPUP VALIDATION / API ERROR */}
                {actionModalError && (
                  <p className="mt-2 flex items-start gap-2 text-sm text-red-600">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    {actionModalError}
                  </p>
                )}
              </div>

              <div
                className={`rounded-lg p-3 text-sm ${
                  actionModal === "resolve"
                    ? "bg-green-50 text-green-800"
                    : "bg-red-50 text-red-800"
                }`}
              >
                {actionModal === "resolve"
                  ? "Resolving this ticket will mark the customer's request as resolved."
                  : "Rejecting this ticket will mark the customer's request as rejected. Please provide a clear reason."}
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeActionModal}
                disabled={resolving || rejecting}
                className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              {actionModal === "resolve" ? (
                <button
                  type="button"
                  onClick={handleResolve}
                  disabled={
                    resolving ||
                    actionDescription.trim().length > 5000
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {resolving ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Resolving...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Resolve Ticket
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={
                    rejecting ||
                    actionDescription.trim().length < 10 ||
                    actionDescription.trim().length > 5000
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {rejecting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <XCircle size={16} />
                      Reject Ticket
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0 text-gray-400">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>

        <p className="break-words text-sm font-medium text-gray-800">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

export default AdminSupportTicketDetails;
