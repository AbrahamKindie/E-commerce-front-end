
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";

import authService from "../services/authService";
import userService from "../services/userService";

const AuthContext = createContext(null);

// ==========================================
// ADMIN PERMISSION CONFIGURATION
// ==========================================

const LEGACY_ADMIN_PERMISSIONS = new Set([
  "MANAGE_ADMIN_PERMISSIONS",
]);

// ==========================================
// NORMALIZE AUTHENTICATED USER
// ==========================================

const normalizeUser = (user, previousUser = null) => {
  if (!user) return null;

  const role = user.role ?? previousUser?.role ?? null;

  const incomingPermissions = user.adminPermissions;

  const adminPermissions = Array.isArray(incomingPermissions)
    ? [...new Set(
        incomingPermissions.filter(
          (permission) =>
            typeof permission === "string" &&
            permission.trim().length > 0 &&
            !LEGACY_ADMIN_PERMISSIONS.has(permission)
        )
      )]
    : previousUser?.adminPermissions ?? [];

  return {
    ...previousUser,
    ...user,

    // Support both backend and frontend ID conventions.
    id: user.id ?? user.userId ?? previousUser?.id,
    userId:
      user.userId ??
      user.id ??
      previousUser?.userId,

    role,

    // Database-driven Admin permissions.
    adminPermissions,

    // Super Admin identification.
    isSuperAdmin: role === "SUPER_ADMIN",

    // Preserve existing shop information when the API
    // does not include it in the response.
    shop:
      user.shop !== undefined
        ? user.shop
        : previousUser?.shop ?? null,
  };
};

// ==========================================
// LOCAL STORAGE HELPERS
// ==========================================

const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) return null;

    return normalizeUser(JSON.parse(storedUser));
  } catch {
    localStorage.removeItem("user");
    return null;
  }
};

const saveUser = (user) => {
  if (!user) {
    localStorage.removeItem("user");
    return;
  }

  localStorage.setItem("user", JSON.stringify(user));
};

