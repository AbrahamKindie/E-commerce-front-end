
import api from "./api";

const authService = {
  // ==========================================
  // USER REGISTRATION
  // ==========================================

  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },

  // ==========================================
  // USER LOGIN
  // ==========================================

  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  // ==========================================
  // FORGOT PASSWORD
  // ==========================================

  forgotPassword: async (email) => {
    const response = await api.post("/auth/forgot-password", {
      email,
    });

    return response.data;
  },

  // ==========================================
  // RESET PASSWORD
  // ==========================================

  resetPassword: async (token, newPassword) => {
    const response = await api.post("/auth/reset-password", {
      token,
      newPassword,
    });

    return response.data;
  },

  // ==========================================
  // ADMIN FIRST-TIME PASSWORD SETUP
  // ==========================================

  verifyAdminPasswordSetup: async (token) => {
    const response = await api.post(
      "/auth/admin-password/verify",
      { token }
    );

    return response.data;
  },

  setupAdminPassword: async (
    token,
    newPassword,
    confirmPassword
  ) => {
    const response = await api.post(
      "/auth/admin-password/setup",
      {
        token,
        newPassword,
        confirmPassword,
      }
    );

    return response.data;
  },

  // ==========================================
  // LOGOUT
  // ==========================================

  logout: async () => {
    const refreshToken = localStorage.getItem("refreshToken");

    try {
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    }
  },
};

export default authService;
