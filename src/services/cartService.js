
import api from "./api";

const cartService = {
  // Get the logged-in user's cart
  getCart: async () => {
    const response = await api.get("/carts");
    return response.data.data;
  },

  // Add a product to the cart
  addToCart: async (productId, quantity = 1) => {
    const response = await api.post("/carts/items", {
      productId,
      quantity,
    });

    return response.data.data;
  },

  // Update cart item quantity
  updateCartItem: async (itemId, quantity) => {
    const response = await api.patch(`/carts/items/${itemId}`, {
      quantity,
    });

    return response.data.data;
  },

  // Remove an item
  removeCartItem: async (itemId) => {
    const response = await api.delete(`/carts/items/${itemId}`);
    return response.data.data;
  },

  // Clear the cart
  clearCart: async () => {
    const response = await api.delete("/carts/items");
    return response.data.data;
  },
};

export default cartService;
