
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FolderPlus,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  Search,
  Package,
  Tags,
  AlertCircle,
  CheckCircle2,
  Plus,
} from "lucide-react";

import productCategoryService from "../../services/productCategoryService";

const emptyForm = {
  name: "",
  description: "",
};

// ==========================================
// NORMALIZE API RESPONSE
// ==========================================

const extractCategories = (response) => {
  const payload = response?.data;

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.categories)) {
    return payload.categories;
  }

  throw new Error("Invalid product categories response.");
};

// ==========================================
// GET PRODUCT COUNT
// ==========================================

const getProductCount = (category) => {
  return (
    category._count?.products ??
    category.products?.length ??
    0
  );
};

// ==========================================
// COMPONENT
// ==========================================

const ShopCategories = () => {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // FETCH MY PRODUCT CATEGORIES
  // ==========================================

  const fetchCategories = useCallback(
    async ({ showLoading = true } = {}) => {
      try {
        if (showLoading) {
          setLoading(true);
        }

        setError("");

        const response =
          await productCategoryService.getMyProductCategories();

        const categoryList = extractCategories(response);

        setCategories(categoryList);

        return true;
      } catch (err) {
        console.error("Fetch Product Categories Error:", err);

        setError(
          err.response?.data?.message ||
            "Could not load product categories. Please try again."
        );

        return false;
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ==========================================
  // FILTER CATEGORIES
  // ==========================================

  const filteredCategories = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return categories;
    }

    return categories.filter((category) => {
      const name = category.name?.toLowerCase() || "";
      const description =
        category.description?.toLowerCase() || "";

      return (
        name.includes(keyword) ||
        description.includes(keyword)
      );
    });
  }, [categories, search]);

  // ==========================================
  // CATEGORY STATISTICS
  // ==========================================

  const totalProducts = useMemo(() => {
    return categories.reduce(
      (total, category) =>
        total + getProductCount(category),
      0
    );
  }, [categories]);

  // ==========================================
  // OPEN CREATE FORM
  // ==========================================

  const openCreateForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  // ==========================================
  // OPEN EDIT FORM
  // ==========================================

  const openEditForm = (category) => {
    setForm({
      name: category.name || "",
      description: category.description || "",
    });

    setEditingId(category.id);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  // ==========================================
  // CLOSE FORM
  // ==========================================

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  };

  // ==========================================
  // CREATE / UPDATE CATEGORY
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    const name = form.name.trim();
    const description = form.description.trim();

    if (name.length < 2) {
      setError("Category name must be at least 2 characters.");
      return;
    }

    if (name.length > 40) {
      setError("Category name cannot exceed 40 characters.");
      return;
    }

    if (description.length > 200) {
      setError("Description cannot exceed 200 characters.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        name,
        description: description || null,
      };

      if (editingId !== null) {
        await productCategoryService.updateProductCategory(
          editingId,
          payload
        );

        setSuccess(
          "Product category updated successfully."
        );
      } else {
        await productCategoryService.createProductCategory(
          payload
        );

        setSuccess(
          "Product category created successfully."
        );
      }

      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);

      // Refresh without displaying the initial loading screen.
      const refreshed = await fetchCategories({
        showLoading: false,
      });

      if (!refreshed) {
        setError(
          "Your changes were saved, but the category list could not be refreshed."
        );
      }
    } catch (err) {
      console.error("Save Product Category Error:", err);

      setError(
        err.response?.data?.message ||
          "Could not save product category. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // OPEN DELETE CONFIRMATION
  // ==========================================

  const openDeleteConfirmation = (category) => {
    setDeleteTarget(category);
    setError("");
    setSuccess("");
  };

  // ==========================================
  // CLOSE DELETE CONFIRMATION
  // ==========================================

  const closeDeleteConfirmation = () => {
    if (deleting) {
      return;
    }

    setDeleteTarget(null);
    setError("");
  };

  // ==========================================
  // DELETE CATEGORY
  // ==========================================

  const handleDelete = async () => {
    if (!deleteTarget || deleting) {
      return;
    }

    // Do not allow deletion when products are assigned.
    if (getProductCount(deleteTarget) > 0) {
      setError(
        "This category contains products. Reassign those products before deleting the category."
      );
      return;
    }

    try {
      setDeleting(true);
      setError("");
      setSuccess("");

      await productCategoryService.deleteProductCategory(
        deleteTarget.id
      );

      setDeleteTarget(null);

      setSuccess(
        "Product category deleted successfully."
      );

      const refreshed = await fetchCategories({
        showLoading: false,
      });

      if (!refreshed) {
        setError(
          "The category was deleted, but the category list could not be refreshed."
        );
      }
    } catch (err) {
      console.error("Delete Product Category Error:", err);

      setError(
        err.response?.data?.message ||
          "Could not delete product category. Please try again."
      );
    } finally {
      setDeleting(false);
    }
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
            Product Categories
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Organize your shop products into categories.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-700"
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      {/* SUCCESS MESSAGE */}

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* ERROR MESSAGE */}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
          />
          <span>{error}</span>
        </div>
      )}

      {/* STATISTICS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        <div className="flex items-center gap-4 rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Tags size={23} />
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Total Categories
            </p>

            <p className="text-2xl font-bold text-gray-900">
              {categories.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Package size={23} />
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Products Assigned
            </p>

            <p className="text-2xl font-bold text-gray-900">
              {totalProducts}
            </p>
          </div>
        </div>

      </div>

      {/* CREATE / EDIT FORM */}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                {editingId !== null
                  ? "Edit Product Category"
                  : "Create Product Category"}
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                This category will belong to your shop.
              </p>
            </div>

            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 disabled:opacity-50"
              aria-label="Close form"
            >
              <X size={20} />
            </button>
          </div>

          {/* CATEGORY NAME */}

          <div>
            <label
              htmlFor="categoryName"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Category Name
            </label>

            <input
              id="categoryName"
              type="text"
              value={form.name}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  name: event.target.value,
                }))
              }
              minLength={2}
              maxLength={40}
              required
              placeholder="e.g. Men's Clothing"
              disabled={saving}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
            />

            <p className="mt-1 text-xs text-gray-400">
              {form.name.length}/40 characters (minimum 2).
            </p>
          </div>

          {/* DESCRIPTION */}

          <div>
            <label
              htmlFor="categoryDescription"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Description
            </label>

            <textarea
              id="categoryDescription"
              value={form.description}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  description: event.target.value,
                }))
              }
              maxLength={200}
              rows={3}
              placeholder="Describe this product category..."
              disabled={saving}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
            />

            <p className="mt-1 text-xs text-gray-400">
              {form.description.length}/200 characters.
            </p>
          </div>

          {/* FORM ACTIONS */}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving && (
                <RefreshCw
                  size={16}
                  className="animate-spin"
                />
              )}

              {saving
                ? "Saving..."
                : editingId !== null
                  ? "Update Category"
                  : "Create Category"}
            </button>

            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* CATEGORY LIST HEADER */}

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Your Categories
          </h2>

          <p className="text-sm text-gray-500">
            Manage the categories used by your products.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchCategories()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* SEARCH */}

      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search categories by name or description..."
          className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* LOADING */}

      {loading ? (
        <div className="flex justify-center rounded-xl border bg-white py-16 text-gray-500">
          <RefreshCw
            className="mr-2 animate-spin"
            size={20}
          />
          Loading product categories...
        </div>
      ) : categories.length === 0 ? (

        /* EMPTY STATE */

        <div className="rounded-xl border border-dashed bg-white px-6 py-16 text-center">
          <FolderPlus
            className="mx-auto mb-3 text-gray-400"
            size={40}
          />

          <h2 className="font-semibold text-gray-800">
            No product categories yet
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Create your first category to organize your shop products.
          </p>

          <button
            type="button"
            onClick={openCreateForm}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus size={17} />
            Create First Category
          </button>
        </div>

      ) : filteredCategories.length === 0 ? (

        /* NO SEARCH RESULTS */

        <div className="rounded-xl border bg-white px-6 py-12 text-center">
          <Search
            className="mx-auto mb-3 text-gray-400"
            size={32}
          />

          <h2 className="font-semibold text-gray-800">
            No matching categories
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Try another search term.
          </p>
        </div>

      ) : (

        /* CATEGORY LIST */

        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">

          <div className="hidden grid-cols-12 gap-4 border-b bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 md:grid">
            <div className="col-span-5">
              Category
            </div>

            <div className="col-span-3">
              Products
            </div>

            <div className="col-span-2">
              Created
            </div>

            <div className="col-span-2 text-right">
              Actions
            </div>
          </div>

          {filteredCategories.map((category) => {
            const productCount = getProductCount(category);

            return (
              <div
                key={category.id}
                className="grid grid-cols-1 gap-3 border-b p-4 last:border-0 md:grid-cols-12 md:items-center md:gap-4 md:px-5"
              >
                {/* CATEGORY DETAILS */}

                <div className="min-w-0 md:col-span-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Tags size={19} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-gray-800">
                        {category.name}
                      </h3>

                      <p className="mt-1 truncate text-sm text-gray-500">
                        {category.description || "No description"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* PRODUCT COUNT */}

                <div className="flex items-center justify-between text-sm md:col-span-3 md:block">
                  <span className="text-gray-500 md:hidden">
                    Assigned products
                  </span>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
                    <Package size={14} />
                    {productCount} products
                  </span>
                </div>

                {/* CREATED DATE */}

                <div className="text-sm text-gray-500 md:col-span-2">
                  <span className="md:hidden">
                    Created:{" "}
                  </span>

                  {category.createdAt
                    ? new Date(
                        category.createdAt
                      ).toLocaleDateString()
                    : "—"}
                </div>

                {/* ACTIONS */}

                <div className="flex justify-end gap-2 md:col-span-2">
                  <button
                    type="button"
                    onClick={() => openEditForm(category)}
                    title="Edit category"
                    aria-label={`Edit ${category.name}`}
                    className="rounded-lg p-2 text-gray-500 transition hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openDeleteConfirmation(category)
                    }
                    title={
                      productCount > 0
                        ? "Reassign products before deleting"
                        : "Delete category"
                    }
                    aria-label={`Delete ${category.name}`}
                    disabled={productCount > 0}
                    className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="deleteCategoryTitle"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">

            <div className="mb-4 flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Trash2 size={21} />
              </div>

              <button
                type="button"
                onClick={closeDeleteConfirmation}
                disabled={deleting}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                aria-label="Close confirmation"
              >
                <X size={20} />
              </button>
            </div>

            <h2
              id="deleteCategoryTitle"
              className="text-lg font-bold text-gray-900"
            >
              Delete Product Category?
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete{" "}
              <strong>{deleteTarget.name}</strong>?
            </p>

            {getProductCount(deleteTarget) > 0 && (
              <div className="mt-4 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <p>
                  This category has assigned products. You must
                  reassign those products to another category
                  before deleting it.
                </p>
              </div>
            )}

            <p className="mt-3 text-xs text-gray-500">
              This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteConfirmation}
                disabled={deleting}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={
                  deleting ||
                  getProductCount(deleteTarget) > 0
                }
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting && (
                  <RefreshCw
                    size={15}
                    className="animate-spin"
                  />
                )}

                {deleting
                  ? "Deleting..."
                  : "Delete Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopCategories;
