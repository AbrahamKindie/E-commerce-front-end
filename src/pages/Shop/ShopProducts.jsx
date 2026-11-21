
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Trash2,
  RefreshCw,
  Package,
  Pencil,
  Eye,
  Tag,
} from "lucide-react";

import productService from "../../services/productService";

const ShopProducts = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(
    location.state?.success || ""
  );
  const [deletingId, setDeletingId] = useState(null);

  // ==========================================
  // FETCH SHOP OWNER PRODUCTS
  // ==========================================

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await productService.getMyShopProducts({
        search,
      });

      setProducts(response.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load your products."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  // ==========================================
  // DELETE PRODUCT
  // ==========================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError("");
      setSuccess("");

      await productService.deleteShopProduct(id);

      setProducts((prev) =>
        prev.filter((product) => product.id !== id)
      );

      setSuccess("Product deleted successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not delete product."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================
  // CLEAR SUCCESS MESSAGE
  // ==========================================

  useEffect(() => {
    if (location.state?.success) {
      navigate(location.pathname, {
        replace: true,
        state: null,
      });
    }
  }, [location.state, location.pathname, navigate]);

  // ==========================================
  // REFRESH PRODUCTS
  // ==========================================

  const handleRefresh = () => {
    fetchProducts();
  };

  // ==========================================
  // PRODUCT STATUS
  // ==========================================

  const getProductStatus = (product) => {
    if (product.status === "ADMIN_DEACTIVATED") {
      return {
        label: "Deactivated by Admin",
        className: "bg-red-50 text-red-700",
      };
    }

    if (product.status === "ACTIVE") {
      return {
        label: "Active",
        className: "bg-green-50 text-green-700",
      };
    }

    return {
      label: product.status || "Unknown",
      className: "bg-gray-100 text-gray-600",
    };
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            My Products
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage products listed in your shop.
          </p>
        </div>

        <Link
          to="/shop/products/create"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-700"
        >
          <Plus size={18} />
          Add Product
        </Link>

      </div>

      {/* SUCCESS MESSAGE */}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* ERROR MESSAGE */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* PRODUCT STATISTICS */}

      <div className="grid gap-4 sm:grid-cols-2">

        <div className="flex items-center gap-4 rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Package size={24} />
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Total Products
            </p>

            <p className="text-2xl font-bold text-gray-900">
              {products.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
            <Tag size={24} />
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Total Stock Units
            </p>

            <p className="text-2xl font-bold text-gray-900">
              {products.reduce(
                (total, product) =>
                  total + Number(product.stock || 0),
                0
              )}
            </p>
          </div>
        </div>

      </div>

      {/* SEARCH AND REFRESH */}

      <div className="flex flex-col gap-3 sm:flex-row">

        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search your products..."
            className="w-full rounded-lg border bg-white py-3 pl-10 pr-4 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>

      </div>

      {/* PRODUCT LIST */}

      {loading ? (
        <div className="flex justify-center rounded-xl border bg-white py-16 text-gray-500">
          <RefreshCw
            className="mr-2 animate-spin"
            size={20}
          />
          Loading products...
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white px-6 py-16 text-center">

          <Package
            className="mx-auto mb-3 text-gray-400"
            size={40}
          />

          <h2 className="font-semibold text-gray-800">
            {search
              ? "No matching products found"
              : "No products yet"}
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {search
              ? "Try searching with a different product name."
              : "Add your first product to start selling in your shop."}
          </p>

          {!search && (
            <Link
              to="/shop/products/create"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              <Plus size={17} />
              Add Your First Product
            </Link>
          )}

        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">

          <table className="w-full min-w-[1050px] text-left text-sm">

            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-4 font-semibold">Product</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold">Price</th>
                <th className="p-4 font-semibold">Stock</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 text-center font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {products.map((product) => {
                const status = getProductStatus(product);

                return (
                  <tr
                    key={product.id}
                    className="border-t transition hover:bg-gray-50"
                  >

                    {/* PRODUCT DETAILS */}

                    <td className="p-4">
                      <div className="flex items-center gap-3">

                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-12 w-12 rounded-lg border object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                            <Package size={21} />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">
                            {product.name}
                          </p>

                          <p className="max-w-xs truncate text-xs text-gray-500">
                            {product.description || "No description"}
                          </p>
                        </div>

                      </div>
                    </td>

                    {/* PRODUCT CATEGORY */}

                    <td className="p-4 text-gray-600">
                      {product.productCategory?.name || "—"}
                    </td>

                    {/* PRICE */}

                    <td className="p-4 font-medium text-gray-900">
                      {Number(product.price).toLocaleString()} ETB
                    </td>

                    {/* STOCK */}

                    <td className="p-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          Number(product.stock) > 0
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {product.stock} in stock
                      </span>
                    </td>

                    {/* PRODUCT STATUS */}

                    <td className="p-4">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>

                    {/* ACTIONS */}

                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">

                        <Link
                          to={`/shop/products/${product.id}/edit`}
                          title="Edit product"
                          className="rounded-lg p-2 text-indigo-600 transition hover:bg-indigo-50"
                        >
                          <Pencil size={17} />
                        </Link>

                        <Link
                          to={`/products/${product.id}`}
                          title="View product"
                          className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100"
                        >
                          <Eye size={17} />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDelete(product.id)}
                          disabled={deletingId === product.id}
                          title="Delete product"
                          className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingId === product.id ? (
                            <RefreshCw
                              size={17}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2 size={17} />
                          )}
                        </button>

                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>

          </table>
        </div>
      )}

    </div>
  );
};

export default ShopProducts;
