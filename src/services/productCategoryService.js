
import api from "./api";

const productCategoryService = {
  // ==========================================
  // GET ALL MY PRODUCT CATEGORIES
  // ==========================================

  getMyProductCategories: async () => {
    const response = await api.get("/categories/my-shop");
    return response.data;
  },

  // ==========================================
  // GET PRODUCT CATEGORY BY ID
  // ==========================================

  getMyProductCategoryById: async (id) => {
    const response = await api.get(
      `/categories/my-shop/${id}`
    );

    return response.data;
  },

  // ==========================================
  // CREATE PRODUCT CATEGORY
  // ==========================================

  createProductCategory: async (categoryData) => {
    const response = await api.post(
      "/categories/my-shop",
      categoryData
    );

    return response.data;
  },

  // ==========================================
  // UPDATE PRODUCT CATEGORY
  // ==========================================

  updateProductCategory: async (id, categoryData) => {
    const response = await api.patch(
      `/categories/my-shop/${id}`,
      categoryData
    );

    return response.data;
  },

  // ==========================================
  // DELETE PRODUCT CATEGORY
  // ==========================================

  deleteProductCategory: async (id) => {
    const response = await api.delete(
      `/categories/my-shop/${id}`
    );

    return response.data;
  },
};

export default productCategoryService;
