
import api from "./api";

const adminService = {
  // ==========================================
  // ADMIN DASHBOARD
  // ==========================================

  getDashboardStats: async () => {
    const response = await api.get("/admin/dashboard");
    return response.data;
  },

  // ==========================================
  // MARKETPLACE USER MANAGEMENT
  // ==========================================

  getUsers: async (filters = {}) => {
    const response = await api.get("/admin/users", {
      params: filters,
    });
    return response.data;
  },

  updateUserStatus: async (userId, isActive) => {
    const response = await api.patch(
      `/admin/users/${userId}/status`,
      { isActive }
    );
    return response.data;
  },

  // ==========================================
  // ADMIN MANAGEMENT
  // ==========================================

  getAdmins: async () => {
    const response = await api.get("/admin");
    return response.data;
  },

  createAdmin: async (adminData) => {
    const response = await api.post("/admin", adminData);
    return response.data;
  },

  updateAdmin: async (adminId, adminData) => {
    const response = await api.patch(
      `/admin/${adminId}`,
      adminData
    );
    return response.data;
  },

  resendAdminPasswordSetupEmail: async (adminId) => {
    const response = await api.post(
      `/admin/${adminId}/resend-password-setup`
    );
    return response.data;
  },

  updateAdminStatus: async (adminId, isActive) => {
    const response = await api.patch(
      `/admin/${adminId}/status`,
      { isActive }
    );
    return response.data;
  },

  deleteAdmin: async (adminId) => {
    const response = await api.delete(`/admin/${adminId}`);
    return response.data;
  },

  // ==========================================
  // ADMIN ACTIVITY LOGS
  // ==========================================

  getActivityLogs: async (filters = {}) => {
    const response = await api.get("/admin/activity-logs", {
      params: filters,
    });
    return response.data;
  },

  getActivityLogById: async (logId) => {
    const response = await api.get(
      `/admin/activity-logs/${logId}`
    );
    return response.data;
  },

  // ==========================================
  // SHOP MANAGEMENT
  // ==========================================

  getShops: async (filters = {}) => {
    const response = await api.get("/admin/shops", {
      params: filters,
    });
    return response.data;
  },

  getShopById: async (shopId) => {
    const response = await api.get(`/admin/shops/${shopId}`);
    return response.data;
  },

  updateShopStatus: async (shopId, status, reason = "") => {
    const response = await api.patch(
      `/admin/shops/${shopId}/status`,
      { status, reason }
    );
    return response.data;
  },

  // ==========================================
  // SHOP CATEGORY MANAGEMENT
  // ADMIN CREATE / UPDATE / DELETE
  // ==========================================

  createShopCategory: async (categoryData) => {
    const response = await api.post(
      "/admin/categories",
      categoryData
    );
    return response.data;
  },

  updateShopCategory: async (categoryId, categoryData) => {
    const response = await api.patch(
      `/admin/categories/${categoryId}`,
      categoryData
    );
    return response.data;
  },

  deleteShopCategory: async (categoryId) => {
    const response = await api.delete(
      `/admin/categories/${categoryId}`
    );
    return response.data;
  },

  // ==========================================
  // PRODUCT MANAGEMENT
  // ==========================================

  getProducts: async (filters = {}) => {
    const response = await api.get("/products/admin", {
      params: filters,
    });
    return response.data;
  },

  createProduct: async (productData) => {
    const response = await api.post("/products", productData);
    return response.data;
  },

  updateProduct: async (productId, productData) => {
    const response = await api.patch(
      `/products/${productId}`,
      productData
    );
    return response.data;
  },

  setProductFeatured: async (productId, isFeatured) => {
    const response = await api.patch(
      `/products/${productId}/featured`,
      { isFeatured }
    );
    return response.data;
  },

  setProductDiscount: async (productId, discountData) => {
    const response = await api.patch(
      `/products/${productId}/discount`,
      discountData
    );
    return response.data;
  },

  removeProductDiscount: async (productId) => {
    const response = await api.delete(
      `/products/${productId}/discount`
    );
    return response.data;
  },

  // ==========================================
  // ORDER MANAGEMENT
  // ==========================================

  getOrders: async (filters = {}) => {
    const response = await api.get("/orders", {
      params: filters,
    });
    return response.data;
  },

  getOrderById: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  updateOrderStatus: async (orderId, status) => {
    const response = await api.patch(
      `/orders/status/${orderId}`,
      { status }
    );
    return response.data;
  },
};

export default adminService;
