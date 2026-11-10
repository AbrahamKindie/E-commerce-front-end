
import api from "./api";

const categoryService = {
  getCategories: async () => {
    const response = await api.get("/categories");
    return response.data;
  },

  getCategoryById: async (id) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },
};

export default categoryService;
