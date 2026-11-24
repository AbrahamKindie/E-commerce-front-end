
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Package,
  Boxes,
  ShoppingBag,
  TrendingUp,
  Save,
  X,
  Loader2,
  AlertCircle,
  CalendarDays,
  CheckCircle,
} from "lucide-react";

import productCategoryService from "../../services/productCategoryService";

const getResponseData = (response) => {
  let result = response?.data ?? response;

  if (result?.data !== undefined) {
    result = result.data;
  }

  return result;
};

const formatETB = (value) => {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
};

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-ET", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getProductImage = (product) => {
  if (!Array.isArray(product?.images) || !product.images.length) {
    return null;
  }

  return product.images[0];
};

const getProductStock = (product) => ({
  available: Number(product?.stockInfo?.available ?? product?.stock ?? 0),
  ordered: Number(product?.stockInfo?.ordered ?? 0),
  sold: Number(product?.stockInfo?.sold ?? 0),
});

const StatCard = ({ title, value, description, icon: Icon }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">
          {Number(value || 0).toLocaleString()}
        </p>
        <p className="mt-1 text-xs text-gray-500">{description}</p>
      </div>

      <div className="rounded-xl bg-indigo-50 p-3">
        <Icon className="h-6 w-6 text-indigo-600" />
      </div>
    </div>
  </div>
);

const ShopCategoryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const fetchCategory = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await productCategoryService.getMyProductCategoryById(id);

      const data = getResponseData(response);

      if (!data || !data.id) {
        throw new Error("Category not found.");
      }

      setCategory(data);

      setFormData({
        name: data.name ?? "",
        description: data.description ?? "",
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load product category."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCategory();
  }, [fetchCategory]);

  const products = category?.products ?? [];

  const stockSummary = useMemo(() => {
    return products.reduce(
      (summary, product) => {
        const stock = getProductStock(product);

        summary.available += stock.available;
        summary.ordered += stock.ordered;
        summary.sold += stock.sold;

        return summary;
      },
      {
        available: 0,
        ordered: 0,
        sold: 0,
      }
    );
  }, [products]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      setError("Category name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response =
        await productCategoryService.updateProductCategory(id, {
          name: formData.name.trim(),
          description: formData.description.trim(),
        });

      const updatedCategory = getResponseData(response);

      setCategory((previous) => ({
        ...previous,
        ...updatedCategory,
      }));

      setFormData({
        name: updatedCategory.name ?? formData.name.trim(),
        description:
          updatedCategory.description ?? formData.description.trim(),
      });

      setIsEditing(false);
      setSuccess("Product category updated successfully.");

      await fetchCategory();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update product category."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      name: category?.name ?? "",
      description: category?.description ?? "",
    });

    setIsEditing(false);
    setError("");
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-3 text-sm text-gray-500">
          Loading category details...
        </span>
      </div>
    );
  }

  if (error && !category) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Link
          to="/shop/categories"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Categories
        </Link>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <AlertCircle className="mb-3 h-7 w-7 text-red-600" />

          <h2 className="font-semibold text-red-800">
            Unable to load category
          </h2>

          <p className="mt-1 text-sm text-red-700">{error}</p>

          <button
            onClick={fetchCategory}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!category) return null;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Breadcrumb */}
      <div>
        <Link
          to="/shop/categories"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Product Categories
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-indigo-600" />

            <h1 className="text-2xl font-bold text-gray-900">
              Category Details
            </h1>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            View category information, assigned products, and stock details.
          </p>
        </div>

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Edit className="h-4 w-4" />
            Edit Category
          </button>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4" />
          {success}
        </div>
      )}

      {/* Category Information */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Category Information
          </h2>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Category Name
              </label>

              <input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                maxLength={100}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                placeholder="Enter category name"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Description
              </label>

              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                maxLength={1000}
                className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                placeholder="Describe this category..."
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}

                {saving ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Category Name
              </p>

              <p className="mt-1 text-base font-semibold text-gray-900">
                {category.name}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Created Date
              </p>

              <p className="mt-1 flex items-center gap-2 text-sm text-gray-700">
                <CalendarDays className="h-4 w-4 text-gray-400" />
                {formatDate(category.createdAt)}
              </p>
            </div>

            <div className="md:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Description
              </p>

              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {category.description || "No description provided."}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Stock Overview - Assigned Products Card Removed */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Category Stock Overview
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            title="Available Stock"
            value={stockSummary.available}
            description="Current available quantity"
            icon={Boxes}
          />

          <StatCard
            title="Ordered Stock"
            value={stockSummary.ordered}
            description="Pending, confirmed, and shipped"
            icon={ShoppingBag}
          />

          <StatCard
            title="Sold Stock"
            value={stockSummary.sold}
            description="Delivered order quantities"
            icon={TrendingUp}
          />
        </div>
      </section>

      {/* Assigned Products */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-2 border-b border-gray-200 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Assigned Products
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Products assigned to {category.name}.
            </p>
          </div>

          {/* Total assigned product count */}
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
            {products.length.toLocaleString()} Assigned Products
          </span>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <Package className="h-12 w-12 text-gray-300" />

            <h3 className="mt-3 font-semibold text-gray-800">
              No products assigned
            </h3>

            <p className="mt-1 max-w-md text-sm text-gray-500">
              There are currently no products in this category. Assign a
              product to this category when creating or editing a product.
            </p>

            <button
              onClick={() => navigate("/shop/products/create")}
              className="mt-5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Add Product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Product
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Price
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Available Stock
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Ordered Stock
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Sold Stock
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {products.map((product) => {
                  const stock = getProductStock(product);
                  const image = getProductImage(product);

                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {image ? (
                            <img
                              src={image}
                              alt={product.name}
                              className="h-12 w-12 rounded-lg border border-gray-200 object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                              <Package className="h-5 w-5 text-gray-400" />
                            </div>
                          )}

                          <div>
                            <p className="font-medium text-gray-900">
                              {product.name}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              Product ID: {product.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-gray-700">
                        {formatETB(
                          product.discountedPrice ?? product.price
                        )}
                      </td>

                      <td className="px-5 py-4 text-center text-sm font-semibold text-gray-900">
                        {stock.available.toLocaleString()}
                      </td>

                      <td className="px-5 py-4 text-center text-sm font-semibold text-amber-700">
                        {stock.ordered.toLocaleString()}
                      </td>

                      <td className="px-5 py-4 text-center text-sm font-semibold text-green-700">
                        {stock.sold.toLocaleString()}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            product.status === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {product.status === "ACTIVE"
                            ? "Active"
                            : product.status === "ADMIN_DEACTIVATED"
                              ? "Admin Deactivated"
                              : product.status || "Unknown"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-5 py-4 text-sm font-bold text-gray-900">
                    Total
                  </td>

                  <td className="px-5 py-4" />

                  <td className="px-5 py-4 text-center text-sm font-bold text-gray-900">
                    {stockSummary.available.toLocaleString()}
                  </td>

                  <td className="px-5 py-4 text-center text-sm font-bold text-amber-700">
                    {stockSummary.ordered.toLocaleString()}
                  </td>

                  <td className="px-5 py-4 text-center text-sm font-bold text-green-700">
                    {stockSummary.sold.toLocaleString()}
                  </td>

                  <td className="px-5 py-4" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default ShopCategoryDetails;
