
import api from "./api";

const reviewService = {
  // Get reviews for a product
  getProductReviews: async (productId, page = 1, limit = 10) => {
    const response = await api.get(`/reviews/product/${productId}`, {
      params: { page, limit },
    });

    return response.data;
  },

  // Create a review
  createReview: async (productId, reviewData) => {
    const response = await api.post(
      `/reviews/product/${productId}`,
      reviewData
    );

    return response.data;
  },

  // Update an existing review
  updateReview: async (reviewId, reviewData) => {
    const response = await api.patch(
      `/reviews/${reviewId}`,
      reviewData
    );

    return response.data;
  },
};

export default reviewService;
