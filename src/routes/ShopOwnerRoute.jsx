
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ==========================================
// SHOP OWNER ROUTE PROTECTION
// ACTIVE SHOP OWNERS ONLY
// ==========================================

const ShopOwnerRoute = () => {
  const {
    isAuthenticated,
    isShopOwner,
    shopStatus,
  } = useAuth();

  // User must be authenticated.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Only Shop Owners can access the Shop Management portal.
  if (!isShopOwner) {
    return <Navigate to="/" replace />;
  }

  // Deactivated Shop Owners cannot access shop management.
  // They can still use normal customer features.
  if (shopStatus === "DEACTIVATED") {
    return (
      <Navigate
        to="/my-account"
        replace
        state={{ message: "Your shop is deactivated." }}
      />
    );
  }

  // Only active shops can access the Shop Management portal.
  if (shopStatus !== "ACTIVE") {
    return <Navigate to="/my-account" replace />;
  }

  return <Outlet />;
};

export default ShopOwnerRoute;
