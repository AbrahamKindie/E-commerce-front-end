
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Phone,
  User,
  CreditCard,
  Truck,
  ShoppingBag,
  LoaderCircle,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import cartService from "../../services/cartService";
import orderService from "../../services/orderService";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

const PLACEHOLDER_IMAGE =
  "https://placehold.co/300x300?text=No+Image";

const formatPrice = (price) =>
  `${Number(price || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ETB`;

const getImageUrl = (image) => {
  if (!image) return PLACEHOLDER_IMAGE;

  if (/^https?:\/\//i.test(image)) return image;

  return `${API_BASE_URL}/${image.replace(/^\/+/, "")}`;
};

// Extract useful error messages from different backend response formats.
const getErrorMessage = (error) => {
  const response = error?.response?.data;

  if (typeof response === "string") {
    return response;
  }

  if (response?.message) {
    return response.message;
  }

  if (response?.error) {
    return response.error;
  }

  if (response?.errors?.length) {
    return response.errors
      .map((item) => item.message || item.msg)
      .filter(Boolean)
      .join(", ");
  }

  if (error?.response?.status) {
    return `Request failed with status ${error.response.status}. Please try again.`;
  }

  return error?.message || "Something went wrong. Please try again.";
};

const Checkout = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    shippingName: user?.name || "",
    shippingPhone: user?.phone || "",
    shippingAddress: user?.address || "",
    shippingCity: user?.city || "",
    shippingCountry: user?.country || "Ethiopia",
    paymentMethod: "CASH_ON_DELIVERY",
  });

  // Keep shipping information synchronized with the authenticated user.
  useEffect(() => {
    if (!user) return;

    setFormData((previous) => ({
      ...previous,
      shippingName: previous.shippingName || user.name || "",
      shippingPhone: previous.shippingPhone || user.phone || "",
      shippingAddress: previous.shippingAddress || user.address || "",
      shippingCity: previous.shippingCity || user.city || "",
      shippingCountry: previous.shippingCountry || user.country || "Ethiopia",
    }));
  }, [user]);

  // Redirect unauthenticated users.
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", {
        replace: true,
        state: { from: "/checkout" },
      });
    }
  }, [isAuthenticated, navigate]);

  // Load the user's cart.
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    const fetchCart = async () => {
      try {
        setLoading(true);
        setError("");

        const cartData = await cartService.getCart();

        if (isMounted) {
          setCart(cartData);
        }
      } catch (err) {
        console.error("Checkout cart loading error:", err);

        if (isMounted) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCart();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // Handle form changes.
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFieldErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setError("");
  };

  // Display field validation errors.
  const renderFieldError = (field) => {
    if (!fieldErrors[field]) return null;

    return (
      <p className="mt-2 flex items-center gap-1 text-sm font-medium text-red-600">
        <AlertCircle size={15} />
        {fieldErrors[field]}
      </p>
    );
  };

  // Reusable input styling.
  const getInputClass = (field) =>
    `w-full rounded-lg border px-4 py-3 outline-none transition focus:ring-2 ${
      fieldErrors[field]
        ? "border-red-500 focus:border-red-500 focus:ring-red-100"
        : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
    }`;

  // Basic frontend validation.
  const validateForm = () => {
    const errors = {};

    if (formData.shippingName.trim().length < 2) {
      errors.shippingName = "Please enter your full name.";
    }

    if (formData.shippingPhone.trim().length < 9) {
      errors.shippingPhone = "Please enter a valid phone number.";
    }

    if (formData.shippingAddress.trim().length < 6) {
      errors.shippingAddress =
        "Please enter a more specific delivery address (at least 6 characters).";
    }

    if (formData.shippingCity.trim().length < 2) {
      errors.shippingCity = "Please enter your city.";
    }

    if (formData.shippingCountry.trim().length < 2) {
      errors.shippingCountry = "Please enter your country.";
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  // Place order.
  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (placingOrder) return;

    setError("");
    setFieldErrors({});

    if (!cart?.items?.length) {
      setError("Your cart is empty. Add products before checkout.");
      return;
    }

    if (!validateForm()) {
      setError("Please correct the highlighted fields.");
      return;
    }

    if (formData.paymentMethod === "CHAPA") {
      setError(
        "Chapa online payment is not available yet. Please select Cash on Delivery."
      );
      return;
    }

    try {
      setPlacingOrder(true);

      const orderPayload = {
        shippingName: formData.shippingName.trim(),
        shippingPhone: formData.shippingPhone.trim(),
        shippingAddress: formData.shippingAddress.trim(),
        shippingCity: formData.shippingCity.trim(),
        shippingCountry: formData.shippingCountry.trim(),
        paymentMethod: formData.paymentMethod,
      };

      console.log("Submitting order:", orderPayload);

      const order = await orderService.createOrder(orderPayload);

      console.log("Order created successfully:", order);

      if (!order?.id) {
        throw new Error(
          "The server response did not contain an order ID."
        );
      }

      navigate(`/order-confirmation/${order.id}`, {
        replace: true,
        state: { order },
      });
    } catch (err) {
      console.error("Place order error:", err);
      console.error(
        "Backend response:",
        err.response?.data || "No backend response received"
      );

      const response = err.response?.data;

      // Handle backend validation errors.
      if (response?.errors?.length) {
        const errors = {};

        response.errors.forEach((item) => {
          if (item.field) {
            errors[item.field] = item.message || "Invalid value.";
          }
        });

        setFieldErrors(errors);
        setError(
          Object.keys(errors).length
            ? "Please correct the highlighted fields."
            : getErrorMessage(err)
        );
      } else {
        setFieldErrors({});
        setError(getErrorMessage(err));
      }
    } finally {
      setPlacingOrder(false);
    }
  };

  // Authentication redirect.
  if (!isAuthenticated) return null;

  // Loading state.
  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <LoaderCircle
          size={36}
          className="animate-spin text-blue-600"
        />
        <p className="text-gray-500">Loading checkout...</p>
      </div>
    );
  }

  // Cart loading failure.
  if (!cart) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <ShoppingBag size={60} className="text-gray-300" />

        <h2 className="mt-5 text-2xl font-bold text-gray-900">
          Unable to load checkout
        </h2>

        <p className="mt-2 max-w-lg text-gray-500">
          {error || "Please try again."}
        </p>

        <Link
          to="/cart"
          className="mt-6 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          Back to Cart
        </Link>
      </div>
    );
  }

  const items = cart.items || [];

  // Empty cart.
  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <ShoppingBag size={60} className="text-gray-300" />

        <h2 className="mt-5 text-2xl font-bold text-gray-900">
          Your cart is empty
        </h2>

        <p className="mt-2 text-gray-500">
          Add some products before proceeding to checkout.
        </p>

        <Link
          to="/products"
          className="mt-6 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <Link
            to="/cart"
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-blue-600"
          >
            <ArrowLeft size={17} />
            Back to Cart
          </Link>

          <h1 className="text-3xl font-bold text-gray-900">
            Checkout
          </h1>

          <p className="mt-2 text-gray-500">
            Complete your shipping information and place your order.
          </p>
        </div>

        {/* General Error */}
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form
          onSubmit={handlePlaceOrder}
          className="grid grid-cols-1 items-start gap-7 lg:grid-cols-3"
        >
          {/* Checkout Form */}
          <div className="space-y-7 lg:col-span-2">

            {/* Shipping Information */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                  <MapPin size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Shipping Information
                  </h2>
                  <p className="text-sm text-gray-500">
                    Where should we deliver your order?
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="shippingName"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Full Name *
                  </label>

                  <div className="relative">
                    <User
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      id="shippingName"
                      type="text"
                      name="shippingName"
                      value={formData.shippingName}
                      onChange={handleChange}
                      minLength={2}
                      maxLength={100}
                      required
                      placeholder="Enter your full name"
                      className={`pl-10 pr-4 ${getInputClass("shippingName")}`}
                    />
                  </div>

                  {renderFieldError("shippingName")}
                </div>

                {/* Phone */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="shippingPhone"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Phone Number *
                  </label>

                  <div className="relative">
                    <Phone
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      id="shippingPhone"
                      type="tel"
                      name="shippingPhone"
                      value={formData.shippingPhone}
                      onChange={handleChange}
                      minLength={9}
                      maxLength={20}
                      required
                      placeholder="e.g. 0912345678"
                      className={`pl-10 pr-4 ${getInputClass("shippingPhone")}`}
                    />
                  </div>

                  {renderFieldError("shippingPhone")}
                </div>

                {/* Delivery Address */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="shippingAddress"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Delivery Address *
                  </label>

                  <textarea
                    id="shippingAddress"
                    name="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={handleChange}
                    minLength={6}
                    maxLength={250}
                    required
                    rows={3}
                    placeholder="Enter your street, area, building or house number"
                    className={`resize-none ${getInputClass("shippingAddress")}`}
                  />

                  {renderFieldError("shippingAddress")}
                </div>

                {/* City */}
                <div>
                  <label
                    htmlFor="shippingCity"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    City *
                  </label>

                  <input
                    id="shippingCity"
                    type="text"
                    name="shippingCity"
                    value={formData.shippingCity}
                    onChange={handleChange}
                    minLength={2}
                    maxLength={100}
                    required
                    placeholder="e.g. Addis Ababa"
                    className={getInputClass("shippingCity")}
                  />

                  {renderFieldError("shippingCity")}
                </div>

                {/* Country */}
                <div>
                  <label
                    htmlFor="shippingCountry"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Country *
                  </label>

                  <input
                    id="shippingCountry"
                    type="text"
                    name="shippingCountry"
                    value={formData.shippingCountry}
                    onChange={handleChange}
                    minLength={2}
                    maxLength={100}
                    required
                    placeholder="Country"
                    className={getInputClass("shippingCountry")}
                  />

                  {renderFieldError("shippingCountry")}
                </div>
              </div>
            </section>

            {/* Payment Method */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                  <CreditCard size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Payment Method
                  </h2>
                  <p className="text-sm text-gray-500">
                    Select how you want to pay.
                  </p>
                </div>
              </div>

              <div className="space-y-4">

                {/* Cash on Delivery */}
                <label
                  className={`flex cursor-pointer items-start gap-4 rounded-xl border p-5 transition ${
                    formData.paymentMethod === "CASH_ON_DELIVERY"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CASH_ON_DELIVERY"
                    checked={formData.paymentMethod === "CASH_ON_DELIVERY"}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 accent-blue-600"
                  />

                  <Truck size={24} className="shrink-0 text-blue-600" />

                  <div>
                    <p className="font-bold text-gray-900">
                      Cash on Delivery
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Pay when your order is delivered.
                    </p>
                  </div>
                </label>

                {/* Chapa */}
                <label
                  className={`flex cursor-pointer items-start gap-4 rounded-xl border p-5 transition ${
                    formData.paymentMethod === "CHAPA"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CHAPA"
                    checked={formData.paymentMethod === "CHAPA"}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 accent-blue-600"
                  />

                  <CreditCard size={24} className="shrink-0 text-blue-600" />

                  <div>
                    <p className="font-bold text-gray-900">
                      Chapa
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Online payment through Chapa.
                    </p>
                    <p className="mt-2 text-xs font-medium text-amber-700">
                      Online payment integration is not yet enabled.
                    </p>
                  </div>
                </label>
              </div>
            </section>
          </div>

          {/* Order Summary */}
          <aside className="rounded-xl border border-gray-200 bg-white p-6 lg:sticky lg:top-6">
            <h2 className="mb-6 text-xl font-bold text-gray-900">
              Order Summary
            </h2>

            {/* Products */}
            <div className="mb-6 max-h-72 space-y-4 overflow-y-auto">
              {items.map((item) => {
                const product = item.product || {};

                return (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={getImageUrl(product.images?.[0])}
                      alt={product.name || "Product"}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = PLACEHOLDER_IMAGE;
                      }}
                      className="h-16 w-16 rounded-lg bg-gray-100 object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {product.name || "Product"}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Quantity: {item.quantity}
                      </p>

                      <p className="mt-1 text-sm font-bold text-gray-900">
                        {formatPrice(item.itemTotal)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="space-y-4 border-t border-gray-200 pt-5">
              <div className="flex justify-between gap-3 text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(cart.subtotal)}</span>
              </div>

              <div className="flex justify-between gap-3 text-green-600">
                <span>Discount</span>
                <span>- {formatPrice(cart.discountTotal)}</span>
              </div>

              <div className="flex justify-between gap-3 text-gray-600">
                <span>Shipping</span>
                <span className="font-semibold">Not included</span>
              </div>

              <div className="border-t border-gray-200 pt-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-gray-900">
                    Total
                  </span>

                  <strong className="text-2xl text-gray-900">
                    {formatPrice(cart.total)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Place Order */}
            <button
              type="submit"
              disabled={placingOrder || loading}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-4 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {placingOrder ? (
                <>
                  <LoaderCircle size={20} className="animate-spin" />
                  Placing Order...
                </>
              ) : (
                "Place Order"
              )}
            </button>

            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-500">
              <ShieldCheck size={16} className="text-green-600" />
              Your order information is securely submitted.
            </div>

            <Link
              to="/cart"
              className="mt-5 block text-center text-sm font-semibold text-gray-600 transition hover:text-blue-600"
            >
              Return to Cart
            </Link>
          </aside>
        </form>
      </div>
    </main>
  );
};

export default Checkout;
