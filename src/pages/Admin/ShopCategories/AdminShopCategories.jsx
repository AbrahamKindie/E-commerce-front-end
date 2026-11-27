
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Search,
  Tags,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle2,
  ImageIcon,
  Upload,
  Eye,
  Store,
  LoaderCircle,
  CalendarDays,
} from "lucide-react";

import { useAuth } from "../../../context/AuthContext";
import adminService from "../../../services/adminService";
import categoryService from "../../../services/categoryService";
import { API_BASE_URL } from "../../../services/api";

// ==========================================
// IMAGE HELPERS
// ==========================================

export const getCategoryImageUrl = (imagePath) => {
  if (!imagePath) return "";

  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath;
  }

  try {
    const apiOrigin = new URL(
      API_BASE_URL,
      window.location.origin
    ).origin;

    return `${apiOrigin}/${imagePath.replace(/^\/+/, "")}`;
  } catch (error) {
    console.error("Invalid category image URL:", error);
    return imagePath;
  }
};

// ==========================================
// DATE HELPER
// ==========================================

const formatCreatedDate = (category) => {
  const createdAt =
    category?.createdAt ??
    category?.created_at ??
    null;

  if (!createdAt) return "Date not provided by server";

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "Invalid creation date";
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ==========================================
// RESPONSE HELPERS
// ==========================================

const getCategoriesFromResponse = (response) => {
  const data =
    response?.categories ??
    response?.data?.categories ??
    response?.data?.data ??
    response?.data ??
    response;

  return Array.isArray(data) ? data : [];
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.message ||
  fallback;

// ==========================================
// MAIN COMPONENT
// ==========================================

export const AdminShopCategories = () => {
  const { user } = useAuth();

  // ==========================================
  // PERMISSIONS
  // ==========================================

  const isSuperAdmin =
    user?.role === "SUPER_ADMIN" ||
    user?.isSuperAdmin === true;

  const permissions = user?.adminPermissions || [];

  const hasPermission = (permission) =>
    isSuperAdmin || permissions.includes(permission);

  const canCreate = hasPermission("CREATE_CATEGORIES");
  const canUpdate = hasPermission("UPDATE_CATEGORIES");
  const canDelete = hasPermission("DELETE_CATEGORIES");

  // ==========================================
  // CATEGORY STATES
  // ==========================================

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // ==========================================
  // FORM STATES
  // ==========================================

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [existingImage, setExistingImage] = useState("");

  const imageInputRef = useRef(null);
  const imagePreviewRef = useRef("");

  const [saving, setSaving] = useState(false);

  // ==========================================
  // VIEW MODAL
  // ==========================================

  const [viewingCategory, setViewingCategory] = useState(null);

  // ==========================================
  // DELETE MODAL
  // ==========================================

  const [deletingCategory, setDeletingCategory] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ==========================================
  // FEEDBACK
  // ==========================================

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // ==========================================
  // IMAGE PREVIEW CLEANUP
  // ==========================================

  const updateImagePreview = useCallback((nextPreview) => {
    const previousPreview = imagePreviewRef.current;

    if (
      previousPreview?.startsWith("blob:") &&
      previousPreview !== nextPreview
    ) {
      URL.revokeObjectURL(previousPreview);
    }

    imagePreviewRef.current = nextPreview;
    setImagePreview(nextPreview);
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreviewRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewRef.current);
      }
    };
  }, []);

  // ==========================================
  // IMAGE ERROR HANDLER
  // ==========================================

  const handleImageError = (event) => {
    event.currentTarget.style.display = "none";
  };

  // ==========================================
  // FETCH CATEGORIES
  // ==========================================

  const fetchCategories = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");

      const response = await categoryService.getCategories();
      const categoryData = getCategoriesFromResponse(response);

      setCategories(categoryData);
    } catch (error) {
      console.error("Fetch Shop Categories Error:", error);

      setErrorMessage(
        getErrorMessage(error, "Unable to load shop categories.")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ==========================================
  // FILTER CATEGORIES
  // ==========================================

  const filteredCategories = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) return categories;

    return categories.filter(
      (category) =>
        category.name?.toLowerCase().includes(search) ||
        category.description?.toLowerCase().includes(search)
    );
  }, [categories, searchTerm]);

  // ==========================================
  // RESET FORM
  // ==========================================

  const resetForm = () => {
    setName("");
    setDescription("");
    setImageFile(null);
    updateImagePreview("");
    setExistingImage("");
    setEditingCategory(null);

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  // ==========================================
  // OPEN CREATE MODAL
  // ==========================================

  const openCreateModal = () => {
    resetForm();
    setErrorMessage("");
    setSuccessMessage("");
    setShowFormModal(true);
  };

  // ==========================================
  // OPEN EDIT MODAL
  // ==========================================

  const openEditModal = (category) => {
    resetForm();

    setEditingCategory(category);
    setName(category.name || "");
    setDescription(category.description || "");

    const currentImage = category.image
      ? getCategoryImageUrl(category.image)
      : "";

    setExistingImage(currentImage);
    updateImagePreview(currentImage);

    setErrorMessage("");
    setSuccessMessage("");
    setShowFormModal(true);
  };

  // ==========================================
  // CLOSE FORM MODAL
  // ==========================================

  const closeFormModal = () => {
    if (saving) return;

    setShowFormModal(false);
    resetForm();
    setErrorMessage("");
  };

  // ==========================================
  // OPEN COMPUTER FILE PICKER
  // ==========================================

  const openImagePicker = () => {
    if (saving) return;

    imageInputRef.current?.click();
  };

  // ==========================================
  // HANDLE IMAGE SELECTION
  // ==========================================

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setErrorMessage("Please select a JPG, PNG, or WEBP image.");
      event.target.value = "";
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setErrorMessage("Image size must not exceed 5 MB.");
      event.target.value = "";
      return;
    }

    setErrorMessage("");
    setImageFile(file);

    const previewUrl = URL.createObjectURL(file);
    updateImagePreview(previewUrl);

    event.target.value = "";
  };

  // ==========================================
  // REMOVE SELECTED IMAGE
  // ==========================================

  const handleRemoveSelectedImage = () => {
    setImageFile(null);
    updateImagePreview(existingImage || "");

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  // ==========================================
  // SAVE CATEGORY
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      setErrorMessage("Category name is required.");
      return;
    }

    if (trimmedName.length > 100) {
      setErrorMessage("Category name cannot exceed 100 characters.");
      return;
    }

    if (trimmedDescription.length > 500) {
      setErrorMessage("Description cannot exceed 500 characters.");
      return;
    }

    const isEditing = Boolean(editingCategory);

    try {
      setSaving(true);
      setErrorMessage("");

      const formData = new FormData();

      formData.append("name", trimmedName);
      formData.append("description", trimmedDescription);

      if (imageFile) {
        formData.append("image", imageFile);
      }

      let response;

      if (isEditing) {
        response = await adminService.updateShopCategory(
          editingCategory.id,
          formData
        );
      } else {
        response = await adminService.createShopCategory(formData);
      }

      setShowFormModal(false);
      resetForm();

      setSuccessMessage(
        response?.message ||
          (isEditing
            ? "Shop category updated successfully."
            : "Shop category created successfully.")
      );

      await fetchCategories();
    } catch (error) {
      console.error("Save Shop Category Error:", error);

      setErrorMessage(
        getErrorMessage(error, "Unable to save shop category.")
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // DELETE CATEGORY
  // ==========================================

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;

    try {
      setDeleting(true);
      setErrorMessage("");

      const response = await adminService.deleteShopCategory(
        deletingCategory.id
      );

      setCategories((previous) =>
        previous.filter(
          (category) => category.id !== deletingCategory.id
        )
      );

      setDeletingCategory(null);

      setSuccessMessage(
        response?.message ||
          "Shop category deleted successfully."
      );
    } catch (error) {
      console.error("Delete Shop Category Error:", error);

      setErrorMessage(
        getErrorMessage(error, "Unable to delete shop category.")
      );

      setDeletingCategory(null);
    } finally {
      setDeleting(false);
    }
  };

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <LoaderCircle
            size={36}
            className="mx-auto animate-spin text-indigo-600"
          />

          <p className="mt-3 text-sm text-gray-500">
            Loading shop categories...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN PAGE
  // ==========================================

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Shop Categories
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create and manage the business categories available to marketplace shop owners.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2.5 text-sm text-gray-600">
            <Tags size={17} />
            <span>{categories.length} Total Categories</span>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              <Plus size={18} />
              Add Category
            </button>
          )}
        </div>
      </div>

      {/* FEEDBACK */}

      {successMessage && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            {successMessage}
          </div>

          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            aria-label="Dismiss success message"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {errorMessage && !showFormModal && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            {errorMessage}
          </div>

          <button
            type="button"
            onClick={() => setErrorMessage("")}
            aria-label="Dismiss error message"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* SEARCH AND REFRESH */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search shop categories..."
            className="w-full rounded-lg border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <button
          type="button"
          onClick={() => fetchCategories(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* CATEGORY TABLE */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-gray-500">
                  Category
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-gray-500">
                  Description
                </th>

                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-gray-500">
                  Shops
                </th>

                <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center">
                    <Tags
                      size={40}
                      className="mx-auto text-gray-300"
                    />

                    <h3 className="mt-3 font-semibold text-gray-800">
                      No categories found
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm
                        ? "Try a different search term."
                        : "Create your first shop category to get started."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr
                    key={category.id}
                    className="transition hover:bg-gray-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                          {category.image ? (
                            <img
                              src={getCategoryImageUrl(category.image)}
                              alt={category.name}
                              onError={handleImageError}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-400">
                              <ImageIcon size={21} />
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="font-semibold text-gray-800">
                            {category.name}
                          </p>

                          <p className="text-xs text-gray-400">
                            Category #{category.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="max-w-xs px-5 py-4">
                      <p className="line-clamp-2 text-sm text-gray-500">
                        {category.description || "No description"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                        <Store size={14} />
                        {category._count?.shops ?? 0}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingCategory(category)}
                          title="View category"
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Eye size={17} />
                        </button>

                        {canUpdate && (
                          <button
                            type="button"
                            onClick={() => openEditModal(category)}
                            title="Edit category"
                            className="rounded-lg p-2 text-gray-500 transition hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            <Pencil size={17} />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setDeletingCategory(category)}
                            title="Delete category"
                            className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={17} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-100 px-5 py-3">
          <p className="text-xs text-gray-500">
            Showing {filteredCategories.length} of {categories.length} categories
          </p>
        </div>
      </div>

      {/* ==========================================
          CREATE / EDIT MODAL
      ========================================== */}

      {showFormModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-4">

          {/* REDUCED MODAL WIDTH */}

          <div className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex shrink-0 items-start justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingCategory
                    ? "Edit Shop Category"
                    : "Create Shop Category"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingCategory
                    ? "Update the shop category information."
                    : "Add a new business category to ShopEase."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeFormModal}
                disabled={saving}
                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={21} />
              </button>
            </div>

            {/* MODAL FORM */}

            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">

                {/* NARROWER CENTERED FORM CONTENT */}

                <div className="mx-auto w-full max-w-md space-y-4">

                  {/* FORM ERROR */}

                  {errorMessage && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      <AlertCircle
                        size={18}
                        className="mt-0.5 shrink-0"
                      />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* CATEGORY NAME */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Category Name
                      <span className="ml-1 text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      maxLength={100}
                      required
                      placeholder="e.g. Electronics"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />

                    <p className="mt-1 text-xs text-gray-400">
                      Maximum 100 characters.
                    </p>
                  </div>

                  {/* DESCRIPTION */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Description
                      <span className="ml-2 font-normal text-gray-400">
                        (Optional)
                      </span>
                    </label>

                    <textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      maxLength={500}
                      rows={3}
                      placeholder="Describe the types of shops that belong to this category..."
                      className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />

                    <p className="mt-1 text-right text-xs text-gray-400">
                      {description.length}/500
                    </p>
                  </div>

                  {/* CATEGORY IMAGE */}

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4">

                    <div className="flex flex-col gap-3">

                      <div>
                        <label className="block text-sm font-semibold text-gray-700">
                          Category Image
                          <span className="ml-2 font-normal text-gray-400">
                            (Optional)
                          </span>
                        </label>

                        <p className="mt-1 text-xs text-gray-500">
                          JPG, PNG, or WEBP. Maximum 5 MB.
                        </p>
                      </div>

                      {/* FILE INPUT */}

                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageChange}
                        disabled={saving}
                        className="hidden"
                      />

                      {/* UPLOAD BUTTON */}

                      <button
                        type="button"
                        onClick={openImagePicker}
                        disabled={saving}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Upload size={16} />

                        {imagePreview
                          ? "Change Image"
                          : "Upload Image"}
                      </button>

                    </div>

                    {/* COMPACT IMAGE PREVIEW */}

                    {imagePreview ? (
                      <div className="mt-3 flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-2">

                        <img
                          src={imagePreview}
                          alt="Category preview"
                          onError={handleImageError}
                          className="h-16 w-16 shrink-0 rounded-lg object-cover"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-700">
                            {imageFile
                              ? imageFile.name
                              : "Current category image"}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            {imageFile
                              ? "New image selected"
                              : "Existing uploaded image"}
                          </p>
                        </div>

                        {imageFile && (
                          <button
                            type="button"
                            onClick={handleRemoveSelectedImage}
                            disabled={saving}
                            className="shrink-0 text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                          >
                            Undo
                          </button>
                        )}

                      </div>
                    ) : (
                      <div className="mt-3 flex h-24 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white text-center">
                        <ImageIcon size={25} className="text-indigo-400" />

                        <p className="mt-1 text-sm font-semibold text-gray-700">
                          No image selected
                        </p>

                        <p className="text-xs text-gray-400">
                          Choose an image from your computer.
                        </p>
                      </div>
                    )}

                    {/* EXISTING IMAGE INFORMATION */}

                    {editingCategory && existingImage && !imageFile && (
                      <p className="mt-2 text-xs text-gray-500">
                        Your current image will be kept unless you select a replacement.
                      </p>
                    )}

                  </div>
                </div>
              </div>

              {/* MODAL FOOTER */}

              <div className="flex shrink-0 flex-col-reverse justify-end gap-3 border-t border-gray-100 bg-gray-50 px-5 py-3 sm:flex-row sm:px-6">
                <button
                  type="button"
                  onClick={closeFormModal}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <LoaderCircle
                        size={17}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      {editingCategory ? (
                        <Pencil size={16} />
                      ) : (
                        <Plus size={18} />
                      )}

                      {editingCategory
                        ? "Update Category"
                        : "Create Category"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          VIEW CATEGORY MODAL
      ========================================== */}

      {viewingCategory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* VIEW HEADER */}

            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Shop Category Details
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  View category information.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewingCategory(null)}
                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100"
              >
                <X size={21} />
              </button>
            </div>

            {/* VIEW CONTENT */}

            <div className="space-y-5 p-6">

              {viewingCategory.image ? (
                <img
                  src={getCategoryImageUrl(viewingCategory.image)}
                  alt={viewingCategory.name}
                  onError={handleImageError}
                  className="h-56 w-full rounded-xl bg-gray-50 object-cover"
                />
              ) : (
                <div className="flex h-44 items-center justify-center rounded-xl bg-gray-50 text-gray-300">
                  <ImageIcon size={55} />
                </div>
              )}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Category Name
                </p>

                <h3 className="mt-1 text-lg font-bold text-gray-900">
                  {viewingCategory.name}
                </h3>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Description
                </p>

                <p className="mt-1 text-sm leading-6 text-gray-600">
                  {viewingCategory.description || "No description provided."}
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                <div>
                  <p className="text-xs text-gray-500">
                    Shops in this category
                  </p>

                  <p className="mt-1 text-lg font-bold text-gray-900">
                    {viewingCategory._count?.shops ?? 0}
                  </p>
                </div>

                <Store size={25} className="text-indigo-500" />
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <CalendarDays size={20} />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Created Date
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-800">
                    {formatCreatedDate(viewingCategory)}
                  </p>
                </div>
              </div>
            </div>

            {/* VIEW FOOTER */}

            <div className="flex justify-end border-t border-gray-100 bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setViewingCategory(null)}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          DELETE CONFIRMATION MODAL
      ========================================== */}

      {deletingCategory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">

            <div className="p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Trash2 size={25} />
              </div>

              <h2 className="mt-4 text-xl font-bold text-gray-900">
                Delete Shop Category?
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Are you sure you want to delete{" "}
                <strong className="text-gray-800">
                  {deletingCategory.name}
                </strong>
                ? This action cannot be undone.
              </p>

              <p className="mt-3 text-xs text-gray-400">
                Categories assigned to existing shops cannot be deleted.
              </p>
            </div>

            <div className="flex flex-col-reverse justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                disabled={deleting}
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteCategory}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? (
                  <>
                    <LoaderCircle
                      size={16}
                      className="animate-spin"
                    />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Category
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminShopCategories;
