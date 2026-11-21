
import api from "./api";

const productService = {
  // ==========================================
  // CUSTOMER PRODUCT SERVICES
  // ==========================================

  getProducts: async (params = {}) => {
    const response = await api.get("/products", { params });
    return response.data;
  },

  getProductById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  getFeaturedProducts: async (limit = 8) => {
    const response = await api.get("/products/featured", {
      params: { limit },
    });
    return response.data;
  },

  getBestSellingProducts: async (limit = 8) => {
    const response = await api.get("/products/best-selling", {
      params: { limit },
    });
    return response.data;
  },

  getNewArrivals: async (limit = 8) => {
    const response = await api.get("/products/new-arrivals", {
      params: { limit },
    });
    return response.data;
  },

  // ==========================================
  // ADMIN PRODUCT SERVICES
  // ==========================================

  getAdminProducts: async (params = {}) => {
    const response = await api.get("/products/admin", {
      params,
    });
    return response.data;
  },

  getAdminProductById: async (id) => {
    const response = await api.get(`/products/admin/${id}`);
    return response.data;
  },

  // Admin can only activate or deactivate products.
  setProductStatus: async (id, status) => {
    const response = await api.patch(
      `/products/${id}/status`,
      { status }
    );
    return response.data;
  },

  // ==========================================
  // SHOP OWNER PRODUCT SERVICES
  // ==========================================

  getMyShopProducts: async (params = {}) => {
    const response = await api.get("/products/my-shop", {
      params,
    });
    return response.data;
  },

  getMyShopProductById: async (id) => {
    const response = await api.get(`/products/my-shop/${id}`);
    return response.data;
  },

  createShopProduct: async (productData) => {
    const response = await api.post(
      "/products/my-shop",
      productData
    );
    return response.data;
  },

  updateShopProduct: async (id, productData) => {
    const response = await api.patch(
      `/products/my-shop/${id}`,
      productData
    );
    return response.data;
  },

  deleteShopProduct: async (id) => {
    const response = await api.delete(
      `/products/my-shop/${id}`
    );
    return response.data;
  },

  setProductFeatured: async (id, isFeatured) => {
    const response = await api.patch(
      `/products/my-shop/${id}/featured`,
      { isFeatured }
    );
    return response.data;
  },

  setProductDiscount: async (id, discountData) => {
    const response = await api.put(
      `/products/my-shop/${id}/discount`,
      discountData
    );
    return response.data;
  },

  removeProductDiscount: async (id) => {
    const response = await api.delete(
      `/products/my-shop/${id}/discount`
    );
    return response.data;
  },
};

export default productService;
