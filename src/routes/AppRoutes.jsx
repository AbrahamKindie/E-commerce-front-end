
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ==========================================
// CUSTOMER PAGES
// ==========================================

import Home from "../pages/Home/Home";
import Products from "../pages/Products/Products";
import ProductDetails from "../pages/Products/ProductDetails";
import Categories from "../pages/Categories/Categories";
import CategoryDetails from "../pages/Categories/CategoryDetails";
import Carts from "../pages/Carts/Carts";
import Checkout from "../pages/Checkout/Checkout";
import OrderConfirmation from "../pages/Orders/OrderConfirmation";
import MyOrders from "../pages/Orders/MyOrders";
import MyProductReports from "../pages/Products/MyProductReports";
import MyAccount from "../pages/Account/MyAccount";
import Wishlist from "../pages/Products/Wishlist";

// ==========================================
// AUTH PAGES
// ==========================================

import Register from "../pages/Auth/Register";
import Login from "../pages/Auth/Login";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import ResetPassword from "../pages/Auth/ResetPassword";
import AdminPasswordSetup from "../pages/Auth/AdminPasswordSetup";

// ==========================================
// ROUTE GUARDS
// ==========================================

import ProtectedRoute from "./ProtectedRoute";
import ShopOwnerRoute from "./ShopOwnerRoute";

// ==========================================
// SHOP COMPONENTS
// ==========================================

import ShopLayout from "../commponents/Shop/ShopLayout";

// ==========================================
// SHOP PAGES
// ==========================================

import ShopDashboard from "../pages/Shop/ShopDashboard";
import ShopProducts from "../pages/Shop/ShopProducts";
import ShopCategories from "../pages/Shop/ShopCategories";
import ShopOrders from "../pages/Shop/ShopOrders";
import ShopReviews from "../pages/Shop/ShopReviews";
import ShopSettings from "../pages/Shop/ShopSettings";
import ShopCategoryDetails from "../pages/Shop/ShopCategoryDetails";

// ==========================================
// SHOP PRODUCT PAGES
// ==========================================

import CreateProduct from "../pages/Shop/Products/CreateProduct";
import EditProduct from "../pages/Shop/Products/EditProduct";

// ==========================================
// ADMIN COMPONENTS
// ==========================================

import AdminLayout from "../commponents/Admin/AdminLayout";

// ==========================================
// ADMIN PAGES
// ==========================================

import AdminDashboard from "../pages/Admin/AdminDashboard";
import AdminShopCategories from "../pages/Admin/ShopCategories/AdminShopCategories";
import UserManagement from "../pages/Admin/UserManagement";
import ShopsList from "../pages/Admin/Shops/ShopsList";
import ShopDetails from "../pages/Admin/Shops/ShopDetails";
import ActivityLogs from "../pages/Admin/ActivityLogs/ActivityLogs";
import ActivityLogDetails from "../pages/Admin/ActivityLogs/ActivityLogDetails";
import AdminProducts from "../pages/Admin/Products/AdminProducts";
import AdminProductDetails from "../pages/Admin/Products/AdminProductDetail";
import AdminOrders from "../pages/Admin/Orders/AdminOrders";
import AdminRoles from "../commponents/Admin/AdminRoles";

// ==========================================
// ADMIN ROLE GUARD
// ==========================================

const AdminRoleRoute = () => {
  const { user } = useAuth();

  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user?.role);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

// ==========================================
// ADMIN PERMISSION GUARD
// ==========================================

const AdminPermissionRoute = ({
  permission,
  permissions,
  requireAllPermissions = false,
}) => {
  const { user } = useAuth();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const userPermissions = user?.adminPermissions || [];

  const hasPermission = permissions?.length
    ? requireAllPermissions
      ? permissions.every((item) => userPermissions.includes(item))
      : permissions.some((item) => userPermissions.includes(item))
    : !permission || userPermissions.includes(permission);

  if (!isSuperAdmin && !hasPermission) {
    return <Navigate to="/my-account" replace />;
  }

  return <Outlet />;
};

// ==========================================
// APPLICATION ROUTES
// ==========================================

