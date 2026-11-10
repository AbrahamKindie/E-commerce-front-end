
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  ArrowLeft,
  ShoppingBag,
  LoaderCircle,
  ClipboardList,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import cartService from "../../services/cartService";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

const PLACEHOLDER_IMAGE =
  "https://placehold.co/300x300?text=No+Image";

const getImageUrl = (image) => {
  if (!image) return PLACEHOLDER_IMAGE;

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  return `${API_BASE_URL}/${image.replace(/^\/+/, "")}`;
};

const formatPrice = (price) => {
  return `${Number(price || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ETB`;
};

const Carts = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingItem, setUpdatingItem] = useState(null);
  const [removingItem, setRemovingItem] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");

  // Fetch the authenticated user's cart.
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", {
        replace: true,
        state: { from: location.pathname },
      });
      return;
    }

    const fetchCart = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await cartService.getCart();
        setCart(data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load your cart."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [isAuthenticated, navigate, location.pathname]);

  // Update product quantity.
  const updateQuantity = async (itemId, quantity) => {
    if (
      quantity < 1 ||
      updatingItem ||
      removingItem !== null ||
      clearing
    ) {
      return;
    }

    try {
      setUpdatingItem(itemId);
      setError("");

      const updatedCart = await cartService.updateCartItem(
        itemId,
        quantity
      );

      setCart(updatedCart);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update product quantity."
      );
    } finally {
      setUpdatingItem(null);
    }
  };

  // Remove an individual product.
  const removeItem = async (itemId) => {
    if (
      updatingItem !== null ||
      removingItem !== null ||
      clearing
    ) {
      return;
    }

    try {
      setRemovingItem(itemId);
      setError("");

      const updatedCart = await cartService.removeCartItem(itemId);
      setCart(updatedCart);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to remove product from cart."
      );
    } finally {
      setRemovingItem(null);
    }
  };

  // Clear all cart items.
  const clearCart = async () => {
    if (
      clearing ||
      updatingItem !== null ||
      removingItem !== null
    ) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to clear your cart?"
    );

    if (!confirmed) return;

    try {
      setClearing(true);
      setError("");

      const updatedCart = await cartService.clearCart();
      setCart(updatedCart);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to clear your cart."
      );
    } finally {
      setClearing(false);
    }
  };

  // Show nothing while redirecting unauthenticated users.
  if (!isAuthenticated) return null;

  // Loading state.
  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <LoaderCircle
          className="animate-spin text-blue-600"
          size={36}
        />
        <p className="text-gray-500">Loading your cart...</p>
      </div>
    );
  }

  // Failed to load cart.
  if (!cart) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <ShoppingCart size={60} className="text-gray-400" />

        <h2 className="mt-5 text-2xl font-bold text-gray-900">
          Unable to load your cart
        </h2>

        <p className="mt-2 text-gray-500">
          {error || "Please try again."}
        </p>

        <button
          onClick={() => window.location.reload()}
          className="mt-6 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          Try Again
        </button>

        <Link
          to="/my-orders"
          className="mt-4 inline-flex items-center gap-2 font-semibold text-gray-700 transition hover:text-blue-600"
        >
          <ClipboardList size={18} />
          My Orders
        </Link>
      </div>
    );
  }

  const items = cart.items || [];
  const isEmpty = items.length === 0;

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Page Heading */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <span className="text-xs font-bold tracking-widest text-gray-500">
              YOUR SHOPPING BAG
            </span>

            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              Shopping Cart
            </h1>

            <p className="mt-2 text-gray-500">
              {cart.totalItems || 0}{" "}
              {cart.totalItems === 1 ? "item" : "items"} in your cart
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/my-orders"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2.5 font-semibold text-blue-700 shadow-sm transition hover:border-blue-600 hover:bg-blue-50"
            >
              <ClipboardList size={18} />
              My Orders
            </Link>

            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 font-semibold text-gray-700 transition hover:text-blue-600"
            >
              <ArrowLeft size={18} />
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {isEmpty ? (
          /* Empty Cart */
          <div className="flex min-h-[350px] flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-center">
            <ShoppingBag size={65} className="text-gray-300" />

            <h2 className="mt-5 text-2xl font-bold text-gray-900">
              Your cart is empty
            </h2>

            <p className="mt-2 text-gray-500">
              Looks like you haven't added anything to your cart yet.
            </p>

            <Link
              to="/products"
              className="mt-6 rounded-lg bg-blue-600 px-7 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Start Shopping
            </Link>

            <Link
              to="/my-orders"
              className="mt-4 inline-flex items-center gap-2 font-semibold text-gray-700 transition hover:text-blue-600"
            >
              <ClipboardList size={18} />
              View My Orders
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-3">

            {/* Cart Items */}
            <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-7 lg:col-span-2">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-gray-900">
                  Your Items
                </h2>

                <button
                  onClick={clearCart}
                  disabled={
                    clearing ||
                    updatingItem !== null ||
                    removingItem !== null
                  }
                  className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {clearing ? (
                    <LoaderCircle
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Trash2 size={16} />
                  )}

                  {clearing ? "Clearing..." : "Clear Cart"}
                </button>
              </div>

              <div className="divide-y divide-gray-200">
                {items.map((item) => {
                  const product = item.product || {};
                  const image = product.images?.[0];

                  const isUpdating = updatingItem === item.id;
                  const isRemoving = removingItem === item.id;

                  return (
                    <article
                      key={item.id}
                      className="grid grid-cols-1 gap-4 py-6 sm:grid-cols-[110px_minmax(0,1fr)_auto]"
                    >
                      {/* Product Image */}
                      <Link
                        to={`/products/${product.id}`}
                        className="h-28 w-28 overflow-hidden rounded-lg bg-gray-100"
                      >
                        <img
                          src={getImageUrl(image)}
                          alt={product.name || "Product"}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = PLACEHOLDER_IMAGE;
                          }}
                          className="h-full w-full object-cover"
                        />
                      </Link>

                      {/* Product Details */}
                      <div className="min-w-0">
                        <Link
                          to={`/products/${product.id}`}
                          className="font-bold text-gray-900 transition hover:text-blue-600"
                        >
                          {product.name || "Unnamed Product"}
                        </Link>

                        {Number(product.discountAmount) > 0 && (
                          <span className="mt-2 inline-block rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                            Discount applied
                          </span>
                        )}

                        <div className="mt-2 flex items-center gap-3">
                          <span className="font-bold text-gray-900">
                            {formatPrice(
                              product.discountedPrice ?? product.price
                            )}
                          </span>

                          {Number(product.discountAmount) > 0 && (
                            <del className="text-sm text-gray-400">
                              {formatPrice(product.originalPrice)}
                            </del>
                          )}
                        </div>

                        {/* Quantity and Remove */}
                        <div className="mt-4 flex flex-wrap items-center gap-5">

                          {/* Quantity Selector */}
                          <div className="flex items-center rounded-lg border border-gray-200">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  item.quantity - 1
                                )
                              }
                              disabled={
                                isUpdating ||
                                isRemoving ||
                                clearing ||
                                item.quantity <= 1
                              }
                              className="p-2 text-gray-600 transition hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={15} />
                            </button>

                            <span className="min-w-8 text-center text-sm font-semibold">
                              {isUpdating ? "..." : item.quantity}
                            </span>

                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  item.quantity + 1
                                )
                              }
                              disabled={
                                isUpdating ||
                                isRemoving ||
                                clearing
                              }
                              className="p-2 text-gray-600 transition hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label="Increase quantity"
                            >
                              <Plus size={15} />
                            </button>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => removeItem(item.id)}
                            disabled={
                              isRemoving ||
                              isUpdating ||
                              clearing
                            }
                            className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isRemoving ? (
                              <LoaderCircle
                                size={15}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={15} />
                            )}

                            {isRemoving ? "Removing..." : "Remove"}
                          </button>
                        </div>
                      </div>

                      {/* Item Total */}
                      <div className="flex flex-col items-start gap-1 sm:items-end">
                        <span className="text-xs text-gray-500">
                          Item Total
                        </span>

                        <strong className="text-gray-900">
                          {formatPrice(item.itemTotal)}
                        </strong>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* Order Summary */}
            <aside className="rounded-xl border border-gray-200 bg-white p-6 lg:sticky lg:top-6">
              <h2 className="mb-6 text-xl font-bold text-gray-900">
                Order Summary
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between gap-3 text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(cart.subtotal)}</span>
                </div>

                <div className="flex justify-between gap-3 text-green-600">
                  <span>Discount</span>
                  <span>
                    - {formatPrice(cart.discountTotal)}
                  </span>
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

              <p className="my-5 text-xs leading-5 text-gray-500">
                Shipping charges, if applicable, will be calculated during
                checkout.
              </p>

              <button
                onClick={() => navigate("/checkout")}
                className="w-full rounded-lg bg-blue-600 px-5 py-3.5 font-bold text-white transition hover:bg-blue-700"
              >
                Proceed to Checkout
              </button>

              <Link
                to="/my-orders"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-5 py-3 font-semibold text-gray-700 transition hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600"
              >
                <ClipboardList size={18} />
                View My Orders
              </Link>

              <Link
                to="/products"
                className="mt-4 flex justify-center text-sm font-semibold text-gray-600 transition hover:text-blue-600"
              >
                Continue Shopping
              </Link>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
};

export default Carts;
