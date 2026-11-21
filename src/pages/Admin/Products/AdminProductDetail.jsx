
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  Store,
  Tag,
  Star,
  ShoppingBag,
  MessageSquare,
  RefreshCw,
  Lock,
  Power,
  Image as ImageIcon,
} from "lucide-react";

import { useAuth } from "../../../context/AuthContext";
import productService from "../../../services/productService";
import getImageUrl from "../../../utils/imageUrl";

// ==========================================
// CONSTANTS
// ==========================================

const productStatusStyles = {
  ACTIVE: "bg-green-100 text-green-700",
  ADMIN_DEACTIVATED: "bg-red-100 text-red-700",
};

const shopStatusStyles = {
  APPROVED: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  REJECTED: "bg-red-100 text-red-700",
  SUSPENDED: "bg-gray-200 text-gray-700",
};

const formatPrice = (price) => {
  const amount = Number(price);

  return `ETB ${
    Number.isFinite(amount)
      ? amount.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "0.00"
  }`;
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleString();
};

// ==========================================
// INFO ITEM
// ==========================================

const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
      {label}
    </p>

    <p className="mt-1 break-words text-sm font-medium text-gray-800">
      {value ?? "—"}
    </p>
  </div>
);

// ==========================================
// ADMIN PRODUCT DETAILS
// ==========================================

const AdminProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const permissions = user?.adminPermissions || [];

  // ==========================================
  // PRODUCT PERMISSIONS
  // ==========================================

  const canViewProducts =
    isSuperAdmin || permissions.includes("VIEW_PRODUCTS");

  const canActivateProducts =
    isSuperAdmin || permissions.includes("ACTIVATE_PRODUCTS");

  const canDeactivateProducts =
    isSuperAdmin || permissions.includes("DEACTIVATE_PRODUCTS");

  // Feature management is Super Admin only.
  const canManageFeaturedProducts = isSuperAdmin;

  // ==========================================
  // STATE
  // ==========================================

  const [product, setProduct] = useState(null);

  const [loading, setLoading] = useState(canViewProducts);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [actionLoading, setActionLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // ==========================================
  // FETCH PRODUCT
  // ==========================================

  const fetchProduct = useCallback(async () => {
    if (!canViewProducts) {
      setLoading(false);
      setProduct(null);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response =
        await productService.getAdminProductById(id);

      setProduct(response?.data || null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load product details."
      );

      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [id, canViewProducts]);

  useEffect(() => {
    if (!canViewProducts) {
      setLoading(false);
      setProduct(null);
      return;
    }

    fetchProduct();
  }, [canViewProducts, fetchProduct, refreshKey]);

  // ==========================================
  // REFRESH
  // ==========================================

  const refreshProduct = () => {
    if (!canViewProducts) return;

    setRefreshKey((current) => current + 1);
  };

  // ==========================================
  // PRODUCT STATUS PERMISSION
  // ==========================================

  const canChangeProductStatus = (currentProduct) => {
    if (!currentProduct) return false;

    if (currentProduct.status === "ACTIVE") {
      return canDeactivateProducts;
    }

    if (currentProduct.status === "ADMIN_DEACTIVATED") {
      return canActivateProducts;
    }

    return false;
  };

  // ==========================================
  // ACTIVATE / DEACTIVATE PRODUCT
  // ==========================================

  const handleStatusChange = async () => {
    if (!product || !canChangeProductStatus(product)) return;

    const newStatus =
      product.status === "ACTIVE"
        ? "ADMIN_DEACTIVATED"
        : "ACTIVE";

    const confirmed = window.confirm(
      newStatus === "ADMIN_DEACTIVATED"
        ? `Deactivate "${product.name}"?`
        : `Activate "${product.name}"?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await productService.setProductStatus(
        product.id,
        newStatus
      );

      setSuccess(
        newStatus === "ACTIVE"
          ? "Product activated successfully."
          : "Product deactivated successfully."
      );

      refreshProduct();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to update product status."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // FEATURE / UNFEATURE PRODUCT
  // SUPER ADMIN ONLY
  // ==========================================

  const handleFeaturedChange = async () => {
    if (!canManageFeaturedProducts || !product) return;

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await productService.setProductFeatured(
        product.id,
        !product.isFeatured
      );

      setSuccess(
        product.isFeatured
          ? "Product removed from featured products."
          : "Product featured successfully."
      );

      refreshProduct();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to update featured status."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // ACCESS DENIED
  // ==========================================

  if (!canViewProducts) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
            <Lock size={30} />
          </div>

          <h2 className="mt-5 text-xl font-bold text-gray-900">
            Access Denied
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            You do not have permission to view marketplace
            product details. Please contact your Super Admin
            if you need access.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-gray-500">
        <RefreshCw size={20} className="animate-spin" />
        Loading product details...
      </div>
    );
  }

  // ==========================================
  // FETCH ERROR
  // ==========================================

  if (error && !product) {
    return (
      <div className="space-y-4">
        <Link
          to="/admin/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft size={17} />
          Back to Products
        </Link>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm text-red-700">{error}</p>

          <button
            type="button"
            onClick={refreshProduct}
            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-red-700"
          >
            <RefreshCw size={15} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!product) return null;

  // ==========================================
  // PRODUCT DATA
  // ==========================================

  const images = Array.isArray(product.images)
    ? product.images
    : [];

  const hasDiscount = Boolean(product.productDiscount);

  const availableStock =
    product.stockInfo?.available ?? product.stock ?? 0;

  const averageRating = Number(
    product.averageRating ??
      product.reviews?.averageRating ??
      0
  );

  const totalReviews =
    product.totalReviews ??
    product.reviews?.totalReviews ??
    0;

  const canChangeStatus = canChangeProductStatus(product);

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            to="/admin/products"
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            <ArrowLeft size={17} />
            Back to Products
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">
            Product Details
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View product information and manage its marketplace status.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">

          {/* ACTIVATE / DEACTIVATE */}

          {canChangeStatus && (
            <button
              type="button"
              onClick={handleStatusChange}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <Power size={16} />

              {product.status === "ACTIVE"
                ? "Deactivate"
                : "Activate"}
            </button>
          )}

          {/* FEATURE / UNFEATURE - SUPER ADMIN ONLY */}

          {canManageFeaturedProducts && (
            <button
              type="button"
              onClick={handleFeaturedChange}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-yellow-600 disabled:opacity-50"
            >
              <Star
                size={16}
                className={product.isFeatured ? "fill-white" : ""}
              />

              {product.isFeatured
                ? "Remove Featured"
                : "Feature Product"}
            </button>
          )}
        </div>
      </div>

      {/* MESSAGES */}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* PRODUCT OVERVIEW */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* PRODUCT IMAGES */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-1">
          <h2 className="mb-4 font-semibold text-gray-900">
            Product Images
          </h2>

          {images.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {images.map((image, index) => (
                <img
                  key={`${image}-${index}`}
                  src={getImageUrl(image)}
                  alt={`${product.name} ${index + 1}`}
                  className={`h-36 w-full rounded-lg border border-gray-200 object-cover ${
                    index === 0 && images.length % 2 !== 0
                      ? "col-span-2 h-56"
                      : ""
                  }`}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src =
                      "https://placehold.co/600x600?text=No+Image";
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-56 flex-col items-center justify-center rounded-lg bg-gray-50 text-gray-400">
              <ImageIcon size={40} />

              <p className="mt-2 text-sm">
                No product images
              </p>
            </div>
          )}
        </div>

        {/* MAIN PRODUCT INFORMATION */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Product #{product.id}
              </p>

              <h2 className="mt-2 text-xl font-bold text-gray-900">
                {product.name}
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                {product.productCategory?.name || "Uncategorized"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  productStatusStyles[product.status] ||
                  "bg-gray-100 text-gray-600"
                }`}
              >
                {product.status === "ADMIN_DEACTIVATED"
                  ? "Deactivated"
                  : product.status}
              </span>

              {product.isFeatured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                  <Star size={12} className="fill-yellow-500" />
                  Featured
                </span>
              )}
            </div>
          </div>

          <div className="my-5 border-t border-gray-100" />

          <h3 className="mb-2 text-sm font-semibold text-gray-800">
            Description
          </h3>

          <p className="whitespace-pre-line text-sm leading-7 text-gray-600">
            {product.description || "No description provided."}
          </p>

          <div className="my-5 border-t border-gray-100" />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <InfoItem
              label="Product ID"
              value={product.id}
            />

            <InfoItem
              label="Category"
              value={product.productCategory?.name || "—"}
            />

            <InfoItem
              label="Created"
              value={formatDate(product.createdAt)}
            />

            <InfoItem
              label="Last Updated"
              value={formatDate(product.updatedAt)}
            />
          </div>
        </div>
      </div>

      {/* PRICING AND INVENTORY */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* PRICING */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Tag size={19} className="text-indigo-600" />

            <h2 className="font-semibold text-gray-900">
              Pricing and Discount
            </h2>
          </div>

          <div className="space-y-4">
            <InfoItem
              label="Original Price"
              value={formatPrice(product.price)}
            />

            <InfoItem
              label="Current Selling Price"
              value={formatPrice(
                product.hasActiveDiscount
                  ? product.discountedPrice
                  : product.price
              )}
            />

            <InfoItem
              label="Discount Amount"
              value={
                product.hasActiveDiscount
                  ? formatPrice(product.discountAmount)
                  : "No active discount"
              }
            />

            <div className="border-t border-gray-100 pt-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-800">
                Discount Configuration
              </h3>

              {hasDiscount ? (
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem
                    label="Discount Type"
                    value={product.productDiscount.type}
                  />

                  <InfoItem
                    label="Discount Value"
                    value={
                      product.productDiscount.type === "PERCENTAGE"
                        ? `${product.productDiscount.value}%`
                        : formatPrice(product.productDiscount.value)
                    }
                  />

                  <InfoItem
                    label="Start Date"
                    value={formatDate(
                      product.productDiscount.startsAt
                    )}
                  />

                  <InfoItem
                    label="End Date"
                    value={formatDate(
                      product.productDiscount.endsAt
                    )}
                  />

                  <InfoItem
                    label="Discount Enabled"
                    value={
                      product.productDiscount.isActive
                        ? "Yes"
                        : "No"
                    }
                  />

                  <InfoItem
                    label="Currently Applied"
                    value={
                      product.hasActiveDiscount ? "Yes" : "No"
                    }
                  />
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No discount configuration for this product.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* INVENTORY */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Package size={19} className="text-indigo-600" />

            <h2 className="font-semibold text-gray-900">
              Inventory and Sales
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <InfoItem
              label="Available Stock"
              value={availableStock}
            />

            <InfoItem
              label="Total Ordered"
              value={product.stockInfo?.ordered ?? "—"}
            />

            <InfoItem
              label="Total Sold"
              value={product.stockInfo?.sold ?? "—"}
            />

            <InfoItem
              label="Stock Status"
              value={
                availableStock <= 0
                  ? "Out of Stock"
                  : availableStock <= 5
                    ? "Low Stock"
                    : "In Stock"
              }
            />
          </div>

          <div className="mt-6 rounded-lg bg-gray-50 p-4">
            <p className="text-xs text-gray-500">
              Inventory values are displayed from the product's
              current backend stock and order summaries.
            </p>
          </div>
        </div>
      </div>

      {/* SHOP INFORMATION */}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <Store size={19} className="text-indigo-600" />

          <h2 className="font-semibold text-gray-900">
            Shop Information
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem
            label="Shop Name"
            value={product.shop?.name || "—"}
          />

          <InfoItem
            label="Shop ID"
            value={product.shop?.id || "—"}
          />

          <InfoItem
            label="Shop Status"
            value={product.shop?.status || "—"}
          />

          <InfoItem
            label="Owner Name"
            value={product.shop?.owner?.name || "—"}
          />

          <InfoItem
            label="Owner Email"
            value={product.shop?.owner?.email || "—"}
          />
        </div>

        {product.shop?.status && (
          <div className="mt-5">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                shopStatusStyles[product.shop.status] ||
                "bg-gray-100 text-gray-600"
              }`}
            >
              {product.shop.status}
            </span>
          </div>
        )}
      </div>

      {/* PRODUCT PERFORMANCE */}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-5 font-semibold text-gray-900">
          Product Performance
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="rounded-xl bg-gray-50 p-5">
            <div className="flex items-center gap-2 text-gray-500">
              <ShoppingBag size={19} />

              <span className="text-sm">
                Units Ordered
              </span>
            </div>

            <p className="mt-3 text-2xl font-bold text-gray-900">
              {product.stockInfo?.ordered ?? "—"}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-5">
            <div className="flex items-center gap-2 text-gray-500">
              <Star size={19} />

              <span className="text-sm">
                Average Rating
              </span>
            </div>

            <p className="mt-3 text-2xl font-bold text-gray-900">
              {averageRating.toFixed(1)} / 5
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-5">
            <div className="flex items-center gap-2 text-gray-500">
              <MessageSquare size={19} />

              <span className="text-sm">
                Total Reviews
              </span>
            </div>

            <p className="mt-3 text-2xl font-bold text-gray-900">
              {totalReviews}
            </p>
          </div>
        </div>
      </div>

      {/* FOOTER NAVIGATION */}

      <div className="flex flex-wrap justify-between gap-3">
        <Link
          to="/admin/products"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
        >
          <ArrowLeft size={17} />
          Back to Products
        </Link>

        <button
          type="button"
          onClick={refreshProduct}
          disabled={loading || actionLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh Details
        </button>
      </div>
    </div>
  );
};

export default AdminProductDetails;
