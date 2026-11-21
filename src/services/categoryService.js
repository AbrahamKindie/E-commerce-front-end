
import api from "./api";

const categoryService = {
  // ==========================================
  // PUBLIC SHOP CATEGORIES
  // STOREFRONT + OWNER REGISTRATION
  // ==========================================

  getCategories: async () => {
    const response = await api.get("/categories");
    return response.data;
  },

  getCategoryById: async (id) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  // ==========================================
  // PRODUCTS BY SHOP CATEGORY
  // ==========================================

  getShopCategoryProducts: async (id, params = {}) => {
    const response = await api.get(
      `/products/shop-category/${id}`,
      { params }
    );

    return response.data;
  },
};

export default categoryService;
