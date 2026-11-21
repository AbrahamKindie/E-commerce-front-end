
import api from "./api";

const passwordService = {
  changePassword: async (passwordData) => {
    const response = await api.post(
      "/auth/change-password",
      passwordData
    );

    return response.data;
  },
};

export default passwordService;
