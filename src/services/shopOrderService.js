
import api from "./api";

const shopOrderService = {
  getMyShopOrders: async (params = {}) => {
    const response = await api.get("/orders/my-shop", { params });
    return response.data;
  },

  getMyShopOrderById: async (id) => {
    const response = await api.get(`/orders/my-shop/${id}`);
    return response.data;
  },

  updateShopOrderStatus: async (id, status) => {
    const response = await api.patch(
      `//orders/my-shopp/${id}/status`,
      { status }
    );
    return response.data;
  },
};

export default shopOrderService;