// ==========================================
// AUTH PROVIDER
// ==========================================

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);

  const [accessToken, setAccessToken] = useState(() =>
    localStorage.getItem("accessToken")
  );

  const [loading, setLoading] = useState(false);

  // ==========================================
  // AUTHENTICATION STATUS
  // ==========================================

  const isAuthenticated = Boolean(user && accessToken);

  // ==========================================
  // USER ROLE STATUS
  // ==========================================

  const isAdmin = user?.role === "ADMIN";

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const isUser = user?.role === "USER";

  const isShopOwner = user?.role === "SHOP_OWNER";

  // ==========================================
  // SHOP STATUS
  // ==========================================

  const shopStatus = isShopOwner
    ? user?.shop?.status ?? null
    : null;

  const isActiveShopOwner =
    isShopOwner && shopStatus === "ACTIVE";

  const isDeactivatedShopOwner =
    isShopOwner && shopStatus === "DEACTIVATED";

  // ==========================================
  // ADMIN PERMISSIONS
  // ==========================================

  const adminPermissions = useMemo(() => {
    if (!isAdmin || !user?.isActive) {
      return [];
    }

    return Array.isArray(user.adminPermissions)
      ? user.adminPermissions
      : [];
  }, [isAdmin, user?.isActive, user?.adminPermissions]);

  // CHECK ONE PERMISSION
  const hasPermission = useCallback(
    (permission) => {
      if (!user || !user.isActive) {
        return false;
      }

      // Super Admin has unrestricted access.
      if (user.role === "SUPER_ADMIN") {
        return true;
      }

      if (user.role !== "ADMIN") {
        return false;
      }

      if (
        typeof permission !== "string" ||
        LEGACY_ADMIN_PERMISSIONS.has(permission)
      ) {
        return false;
      }

      return adminPermissions.includes(permission);
    },
    [user, adminPermissions]
  );

  // CHECK AT LEAST ONE PERMISSION
  const hasAnyPermission = useCallback(
    (permissions = []) => {
      if (!Array.isArray(permissions) || !permissions.length) {
        return false;
      }

      if (isSuperAdmin && user?.isActive) {
        return true;
      }

      return permissions.some((permission) =>
        hasPermission(permission)
      );
    },
    [hasPermission, isSuperAdmin, user?.isActive]
  );

  // CHECK ALL PERMISSIONS
  const hasAllPermissions = useCallback(
    (permissions = []) => {
      if (!Array.isArray(permissions) || !permissions.length) {
        return false;
      }

      if (isSuperAdmin && user?.isActive) {
        return true;
      }

      return permissions.every((permission) =>
        hasPermission(permission)
      );
    },
    [hasPermission, isSuperAdmin, user?.isActive]
  );

  // ==========================================
  // FETCH LATEST PROFILE
  // ==========================================

  const refreshProfile = useCallback(async () => {
    if (!accessToken) {
      return null;
    }

    const response = await userService.getProfile();

    if (!response?.user) {
      throw new Error(
        "Profile response is missing user information."
      );
    }

    let updatedUser;

    setUser((previousUser) => {
      updatedUser = normalizeUser(
        response.user,
        previousUser
      );

      saveUser(updatedUser);

      return updatedUser;
    });

    return response.user;
  }, [accessToken]);

  // ==========================================
  // AUTOMATIC PROFILE REFRESH
  // ==========================================

  useEffect(() => {
    if (!accessToken || !user) return;

    let isMounted = true;

    const fetchProfile = async () => {
      try {
        const response = await userService.getProfile();

        if (!isMounted || !response?.user) return;

        setUser((previousUser) => {
          const updatedUser = normalizeUser(
            response.user,
            previousUser
          );

          saveUser(updatedUser);

          return updatedUser;
        });
      } catch (error) {
        if (isMounted) {
          console.error(
            "Failed to fetch latest user profile:",
            error
          );
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  // ==========================================
  // HANDLE SESSION EXPIRATION
  // ==========================================

  const clearSession = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    setAccessToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      clearSession();
    };

    window.addEventListener(
      "auth:session-expired",
      handleSessionExpired
    );

    return () => {
      window.removeEventListener(
        "auth:session-expired",
        handleSessionExpired
      );
    };
  }, [clearSession]);

  // ==========================================
  // REGISTER BUYER OR SHOP OWNER
  // ==========================================

  const register = async (userData) => {
    setLoading(true);

    try {
      return await authService.register(userData);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOGIN
  // ==========================================

  const login = async (credentials) => {
    setLoading(true);

    try {
      const response = await authService.login(credentials);

      const newAccessToken =
        response.accessToken || response.token;

      const refreshToken = response.refreshToken;

      if (!newAccessToken || !response.user) {
        throw new Error(
          "Login response is missing access token or user information."
        );
      }

      const authenticatedUser = normalizeUser(response.user);

      // Save tokens.
      localStorage.setItem(
        "accessToken",
        newAccessToken
      );

      if (refreshToken) {
        localStorage.setItem(
          "refreshToken",
          refreshToken
        );
      } else {
        localStorage.removeItem("refreshToken");
      }

      // Save authenticated user.
      saveUser(authenticatedUser);

      setUser(authenticatedUser);
      setAccessToken(newAccessToken);

      return {
        ...response,
        accessToken: newAccessToken,
        user: authenticatedUser,
      };
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      clearSession();
    }
  };

  // ==========================================
  // UPDATE AUTHENTICATED USER INFORMATION
  // ==========================================

  const updateUser = (updatedUser) => {
    if (!updatedUser || typeof updatedUser !== "object") {
      return;
    }

    setUser((previousUser) => {
      const newUser = normalizeUser(
        updatedUser,
        previousUser
      );

      saveUser(newUser);

      return newUser;
    });
  };

  // ==========================================
  // FORGOT PASSWORD
  // ==========================================

  const forgotPassword = async (email) => {
    setLoading(true);

    try {
      return await authService.forgotPassword(email);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // RESET PASSWORD
  // ==========================================

  const resetPassword = async (token, newPassword) => {
    setLoading(true);

    try {
      return await authService.resetPassword(
        token,
        newPassword
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // VERIFY ADMIN PASSWORD SETUP TOKEN
  // ==========================================

  const verifyAdminPasswordSetup = useCallback(
    async (token) => {
      setLoading(true);

      try {
        return await authService.verifyAdminPasswordSetup(
          token
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ==========================================
  // SET ADMIN FIRST-TIME PASSWORD
  // ==========================================

  const setupAdminPassword = useCallback(
    async (token, newPassword, confirmPassword) => {
      setLoading(true);

      try {
        return await authService.setupAdminPassword(
          token,
          newPassword,
          confirmPassword
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ==========================================
  // CONTEXT PROVIDER
  // ==========================================

  const contextValue = useMemo(
    () => ({
      // USER
      user,
      adminPermissions,

      // AUTHENTICATION
      accessToken,
      loading,
      isAuthenticated,

      // ROLES
      isAdmin,
      isSuperAdmin,
      isUser,
      isShopOwner,

      // SHOP STATUS
      shopStatus,
      isActiveShopOwner,
      isDeactivatedShopOwner,

      // PERMISSION HELPERS
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,

      // PROFILE
      refreshProfile,
      updateUser,

      // AUTHENTICATION ACTIONS
      register,
      login,
      logout,

      // PASSWORD MANAGEMENT
      forgotPassword,
      resetPassword,
      verifyAdminPasswordSetup,
      setupAdminPassword,
    }),
    [
      user,
      adminPermissions,
      accessToken,
      loading,
      isAuthenticated,
      isAdmin,
      isSuperAdmin,
      isUser,
      isShopOwner,
      shopStatus,
      isActiveShopOwner,
      isDeactivatedShopOwner,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      refreshProfile,
      updateUser,
      verifyAdminPasswordSetup,
      setupAdminPassword,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ==========================================
// CUSTOM AUTH HOOK
// ==========================================

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};
