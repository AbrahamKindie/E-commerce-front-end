
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  Package,
  Tag,
  Sparkles,
  Clock,
  LoaderCircle,
  Store,
} from "lucide-react";

import notificationService from "../../services/notificationService";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

const getProductImage = (images) => {
  if (!images) return null;

  let image = images;

  if (Array.isArray(images)) {
    image = images[0];
  }

  if (typeof image === "object" && image !== null) {
    image = image.url || image.path || image.image;
  }

  if (typeof image !== "string" || !image) return null;

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return `${API_BASE_URL}/${image.replace(/^\/+/, "")}`;
};

const getNotificationIcon = (type) => {
  switch (type) {
    case "FEATURED_PRODUCT":
      return <Sparkles size={16} className="text-purple-600" />;

    case "NEW_DISCOUNT":
      return <Tag size={16} className="text-green-600" />;

    case "DISCOUNT_ENDING_SOON":
      return <Clock size={16} className="text-orange-600" />;

    case "NEW_ARRIVAL":
      return <Package size={16} className="text-blue-600" />;

    case "SHOP_APPLICATION_REJECTED":
      return <Store size={16} className="text-red-600" />;

    default:
      return <Bell size={16} className="text-blue-600" />;
  }
};

const formatDate = (date) => {
  if (!date) return "";

  const notificationDate = new Date(date);

  if (Number.isNaN(notificationDate.getTime())) return "";

  return notificationDate.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const NotificationDropdown = () => {
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchNotifications = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);

      const response = await notificationService.getNotifications(1, 8);

      setNotifications(response.data || []);
      setUnreadCount(response.unreadCount || 0);
      setError("");
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and automatic refresh every 30 seconds.
  useEffect(() => {
    fetchNotifications(true);

    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);

    if (nextState) {
      fetchNotifications(true);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );

      setUnreadCount((previous) => Math.max(0, previous - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      setActionLoading(true);

      await notificationService.markAllAsRead();

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );

      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      setActionLoading(true);

      await notificationService.deleteNotification(notificationId);

      const deletedNotification = notifications.find(
        (notification) => notification.id === notificationId
      );

      setNotifications((previous) =>
        previous.filter(
          (notification) => notification.id !== notificationId
        )
      );

      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount((previous) => Math.max(0, previous - 1));
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }

    setIsOpen(false);

    const destination =
      notification.link ||
      (notification.productId
        ? `/products/${notification.productId}`
        : "/");

    navigate(destination);
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        type="button"
        onClick={handleToggle}
        className="relative flex items-center justify-center p-2 text-gray-700 hover:text-blue-600 transition"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell size={23} />

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 top-14 z-50 w-[min(360px,calc(100vw-24px))] sm:w-96 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">
                  Notifications
                </h3>

                <p className="text-xs text-gray-500 mt-1">
                  {unreadCount} unread notification
                  {unreadCount !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    disabled={actionLoading}
                    className="text-blue-600 hover:text-blue-800 text-xs font-semibold disabled:opacity-50"
                  >
                    Mark all read
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-700"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-[420px] overflow-y-auto">
              {loading ? (
                <div className="py-12 flex flex-col items-center gap-3 text-gray-500">
                  <LoaderCircle size={25} className="animate-spin" />
                  <p className="text-sm">Loading notifications...</p>
                </div>
              ) : error ? (
                <div className="py-10 px-4 text-center">
                  <p className="text-sm text-red-500">{error}</p>

                  <button
                    type="button"
                    onClick={() => fetchNotifications(true)}
                    className="mt-3 text-sm text-blue-600 font-semibold"
                  >
                    Try again
                  </button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-12 flex flex-col items-center text-center px-4">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Bell size={25} className="text-gray-400" />
                  </div>

                  <p className="font-semibold text-gray-800">
                    No notifications yet
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    We'll let you know about featured products, special
                    discounts, and shop application updates.
                  </p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const productImage = getProductImage(
                    notification.product?.images
                  );

                  const isShopNotification =
                    notification.type === "SHOP_APPLICATION_REJECTED";

                  return (
                    <div
                      key={notification.id}
                      className={`group flex gap-3 px-4 py-4 border-b border-gray-100 transition ${
                        notification.isRead
                          ? "bg-white"
                          : "bg-blue-50/70"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleNotificationClick(notification)
                        }
                        className="flex flex-1 min-w-0 gap-3 text-left"
                      >
                        <div className="relative shrink-0">
                          {productImage && !isShopNotification ? (
                            <img
                              src={productImage}
                              alt={notification.product?.name || "Product"}
                              className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div
                              className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                isShopNotification
                                  ? "bg-red-50"
                                  : "bg-gray-100"
                              }`}
                            >
                              {isShopNotification ? (
                                <Store
                                  size={22}
                                  className="text-red-500"
                                />
                              ) : (
                                <Package
                                  size={22}
                                  className="text-gray-400"
                                />
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {getNotificationIcon(notification.type)}

                            <p className="font-semibold text-sm text-gray-900 truncate">
                              {notification.title}
                            </p>

                            {!notification.isRead && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                            )}
                          </div>

                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>

                          <p className="text-[11px] text-gray-400 mt-2">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(notification.id)}
                        disabled={actionLoading}
                        className="self-center p-2 text-gray-400 hover:text-red-600 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition disabled:opacity-50"
                        title="Delete notification"
                        aria-label="Delete notification"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate("/notifications");
                }}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
              >
                <CheckCheck size={17} />
                View all notifications
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationDropdown;
