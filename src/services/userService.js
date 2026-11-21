
import api from "./api";

const userService = {
  // GET LOGGED-IN USER PROFILE
  getProfile: async () => {
    const response = await api.get("/users/profile");
    return response.data;
  },

  // UPDATE PERSONAL PROFILE
  updateProfile: async (profileData) => {
    const response = await api.put(
      "/users/update-profile",
      profileData
    );

    return response.data;
  },

  // UPLOAD PROFILE PICTURE
  uploadProfilePicture: async (imageFile) => {
    const formData = new FormData();

    formData.append("profileImage", imageFile);

    const response = await api.put(
      "/users/profile-picture",
      formData
    );

    return response.data;
  },
};

export default userService;
