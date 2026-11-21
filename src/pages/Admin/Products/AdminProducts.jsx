
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Package,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Lock,
  Star,
  Trash2,
  Power,
  X,
  Image as ImageIcon,
} from "lucide-react";

import { useAuth } from "../../../context/AuthContext";
import productService from "../../../services/productService";
import getImageUrl from "../../../utils/imageUrl";

// ==========================================
// CONSTANTS
// ==========================================

const statusStyles = {
  ACTIVE: "bg-green-100 text-green-700",
  ADMIN_DEACTIVATED: "bg-red-100 text-red-700",
};

const shopStatusStyles = {
  ACTIVE: "bg-green-100 text-green-700",
  DEACTIVATED: "bg-red-100 text-red-700",
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

// ==========================================
// ADMIN PRODUCTS
// ==========================================

const AdminProducts = () => {
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

  // Super Admin only operations.
  const canManageFeaturedProducts = isSuperAdmin;
  const canDeleteProducts = isSuperAdmin;

  // Discount management is not available to any Admin.
  // ==========================================
  // STATE
  // ==========================================

  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const [loading, setLoading] = useState(canViewProducts);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);
  const [actionLoading, setActionLoading] = useState(null);

  // Delete confirmation
  const [deleteProduct, setDeleteProduct] = useState(null);

  const limit = 10;

  // ==========================================
  // FETCH PRODUCTS
  // ==========================================

  useEffect(() => {
    let isActive = true;

    if (!canViewProducts) {
      setLoading(false);
      setProducts([]);
      setPagination(null);
      return;
    }

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await productService.getAdminProducts({
          page,
          limit,
          ...(search.trim() && {
            search: search.trim(),
          }),
          ...(featuredFilter !== "" && {
            isFeatured: featuredFilter === "true",
          }),
          sortBy,
        });

        if (!isActive) return;

        const result = response?.data || {};

        setProducts(result.products || []);
        setPagination(result.pagination || null);
      } catch (err) {
        if (!isActive) return;

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load products. Please try again."
        );

        setProducts([]);
        setPagination(null);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    const timeout = setTimeout(fetchProducts, 300);

    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [
    page,
    search,
    featuredFilter,
    sortBy,
    refreshKey,
    canViewProducts,
  ]);

  // ==========================================
  // GENERAL HELPERS
  // ==========================================

  const refreshProducts = () => {
    setRefreshKey((current) => current + 1);
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setError("");
  };

  const handleActionError = (err, fallback) => {
    setError(
      err.response?.data?.message ||
        err.message ||
        fallback
    );

    setSuccess("");
  };

  const handleRetry = () => {
    if (!canViewProducts) return;

    refreshProducts();
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  // ==========================================
  // FILTERS AND SORTING
  // ==========================================

  const handleFeaturedFilterChange = (value) => {
    setFeaturedFilter(value);
    setPage(1);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setPage(1);
  };

  // ==========================================
  // PRODUCT STATUS
  // ==========================================

  const handleStatusChange = async (product) => {
    const canChangeStatus =
      product.status === "ACTIVE"
        ? canDeactivateProducts
        : product.status === "ADMIN_DEACTIVATED"
          ? canActivateProducts
          : false;

    if (!canChangeStatus) return;

    const newStatus =
      product.status === "ACTIVE"
        ? "ADMIN_DEACTIVATED"
        : "ACTIVE";

    try {
      clearMessages();

      setActionLoading(`status-${product.id}`);

      await productService.setProductStatus(
        product.id,
        newStatus
      );

      showSuccess(
        newStatus === "ACTIVE"
          ? "Product activated successfully."
          : "Product deactivated successfully."
      );

      refreshProducts();
    } catch (err) {
      handleActionError(
        err,
        "Unable to update product status."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ==========================================
  // FEATURE / UNFEATURE PRODUCT
  // SUPER ADMIN ONLY
  // ==========================================

  const handleFeaturedChange = async (product) => {
    if (!canManageFeaturedProducts) return;

    try {
      clearMessages();

      setActionLoading(`featured-${product.id}`);

      await productService.setProductFeatured(
        product.id,
        !product.isFeatured
      );

      showSuccess(
        product.isFeatured
          ? "Product removed from featured products."
          : "Product featured successfully."
      );

      refreshProducts();
    } catch (err) {
      handleActionError(
        err,
        "Unable to update featured status."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ==========================================
  // DELETE PRODUCT
  // SUPER ADMIN ONLY
  // ==========================================

  const handleDeleteProduct = async () => {
    if (!canDeleteProducts || !deleteProduct) return;

    try {
      clearMessages();

      setActionLoading(`delete-${deleteProduct.id}`);

      await productService.deleteProduct(
        deleteProduct.id
      );

      setDeleteProduct(null);

      showSuccess("Product deleted successfully.");

      if (products.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        refreshProducts();
      }
    } catch (err) {
      handleActionError(
        err,
        "Unable to delete product. Products with order or cart references may not be deleted."
      );
    } finally {
      setActionLoading(null);
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
            products. Please contact your Super Admin if you
            need access.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Product Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View and manage marketplace products.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Package size={19} />

          <span>
            {pagination?.total ?? 0} Total Products
          </span>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search
            size={19}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) =>
              handleSearchChange(e.target.value)
            }
            placeholder="Search products or shop names..."
            className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <select
          value={featuredFilter}
          onChange={(e) =>
            handleFeaturedFilterChange(e.target.value)
          }
          className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
        >
          <option value="">All Products</option>
          <option value="true">Featured Products</option>
          <option value="false">Not Featured</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) =>
            handleSortChange(e.target.value)
          }
          className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Name: A to Z</option>
          <option value="name_desc">Name: Z to A</option>
        </select>
      </div>

      {/* SUCCESS MESSAGE */}

      {success && (
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-700">
            {success}
          </p>

          <button
            type="button"
            onClick={() => setSuccess("")}
            className="text-green-700 hover:text-green-900"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* ERROR MESSAGE */}

      {error && (
        <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-red-700">{error}</p>

          <button
            type="button"
            onClick={handleRetry}
            disabled={loading}
            className="flex items-center gap-2 text-sm font-semibold text-red-700 hover:text-red-900 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />

            Retry
          </button>
        </div>
      )}

      {/* PRODUCTS TABLE */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px] text-left text-sm">

            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-4 font-semibold">
                  Product
                </th>

                <th className="px-5 py-4 font-semibold">
                  Shop
                </th>

                <th className="px-5 py-4 font-semibold">
                  Category
                </th>

                <th className="px-5 py-4 font-semibold">
                  Price
                </th>

                <th className="px-5 py-4 font-semibold">
                  Stock
                </th>

                <th className="px-5 py-4 font-semibold">
                  Status
                </th>

                <th className="px-5 py-4 font-semibold">
                  Featured
                </th>

                <th className="px-5 py-4 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">

              {loading ? (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <RefreshCw
                        size={18}
                        className="animate-spin"
                      />

                      Loading products...
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center">
                    <Package
                      size={35}
                      className="mx-auto mb-3 text-gray-300"
                    />

                    <p className="font-medium text-gray-700">
                      No products found
                    </p>

                    <p className="mt-1 text-gray-500">
                      Try changing your search or filters.
                    </p>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const image = getImageUrl(
                    product.images?.[0]
                  );

                  const isBusy =
                    actionLoading !== null &&
                    Number(
                      actionLoading.slice(
                        actionLoading.lastIndexOf("-") + 1
                      )
                    ) === Number(product.id);

                  const canChangeThisProductStatus =
                    product.status === "ACTIVE"
                      ? canDeactivateProducts
                      : product.status === "ADMIN_DEACTIVATED"
                        ? canActivateProducts
                        : false;

                  return (
                    <tr
                      key={product.id}
                      className="transition hover:bg-gray-50"
                    >

                      {/* PRODUCT */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {image ? (
                            <img
                              src={image}
                              alt={product.name}
                              className="h-12 w-12 rounded-lg border border-gray-200 object-cover"
                              onError={(event) => {
                                event.currentTarget.onerror = null;
                                event.currentTarget.src =
                                  "https://placehold.co/100x100?text=No+Image";
                              }}
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                              <ImageIcon size={22} />
                            </div>
                          )}

                          <div className="max-w-[200px]">
                            <p className="line-clamp-2 font-semibold text-gray-800">
                              {product.name}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              ID: {product.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* SHOP */}

                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-700">
                          {product.shop?.name || "Unknown Shop"}
                        </p>

                        <span
                          className={`mt-1 inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${
                            shopStatusStyles[
                              product.shop?.status
                            ] || "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {product.shop?.status || "Unknown"}
                        </span>
                      </td>

                      {/* CATEGORY */}

                      <td className="px-5 py-4 text-gray-600">
                        {product.productCategory?.name || "—"}
                      </td>

                      {/* PRICE */}

                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-800">
                          {formatPrice(product.price)}
                        </p>
                      </td>

                      {/* STOCK */}

                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-700">
                          {product.stockInfo?.available ??
                            product.stock ??
                            0}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          Available
                        </p>
                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            statusStyles[product.status] ||
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {product.status === "ADMIN_DEACTIVATED"
                            ? "Deactivated"
                            : product.status || "Unknown"}
                        </span>
                      </td>

                      {/* FEATURED */}

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                            product.isFeatured
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <Star
                            size={12}
                            className={
                              product.isFeatured
                                ? "fill-yellow-500"
                                : ""
                            }
                          />

                          {product.isFeatured
                            ? "Featured"
                            : "No"}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">

                          {/* VIEW PRODUCT */}

                          <Link
                            to={`/admin/products/${product.id}`}
                            title="View Details"
                            className="rounded-lg border border-indigo-200 p-2 text-indigo-600 transition hover:bg-indigo-50"
                          >
                            <Eye size={16} />
                          </Link>

                          {/* ACTIVATE / DEACTIVATE */}

                          {canChangeThisProductStatus && (
                            <button
                              type="button"
                              title={
                                product.status === "ACTIVE"
                                  ? "Deactivate Product"
                                  : "Activate Product"
                              }
                              disabled={isBusy}
                              onClick={() =>
                                handleStatusChange(product)
                              }
                              className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
                            >
                              <Power size={16} />
                            </button>
                          )}

                          {/* FEATURE / UNFEATURE - SUPER ADMIN ONLY */}

                          {canManageFeaturedProducts && (
                            <button
                              type="button"
                              title={
                                product.isFeatured
                                  ? "Remove Featured"
                                  : "Feature Product"
                              }
                              disabled={isBusy}
                              onClick={() =>
                                handleFeaturedChange(product)
                              }
                              className="rounded-lg border border-yellow-200 p-2 text-yellow-600 transition hover:bg-yellow-50 disabled:opacity-50"
                            >
                              <Star
                                size={16}
                                className={
                                  product.isFeatured
                                    ? "fill-yellow-500"
                                    : ""
                                }
                              />
                            </button>
                          )}

                          {/* DELETE - SUPER ADMIN ONLY */}

                          {canDeleteProducts && (
                            <button
                              type="button"
                              title="Delete Product"
                              disabled={isBusy}
                              onClick={() => {
                                clearMessages();
                                setDeleteProduct(product);
                              }}
                              className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}

            </tbody>
          </table>
        </div>

        {/* PAGINATION */}

        {!loading &&
          pagination &&
          pagination.total > 0 && (
            <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Showing page {pagination.page} of{" "}
                {pagination.totalPages} (
                {pagination.total} products)
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!pagination.hasPreviousPage}
                  onClick={() =>
                    setPage((current) => current - 1)
                  }
                  className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={17} />
                  Previous
                </button>

                <button
                  type="button"
                  disabled={!pagination.hasNextPage}
                  onClick={() =>
                    setPage((current) => current + 1)
                  }
                  className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          )}
      </div>

      {/* ====================================== */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* SUPER ADMIN ONLY */}
      {/* ====================================== */}

      {canDeleteProducts && deleteProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
              <Trash2 size={25} />
            </div>

            <h2 className="mt-4 text-center text-lg font-bold text-gray-900">
              Delete Product?
            </h2>

            <p className="mt-2 text-center text-sm leading-6 text-gray-500">
              Are you sure you want to permanently delete{" "}
              <strong>{deleteProduct.name}</strong>?
            </p>

            <p className="mt-3 rounded-lg bg-yellow-50 p-3 text-xs leading-5 text-yellow-800">
              Products with order history or cart references
              cannot be permanently deleted. You can deactivate
              those products instead.
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteProduct(null)}
                disabled={
                  actionLoading ===
                  `delete-${deleteProduct.id}`
                }
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={
                  actionLoading ===
                  `delete-${deleteProduct.id}`
                }
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ===
                `delete-${deleteProduct.id}`
                  ? "Deleting..."
                  : "Delete Product"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminProducts;
