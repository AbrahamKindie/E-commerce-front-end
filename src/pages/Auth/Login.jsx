
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import cartService from "../../services/cartService";

const Login = () => {
  const { login, loading } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [addingToCart, setAddingToCart] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");

      const response = await login(formData);

      const pendingAddToCart =
        location.state?.pendingAddToCart;

      if (pendingAddToCart) {
        try {
          setAddingToCart(true);

          await cartService.addToCart(
            pendingAddToCart.productId,
            pendingAddToCart.quantity
          );

          navigate("/cart", { replace: true });
          return;
        } catch (cartErr) {
          setError(
            cartErr.response?.data?.message ||
              "Login successful, but we could not add the product to your cart. Please try again."
          );

          return;
        } finally {
          setAddingToCart(false);
        }
      }

      const destination = location.state?.from;

      const target =
        typeof destination === "string"
          ? destination
          : destination?.pathname || "/";

      navigate(target, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Invalid email or password."
      );
    }
  };

  const isSubmitting = loading || addingToCart;

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Lock size={26} />
          </div>

          <h1 className="mt-5 text-3xl font-bold text-gray-900">
            Welcome Back
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Sign in to continue shopping.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Email Address
            </label>

            <div className="flex items-center rounded-lg border border-gray-300 px-3 focus-within:border-blue-600">
              <Mail size={18} className="text-gray-400" />

              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                autoComplete="email"
                className="w-full border-0 px-3 py-3 outline-none focus:ring-0"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="mb-2 flex justify-between">
              <label
                htmlFor="password"
                className="text-sm font-semibold text-gray-700"
              >
                Password
              </label>

              <Link
                to="/forgot-password"
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <div className="flex items-center rounded-lg border border-gray-300 px-3 focus-within:border-blue-600">
              <Lock size={18} className="text-gray-400" />

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="w-full border-0 px-3 py-3 outline-none focus:ring-0"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-blue-600 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {addingToCart
              ? "Adding Product to Cart..."
              : loading
                ? "Signing In..."
                : "Sign In"}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link
            to="/register"
            state={location.state}
            className="font-semibold text-blue-600 hover:underline"
          >
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