function AppRoutes() {
  return (
    <Routes>
      {/* ================================== */}
      {/* PUBLIC STOREFRONT ROUTES */}
      {/* ================================== */}

      <Route path="/" element={<Home />} />

      <Route path="/products" element={<Products />} />
      <Route path="/products/:id" element={<ProductDetails />} />

      <Route path="/categories" element={<Categories />} />
      <Route path="/categories/:id" element={<CategoryDetails />} />

      <Route path="/cart" element={<Carts />} />

      {/* ================================== */}
      {/* AUTHENTICATION ROUTES */}
      {/* ================================== */}

      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      <Route
        path="/reset-password"
        element={<ResetPassword />}
      />

      {/* ================================== */}
      {/* ADMIN FIRST-TIME PASSWORD SETUP */}
      {/* ================================== */}

      <Route
        path="/admin/set-password"
        element={<AdminPasswordSetup />}
      />

      {/* ================================== */}
      {/* AUTHENTICATED ACCOUNT ROUTES */}
      {/* ================================== */}

      <Route element={<ProtectedRoute />}>
        <Route path="/my-account" element={<MyAccount />} />
        <Route path="/checkout" element={<Checkout />} />

        <Route
          path="/order-confirmation/:id"
          element={<OrderConfirmation />}
        />

        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/orders" element={<MyOrders />} />
        <Route path="/wishlist" element={<Wishlist />} />

        <Route
          path="/my-reports"
          element={<MyProductReports />}
        />
      </Route>

      {/* ================================== */}
      {/* SHOP OWNER ROUTES */}
      {/* ================================== */}

      <Route element={<ShopOwnerRoute />}>
        <Route path="/shop" element={<ShopLayout />}>
          <Route
            index
            element={<Navigate to="/shop/dashboard" replace />}
          />

          <Route
            path="dashboard"
            element={<ShopDashboard />}
          />

          <Route
            path="products"
            element={<ShopProducts />}
          />

          <Route
            path="products/create"
            element={<CreateProduct />}
          />

          <Route
            path="products/:id/edit"
            element={<EditProduct />}
          />

          <Route
            path="categories"
            element={<ShopCategories />}
          />
          <Route
          path="categories/:id"
          element={<ShopCategoryDetails />}
           />

          <Route
            path="orders"
            element={<ShopOrders />}
          />

          <Route
            path="reviews"
            element={<ShopReviews />}
          />

          <Route
            path="settings"
            element={<ShopSettings />}
          />
        </Route>
      </Route>

      {/* ================================== */}
      {/* ADMIN ROUTES */}
      {/* ================================== */}

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminRoleRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            {/* ADMIN DASHBOARD */}

            <Route
              element={
                <AdminPermissionRoute permission="VIEW_REPORTS" />
              }
            >
              <Route
                index
                element={<AdminDashboard />}
              />
            </Route>

            {/* ADMIN ROLE MANAGEMENT */}

            <Route
              element={
                <AdminPermissionRoute permission="VIEW_ADMIN_ROLES" />
              }
            >
              <Route
                path="roles"
                element={<AdminRoles />}
              />
            </Route>

            {/* USER MANAGEMENT */}

            <Route
              element={
                <AdminPermissionRoute
                  permissions={["VIEW_USERS", "VIEW_ADMINS"]}
                />
              }
            >
              <Route
                path="users"
                element={<UserManagement />}
              />
            </Route>

            {/* SHOP MANAGEMENT */}

            <Route
              element={
                <AdminPermissionRoute permission="VIEW_SHOPS" />
              }
            >
              <Route
                path="shops"
                element={<ShopsList />}
              />

              <Route
                path="shops/:shopId"
                element={<ShopDetails />}
              />
            </Route>

            {/* SHOP CATEGORY MANAGEMENT */}
            {/* No VIEW_CATEGORIES permission.
                Access is based on management permissions. */}

            <Route
              element={
                <AdminPermissionRoute
                  permissions={[
                    "CREATE_CATEGORIES",
                    "UPDATE_CATEGORIES",
                    "DELETE_CATEGORIES",
                  ]}
                />
              }
            >
              <Route
                path="categories"
                element={<AdminShopCategories />}
              />
            </Route>

            {/* PRODUCT MANAGEMENT */}

            <Route
              element={
                <AdminPermissionRoute permission="VIEW_PRODUCTS" />
              }
            >
              <Route
                path="products"
                element={<AdminProducts />}
              />

              <Route
                path="products/:id"
                element={<AdminProductDetails />}
              />
            </Route>

            {/* ORDER MANAGEMENT */}

            <Route
              element={
                <AdminPermissionRoute permission="VIEW_ORDERS" />
              }
            >
              <Route
                path="orders"
                element={<AdminOrders />}
              />
            </Route>

            {/* ACTIVITY LOGS */}

            <Route
              element={
                <AdminPermissionRoute permission="VIEW_ACTIVITY_LOGS" />
              }
            >
              <Route
                path="activity-logs"
                element={<ActivityLogs />}
              />

              <Route
                path="activity-logs/:logId"
                element={<ActivityLogDetails />}
              />
            </Route>
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoutes;
