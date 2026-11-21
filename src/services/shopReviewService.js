
import api from "./api";

const shopReviewService = {
  getMyShopReviews: async (params = {}) => {
    const response = await api.get("/shop-reviews/my-shop", { params });
    return response.data;
  },

  getMyShopReviewById: async (id) => {
    const response = await api.get(`/shop-reviews/my-shop/${id}`);
    return response.data;
  },
};

export default shopReviewService;
