
import api from "./api";

const productInteractionService = {
  // ==========================================
  // PRODUCT LIKES
  // ==========================================

  // Like a product
  likeProduct: async (productId) => {
    const response = await api.post(
      `/products/${productId}/like`
    );

    return response.data;
  },

  // Unlike a product
  unlikeProduct: async (productId) => {
    const response = await api.delete(
      `/products/${productId}/like`
    );

    return response.data;
  },

  // Get product like count and current user's like status
  getProductLikes: async (productId) => {
    const response = await api.get(
      `/products/${productId}/likes`
    );

    return response.data;
  },

  // Get products liked by the authenticated customer
  getMyLikedProducts: async (params = {}) => {
    const response = await api.get("/products/my-likes", {
      params,
    });

    return response.data;
  },

  // ==========================================
  // PRODUCT REPORTS - CUSTOMER
  // ==========================================

  // Submit a product report
  reportProduct: async (productId, reportData) => {
    const response = await api.post(
      `/products/${productId}/reports`,
      reportData
    );

    return response.data;
  },

  // Get reports submitted by the authenticated customer
  getMyProductReports: async (params = {}) => {
    const response = await api.get("/products/my-reports", {
      params,
    });

    return response.data;
  },

  // ==========================================
  // PRODUCT REPORTS - ADMIN
  // ==========================================

  // Get all product reports
  getAllProductReports: async (params = {}) => {
    const response = await api.get("/products/reports", {
      params,
    });

    return response.data;
  },

  // Review, resolve, or dismiss a product report
  reviewProductReport: async (reportId, reportData) => {
    const response = await api.patch(
      `/products/reports/${reportId}`,
      reportData
    );

    return response.data;
  },
};

export default productInteractionService;
