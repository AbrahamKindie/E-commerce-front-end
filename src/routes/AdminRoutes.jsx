
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminRoute = ({
  requiredPermission,
  requiredPermissions,
  requireAllPermissions = false,
}) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user?.role);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // SUPER_ADMIN has unrestricted Admin access.
  if (user.role === "SUPER_ADMIN") {
    return <Outlet />;
  }

  const permissions = user?.adminPermissions || [];

  const hasPermission =
    requiredPermissions?.length > 0
      ? requireAllPermissions
        ? requiredPermissions.every((permission) =>
            permissions.includes(permission)
          )
        : requiredPermissions.some((permission) =>
            permissions.includes(permission)
          )
      : !requiredPermission ||
        permissions.includes(requiredPermission);

  if (!hasPermission) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
