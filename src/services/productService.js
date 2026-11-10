
import api from "./api";

const productService = {
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
};

export default productService;
