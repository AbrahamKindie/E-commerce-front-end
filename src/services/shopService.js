
import api from "./api";

const shopService = {
  // ==========================================
  // GET MY SHOP PROFILE
  // ==========================================

  getMyShop: async () => {
    const response = await api.get("/shops/profile");
    return response.data;
  },

  // ==========================================
  // UPDATE SHOP PROFILE
  // ==========================================

  updateMyShop: async (shopData) => {
    const response = await api.put(
      "/shops/update-profile",
      shopData
    );

    return response.data;
  },

  // ==========================================
  // UPDATE SHOP LOGO AND COVER IMAGE
  // ==========================================

  updateMyShopImages: async (formData) => {
    const response = await api.patch(
      "/shops/my-shop/images",
      formData
    );

    return response.data;
  },
};

export default shopService;
