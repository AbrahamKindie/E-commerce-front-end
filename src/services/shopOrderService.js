
import api from "./api";

const shopOrderService = {
  getMyShopOrders: async (params = {}) => {
    const response = await api.get("/shop-orders/my-shop", { params });
    return response.data;
  },

  getMyShopOrderById: async (id) => {
    const response = await api.get(`/shop-orders/my-shop/${id}`);
    return response.data;
  },

  updateShopOrderStatus: async (id, status) => {
    const response = await api.patch(
      `/shop-orders/my-shop/${id}/status`,
      { status }
    );
    return response.data;
  },
};

export default shopOrderService;
