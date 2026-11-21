
import { useEffect, useState } from "react";
import { RefreshCw, ShoppingBag } from "lucide-react";
import shopOrderService from "../../services/shopOrderService";

const statuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

const ShopOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const params = filter === "ALL" ? {} : { status: filter };
      const response = await shopOrderService.getMyShopOrders(params);
      setOrders(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load shop orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const updateStatus = async (orderId, status) => {
    try {
      setUpdatingId(orderId);
      setError("");
      setSuccess("");
      await shopOrderService.updateShopOrderStatus(orderId, status);
      setSuccess("Order status updated.");
      await fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update order status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString() : "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Shop Orders</h1>
        <p className="mt-1 text-sm text-gray-500">Manage orders containing your shop's products.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {["ALL", ...statuses].map((status) => (
          <button key={status} onClick={() => setFilter(status)} className={`rounded-lg px-3 py-2 text-sm ${filter === status ? "bg-indigo-600 text-white" : "border bg-white text-gray-600 hover:bg-gray-50"}`}>
            {status === "ALL" ? "All Orders" : status.replaceAll("_", " ")}
          </button>
        ))}
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {success && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</p>}

      {loading ? (
        <div className="flex justify-center py-16 text-gray-500"><RefreshCw className="mr-2 animate-spin" /> Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white px-6 py-16 text-center">
          <ShoppingBag className="mx-auto mb-3 text-gray-400" size={36} />
          <h2 className="font-semibold text-gray-800">No orders found</h2>
          <p className="mt-2 text-sm text-gray-500">Orders containing your products will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-3 sm:flex-row">
                <div>
                  <h2 className="font-semibold text-gray-900">Shop Order #{order.id}</h2>
                  <p className="mt-1 text-sm text-gray-500">Customer Order #{order.orderId} · {formatDate(order.createdAt)}</p>
                  <p className="mt-1 text-sm text-gray-600">Customer: {order.order?.shippingName || order.order?.user?.name || "Customer"}</p>
                </div>
                <div className="sm:text-right">
                  <p className="font-semibold text-gray-900">{Number(order.subtotal || 0).toLocaleString()} ETB</p>
                  <p className="mt-1 text-xs text-gray-500">{order.status?.replaceAll("_", " ")}</p>
                </div>
              </div>

              <div className="mt-4 divide-y rounded-lg border">
                {(order.items || []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-800">{item.product?.name || "Product"}</p>
                      <p className="text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-medium">{(Number(item.price) * item.quantity).toLocaleString()} ETB</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-gray-500">Update fulfillment status</span>
                <select disabled={updatingId === order.id} value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
                  {statuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopOrders;
