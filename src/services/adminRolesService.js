
import api from "./api";

const adminRolesService = {
  // ==========================================
  // ADMIN ROLE MANAGEMENT
  // ==========================================

  // Get all Admin roles
  getAdminRoles: async () => {
    const response = await api.get("/admin/roles");
    return response.data;
  },

  // Get one Admin role
  getAdminRoleById: async (roleId) => {
    const response = await api.get(`/admin/roles/${roleId}`);
    return response.data;
  },

  // Get backend-supported permission catalog
  getAvailableAdminPermissions: async () => {
    const response = await api.get("/admin/roles/permissions");
    return response.data;
  },

  // Create Admin role
  createAdminRole: async (roleData) => {
    const response = await api.post("/admin/roles", roleData);
    return response.data;
  },

  // Update Admin role
  updateAdminRole: async (roleId, roleData) => {
    const response = await api.put(
      `/admin/roles/${roleId}`,
      roleData
    );

    return response.data;
  },

  // Activate / Deactivate Admin role
  updateAdminRoleStatus: async (roleId, isActive) => {
    const response = await api.patch(
      `/admin/roles/${roleId}/status`,
      { isActive }
    );

    return response.data;
  },

  // Delete Admin role
  deleteAdminRole: async (roleId) => {
    const response = await api.delete(
      `/admin/roles/${roleId}`
    );

    return response.data;
  },

  // ==========================================
  // ADMIN ROLE ASSIGNMENT
  // ==========================================

  // Assign an active role to an Admin account
  assignAdminRole: async (adminId, adminRoleId) => {
    const response = await api.patch(
      `/admin/${adminId}/role`,
      { adminRoleId }
    );

    return response.data;
  },
};

export default adminRolesService;
