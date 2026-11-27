
import axios from "axios";

const supportApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach logged-in user's access token automatically.
supportApi.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Guest access tokens are separate from login tokens.
const getGuestHeaders = (guestAccessToken) => {
  if (!guestAccessToken) return {};

  return {
    "x-support-access-token": guestAccessToken,
  };
};

// Customer endpoints
export const createSupportTicket = async (ticketData) => {
  const response = await supportApi.post("/support", ticketData);
  return response.data;
};

export const getMySupportTickets = async (params = {}) => {
  const response = await supportApi.get("/support/my", { params });
  return response.data;
};

export const getSupportTicket = async (
  ticketId,
  guestAccessToken = null
) => {
  const response = await supportApi.get(`/support/${ticketId}`, {
    headers: getGuestHeaders(guestAccessToken),
  });

  return response.data;
};

export const replyToSupportTicket = async (
  ticketId,
  messageData,
  guestAccessToken = null
) => {
  const response = await supportApi.post(
    `/support/${ticketId}/messages`,
    messageData,
    {
      headers: getGuestHeaders(guestAccessToken),
    }
  );

  return response.data;
};

export const reopenSupportTicket = async (
  ticketId,
  guestAccessToken = null
) => {
  const response = await supportApi.post(
    `/support/${ticketId}/reopen`,
    {},
    {
      headers: getGuestHeaders(guestAccessToken),
    }
  );

  return response.data;
};

// Admin endpoints
export const getAdminSupportTickets = async (params = {}) => {
  const response = await supportApi.get("/support/admin", { params });
  return response.data;
};

export const updateSupportTicketStatus = async (
  ticketId,
  status
) => {
  const response = await supportApi.patch(
    `/support/${ticketId}/status`,
    { status }
  );

  return response.data;
};

export const updateSupportTicketPriority = async (
  ticketId,
  priority
) => {
  const response = await supportApi.patch(
    `/support/${ticketId}/priority`,
    { priority }
  );

  return response.data;
};

export const assignSupportTicket = async (
  ticketId,
  adminId
) => {
  const response = await supportApi.patch(
    `/support/${ticketId}/assign`,
    { adminId }
  );

  return response.data;
};

// ========================================
// AI SUPPORT API
// ========================================

const getAiGuestHeaders = (guestAccessToken) =>
  guestAccessToken
    ? {
        "x-ai-support-token": guestAccessToken,
      }
    : {};

export const createAiSupportConversation = async () =>
  (
    await supportApi.post("/support/ai/conversations")
  ).data;

export const getAiSupportConversation = async (
  conversationId,
  guestAccessToken = null
) =>
  (
    await supportApi.get(
      `/support/ai/conversations/${conversationId}`,
      {
        headers: getAiGuestHeaders(guestAccessToken),
      }
    )
  ).data;

export const sendAiSupportMessage = async (
  conversationId,
  message,
  guestAccessToken = null
) =>
  (
    await supportApi.post(
      `/support/ai/conversations/${conversationId}/messages`,
      { message },
      {
        headers: getAiGuestHeaders(guestAccessToken),
      }
    )
  ).data;

export default supportApi;
