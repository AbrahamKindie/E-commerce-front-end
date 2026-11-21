
import api from "./api";

const notificationService = {
  // Get logged-in customer's notifications
  getNotifications: async (page = 1, limit = 8) => {
    const response = await api.get("/notifications", {
      params: { page, limit },
    });

    return response.data;
  },

  // Mark one notification as read
  markAsRead: async (notificationId) => {
    const response = await api.patch(
      `/notifications/${notificationId}/read`
    );

    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.patch("/notifications/read-all");

    return response.data;
  },

  // Delete a notification
  deleteNotification: async (notificationId) => {
    const response = await api.delete(
      `/notifications/${notificationId}`
    );

    return response.data;
  },
};

export default notificationService;
