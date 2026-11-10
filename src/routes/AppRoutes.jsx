
import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home/Home";

import Register from "../pages/Auth/Register";
import Login from "../pages/Auth/Login";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import ResetPassword from "../pages/Auth/ResetPassword";

import Products from "../pages/Products/Products";
import ProductDetails from "../pages/Products/ProductDetails";

import Categories from "../pages/Categories/Categories";
import CategoryDetails from "../pages/Categories/CategoryDetails";

import Carts from "../pages/Carts/Carts";
import Checkout from "../pages/Checkout/Checkout";

import OrderConfirmation from "../pages/Orders/OrderConfirmation";
import MyOrders from "../pages/Orders/MyOrders";

function AppRoutes() {
  return (
    <Routes>
      {/* Home */}
      <Route path="/" element={<Home />} />

      {/* Products */}
      <Route path="/products" element={<Products />} />
      <Route path="/products/:id" element={<ProductDetails />} />

      {/* Categories */}
      <Route path="/categories" element={<Categories />} />
      <Route
        path="/categories/:id"
        element={<CategoryDetails />}
      />

      {/* Authentication */}
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Cart */}
      <Route path="/cart" element={<Carts />} />

      {/* Checkout */}
      <Route path="/checkout" element={<Checkout />} />

      {/* Orders */}
      <Route
        path="/order-confirmation/:id"
        element={<OrderConfirmation />}
      />

      <Route path="/my-orders" element={<MyOrders />} />
      <Route path="/orders" element={<MyOrders />} />
    </Routes>
  );
}

export default AppRoutes;
