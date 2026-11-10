
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle,
  Package,
  MapPin,
  CreditCard,
  LoaderCircle,
  ShoppingBag,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import orderService from "../../services/orderService";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

const PLACEHOLDER_IMAGE =
  "https://placehold.co/300x300?text=No+Image";

const getImageUrl = (image) => {
  if (!image) return PLACEHOLDER_IMAGE;
  if (/^https?:\/\//i.test(image)) return image;

  return `${API_BASE_URL}/${image.replace(/^\/+/, "")}`;
};

const formatPrice = (price) =>
  `${Number(price || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ETB`;

const OrderConfirmation = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", {
        replace: true,
        state: { from: location.pathname },
      });
      return;
    }

    if (order && String(order.id) === String(id)) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await orderService.getOrderById(id);
        setOrder(data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to retrieve order details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, isAuthenticated, navigate, location.pathname]);

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <LoaderCircle
          size={36}
          className="animate-spin text-blue-600"
        />
        <p className="text-gray-500">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <Package size={60} className="text-gray-300" />

        <h2 className="mt-5 text-2xl font-bold text-gray-900">
          Order not found
        </h2>

        <p className="mt-2 text-gray-500">
          {error || "We couldn't find this order."}
        </p>

        <Link
          to="/my-orders"
          className="mt-6 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
        >
          View My Orders
        </Link>
      </div>
    );
  }

  const items = order.items || [];

  const paymentMethodLabel =
    order.paymentMethod === "CASH_ON_DELIVERY"
      ? "Cash on Delivery"
      : order.paymentMethod === "CHAPA"
        ? "Chapa"
        : order.paymentMethod;

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">

        {/* Success Header */}
        <div className="mb-8 rounded-xl border border-green-200 bg-white p-8 text-center">
          <CheckCircle
            size={70}
            className="mx-auto text-green-500"
          />

          <h1 className="mt-5 text-3xl font-bold text-gray-900">
            Thank You for Your Order!
          </h1>

          <p className="mt-3 text-gray-600">
            Your order has been successfully placed.
          </p>

          <p className="mt-3 text-sm text-gray-500">
            Order Number:{" "}
            <strong className="text-gray-900">
              #{order.id}
            </strong>
          </p>

          <span className="mt-4 inline-block rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-800">
            {order.status || "PENDING"}
          </span>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

          {/* Delivery */}
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-5 flex items-center gap-3">
              <MapPin className="text-blue-600" size={22} />
              <h2 className="text-lg font-bold text-gray-900">
                Delivery Information
              </h2>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Full Name</p>
                <p className="font-semibold text-gray-900">
                  {order.shippingName}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-semibold text-gray-900">
                  {order.shippingPhone}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Address</p>
                <p className="font-semibold text-gray-900">
                  {order.shippingAddress}
                </p>
              </div>

              <div>
                <p className="text-gray-500">City / Country</p>
                <p className="font-semibold text-gray-900">
                  {order.shippingCity}, {order.shippingCountry}
                </p>
              </div>
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-5 flex items-center gap-3">
              <CreditCard className="text-blue-600" size={22} />
              <h2 className="text-lg font-bold text-gray-900">
                Payment Information
              </h2>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500">Payment Method</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {paymentMethodLabel}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Payment Status</p>
                <span className="mt-1 inline-block rounded-full bg-yellow-100 px-3 py-1 font-semibold text-yellow-800">
                  {order.paymentStatus || "PENDING"}
                </span>
              </div>

              <div>
                <p className="text-gray-500">Order Total</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {formatPrice(order.totalPrice)}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Ordered Products */}
        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-5 flex items-center gap-3">
            <ShoppingBag className="text-blue-600" size={22} />
            <h2 className="text-lg font-bold text-gray-900">
              Ordered Products
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {items.map((item) => {
              const product = item.product || {};

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 py-4"
                >
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
                    <p className="font-semibold text-gray-900">
                      {product.name || "Product"}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Quantity: {item.quantity}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {formatPrice(
                        Number(item.price) * Number(item.quantity)
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatPrice(item.price)} each
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex justify-between border-t border-gray-200 pt-5">
            <span className="font-bold text-gray-900">
              Total
            </span>

            <strong className="text-xl text-gray-900">
              {formatPrice(order.totalPrice)}
            </strong>
          </div>
        </section>

        {/* Actions */}
        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            to="/my-orders"
            className="rounded-lg bg-blue-600 px-7 py-3 text-center font-bold text-white transition hover:bg-blue-700"
          >
            View My Orders
          </Link>

          <Link
            to="/products"
            className="rounded-lg border border-gray-300 bg-white px-7 py-3 text-center font-bold text-gray-700 transition hover:bg-gray-100"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
};

export default OrderConfirmation;
