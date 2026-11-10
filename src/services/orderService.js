
import api from "./api";

const orderService = {
  // Create an order from the customer's active cart.
  createOrder: async (orderData) => {
    const response = await api.post("/orders", orderData);
    return response.data.data;
  },

  // Get the logged-in customer's orders.
  getMyOrders: async (page = 1, limit = 10) => {
    const response = await api.get("/orders/my-orders", {
      params: { page, limit },
    });

    return {
      orders: response.data.data,
      pagination: response.data.pagination,
    };
  },

  // Get a single order by ID.
  getOrderById: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data.data;
  },
};

export default orderService;
