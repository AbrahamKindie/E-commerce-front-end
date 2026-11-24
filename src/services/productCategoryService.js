
import api from "./api";

const productCategoryService = {
  getMyProductCategories: async () => {
    const response = await api.get("/categories/my-shop");
    return response.data;
  },

  getMyProductCategoryById: async (id) => {
    const response = await api.get(`/categories/my-shop/${id}`);
    return response.data;
  },

  createProductCategory: async (data) => {
    const response = await api.post("/categories/my-shop", data);
    return response.data;
  },

  updateProductCategory: async (id, data) => {
    const response = await api.patch(`/categories/my-shop/${id}`, data);
    return response.data;
  },

  deleteProductCategory: async (id) => {
    const response = await api.delete(`/categories/my-shop/${id}`);
    return response.data;
  },
};

export default productCategoryService;
