
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const adminSupportApi = axios.create({
  baseURL: `${API_URL}/support`,
  headers: {
    "Content-Type": "application/json",
  },
});

// ==========================================
// AUTHENTICATION
// ==========================================

adminSupportApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ==========================================
// GET SUPPORT TICKETS
// ==========================================

export const getAdminSupportTickets = (params = {}) =>
  adminSupportApi.get("/admin", { params });

export const getAdminSupportTicket = (ticketId) =>
  adminSupportApi.get(`/${ticketId}`);

// ==========================================
// REPLY TO TICKET
// ==========================================

export const replyToAdminSupportTicket = (ticketId, message) =>
  adminSupportApi.post(`/${ticketId}/messages`, {
    message,
  });

// ==========================================
// UPDATE TICKET STATUS
// ==========================================

export const updateAdminSupportTicketStatus = (ticketId, status) =>
  adminSupportApi.patch(`/${ticketId}/status`, {
    status,
  });

// ==========================================
// RESOLVE TICKET
// Summary is optional
// ==========================================

export const resolveAdminSupportTicket = (ticketId, summary = "") =>
  adminSupportApi.patch(`/${ticketId}/resolve`, {
    summary,
  });

// ==========================================
// REJECT TICKET
// Description is required
// ==========================================

export const rejectAdminSupportTicket = (ticketId, description) =>
  adminSupportApi.patch(`/${ticketId}/reject`, {
    description,
  });

// ==========================================
// UPDATE TICKET PRIORITY
// ==========================================

export const updateAdminSupportTicketPriority = (ticketId, priority) =>
  adminSupportApi.patch(`/${ticketId}/priority`, {
    priority,
  });

// ==========================================
// VERIFY ADMIN ID
// ==========================================

export const verifySupportAdminId = (adminId) =>
  adminSupportApi.post("/admin/verify", {
    adminId,
  });

// ==========================================
// ASSIGN / UNASSIGN ADMIN
// ==========================================

export const assignAdminSupportTicket = (ticketId, adminId) =>
  adminSupportApi.patch(`/${ticketId}/assign`, {
    adminId,
  });

export default adminSupportApi;
