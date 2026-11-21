
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ImagePlus,
  Package,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";

import productService from "../../../services/productService";
import productCategoryService from "../../../services/productCategoryService";
import { API_BASE_URL } from "../../../services/api";

const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// ==========================================
// RESPONSE HELPERS
// ==========================================

const extractCategories = (response) => {
  const possibleArrays = [
    response?.data?.data,
    response?.data,
    response?.categories,
    response?.data?.categories,
    response,
  ];

  return possibleArrays.find(Array.isArray) || [];
};

const extractProduct = (response) => {
  return (
    response?.data?.data ||
    response?.data?.product ||
    response?.data ||
    response?.product ||
    response ||
    null
  );
};

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // ==========================================
  // STATE
  // ==========================================

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "0",
    productCategoryId: "",
  });

  const [categories, setCategories] = useState([]);
  const [retainedImages, setRetainedImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // LOAD PRODUCT AND SHOP PRODUCT CATEGORIES
  // ==========================================

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [productResponse, categoryResponse] = await Promise.all([
          productService.getMyShopProductById(id),
          productCategoryService.getMyProductCategories(),
        ]);

        if (!isMounted) return;

        const product = extractProduct(productResponse);
        const productCategories = extractCategories(categoryResponse);

        if (!product || !product.id) {
          throw new Error("Product information could not be found.");
        }

        if (!Array.isArray(productCategories)) {
          throw new Error("Failed to load your product categories.");
        }

        setForm({
          name: product.name || "",
          description: product.description || "",
          price: product.price?.toString() || "",
          stock: product.stock?.toString() ?? "0",
          productCategoryId:
            product.productCategoryId?.toString() || "",
        });

        setRetainedImages(
          Array.isArray(product.images) ? product.images : []
        );

        setCategories(productCategories);
      } catch (err) {
        if (!isMounted) return;

        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load product information."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // ==========================================
  // GENERATE NEW IMAGE PREVIEWS
  // ==========================================

  useEffect(() => {
    const previews = newImages.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setNewImagePreviews(previews);

    return () => {
      previews.forEach((preview) => {
        URL.revokeObjectURL(preview.url);
      });
    };
  }, [newImages]);

  // ==========================================
  // FORM HANDLING
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================
  // IMAGE URL
  // ==========================================

  const getImageUrl = (image) => {
    if (!image) return "";

    if (/^https?:\/\//i.test(image)) {
      return image;
    }

    const baseUrl = `${API_BASE_URL.replace(/\/+$/, "")}/`;

    return new URL(image.replace(/^\/+/, ""), baseUrl).href;
  };

  // ==========================================
  // ADD NEW IMAGES
  // ==========================================

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    setError("");

    if (selectedFiles.length === 0) return;

    const remainingSlots =
      MAX_IMAGES - retainedImages.length - newImages.length;

    if (selectedFiles.length > remainingSlots) {
      setError(
        `You can only add ${Math.max(remainingSlots, 0)} more image(s). Maximum allowed is ${MAX_IMAGES}.`
      );

      e.target.value = "";
      return;
    }

    for (const file of selectedFiles) {
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed.");
        e.target.value = "";
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        setError("Each image must be 5 MB or smaller.");
        e.target.value = "";
        return;
      }
    }

    setNewImages((previous) => [
      ...previous,
      ...selectedFiles,
    ]);

    // Allow selecting the same file again after removing it.
    e.target.value = "";
  };

  // ==========================================
  // REMOVE EXISTING IMAGE
  // ==========================================

  const removeExistingImage = (indexToRemove) => {
    setRetainedImages((previous) =>
      previous.filter((_, index) => index !== indexToRemove)
    );
  };

  // ==========================================
  // REMOVE NEW IMAGE
  // ==========================================

  const removeNewImage = (indexToRemove) => {
    setNewImages((previous) =>
      previous.filter((_, index) => index !== indexToRemove)
    );
  };

  // ==========================================
  // FORM VALIDATION
  // ==========================================

  const validateForm = () => {
    const trimmedName = form.name.trim();

    if (!trimmedName) {
      return "Product name is required.";
    }

    if (trimmedName.length < 2 || trimmedName.length > 25) {
      return "Product name must be between 2 and 25 characters.";
    }

    if (form.description.trim().length > 200) {
      return "Description cannot exceed 200 characters.";
    }

    if (!form.productCategoryId) {
      return "Please select a product category.";
    }

    const selectedCategory = categories.find(
      (category) =>
        String(category.id) === String(form.productCategoryId)
    );

    if (!selectedCategory) {
      return "Please select a valid product category from your shop.";
    }

    const price = Number(form.price);

    if (
      form.price.trim() === "" ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      return "Please enter a valid product price.";
    }

    const stock = Number(form.stock);

    if (
      form.stock.trim() === "" ||
      !Number.isSafeInteger(stock) ||
      stock < 0
    ) {
      return "Stock must be a valid non-negative whole number.";
    }

    if (retainedImages.length + newImages.length > MAX_IMAGES) {
      return `A product cannot have more than ${MAX_IMAGES} images.`;
    }

    return null;
  };

  // ==========================================
  // UPDATE PRODUCT
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();

      formData.append("name", form.name.trim());
      formData.append("description", form.description.trim());
      formData.append("price", form.price);
      formData.append("stock", form.stock);
      formData.append("productCategoryId", form.productCategoryId);

      // Keep only existing images selected by the owner.
      formData.append(
        "retainedImages",
        JSON.stringify(retainedImages)
      );

      // Add newly uploaded image files.
      newImages.forEach((image) => {
        formData.append("images", image);
      });

      await productService.updateShopProduct(id, formData);

      navigate("/shop/products", {
        state: {
          success: "Product updated successfully.",
        },
      });
    } catch (err) {
      const responseErrors = err.response?.data?.errors;

      const validationMessage = Array.isArray(responseErrors)
        ? responseErrors
            .map((item) => item.message)
            .filter(Boolean)
            .join(", ")
        : "";

      setError(
        validationMessage ||
          err.response?.data?.message ||
          "Failed to update product. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // IMAGE COUNT
  // ==========================================

  const totalImages = retainedImages.length + newImages.length;

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <p>Loading product information...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/shop/products"
            className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Edit Product
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Update your product information and images.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Package size={18} />
          <span>
            {totalImages}/{MAX_IMAGES} images
          </span>
        </div>
      </div>

      {/* ERROR MESSAGE */}

      {error && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{error}</p>

          <button
            type="button"
            onClick={() => setError("")}
            className="shrink-0"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* PRODUCT FORM */}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* PRODUCT INFORMATION */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            Product Information
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            {/* NAME */}

            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Product Name *
              </label>

              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                maxLength={25}
                required
                placeholder="Enter product name"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-1 text-xs text-gray-400">
                {form.name.length}/25 characters
              </p>
            </div>

            {/* CATEGORY */}

            <div>
              <label
                htmlFor="productCategoryId"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Product Category *
              </label>

              <select
                id="productCategoryId"
                name="productCategoryId"
                value={form.productCategoryId}
                onChange={handleChange}
                required
                disabled={categories.length === 0}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                <option value="">Select a category</option>

                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              {categories.length === 0 && (
                <p className="mt-2 text-xs text-red-600">
                  You have no product categories.{" "}
                  <Link
                    to="/shop/categories"
                    className="font-medium underline"
                  >
                    Create a category
                  </Link>
                </p>
              )}
            </div>

            {/* PRICE */}

            <div>
              <label
                htmlFor="price"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Price (ETB) *
              </label>

              <input
                id="price"
                name="price"
                type="number"
                min="0.01"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                required
                placeholder="Enter product price"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* STOCK */}

            <div>
              <label
                htmlFor="stock"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Available Stock *
              </label>

              <input
                id="stock"
                name="stock"
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={handleChange}
                required
                placeholder="Enter available stock"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* DESCRIPTION */}

            <div className="md:col-span-2">
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Product Description
              </label>

              <textarea
                id="description"
                name="description"
                rows={5}
                maxLength={200}
                value={form.description}
                onChange={handleChange}
                placeholder="Describe your product..."
                className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-1 text-right text-xs text-gray-400">
                {form.description.length}/200 characters
              </p>
            </div>

          </div>
        </div>

        {/* PRODUCT IMAGES */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">

          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Product Images
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Keep existing images, remove unwanted ones, or upload new images.
              </p>
            </div>

            <span className="text-sm font-medium text-gray-600">
              {totalImages}/{MAX_IMAGES} images
            </span>
          </div>

          {/* EXISTING IMAGES */}

          {retainedImages.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-medium text-gray-700">
                Existing Images
              </h3>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {retainedImages.map((image, index) => (
                  <div
                    key={`${image}-${index}`}
                    className="relative overflow-hidden rounded-lg border border-gray-200"
                  >
                    <img
                      src={getImageUrl(image)}
                      alt={`Product image ${index + 1}`}
                      className="h-36 w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      title="Remove image"
                      className="absolute right-2 top-2 rounded-full bg-red-600 p-2 text-white shadow transition hover:bg-red-700"
                    >
                      <Trash2 size={15} />
                    </button>

                    <div className="bg-gray-50 px-2 py-1 text-center text-xs text-gray-500">
                      Existing image
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NEW IMAGE PREVIEWS */}

          {newImagePreviews.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-medium text-gray-700">
                New Images
              </h3>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {newImagePreviews.map((preview, index) => (
                  <div
                    key={`${preview.file.name}-${index}`}
                    className="relative overflow-hidden rounded-lg border border-blue-200"
                  >
                    <img
                      src={preview.url}
                      alt={preview.file.name}
                      className="h-36 w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      title="Remove image"
                      className="absolute right-2 top-2 rounded-full bg-red-600 p-2 text-white shadow transition hover:bg-red-700"
                    >
                      <X size={15} />
                    </button>

                    <div className="truncate bg-blue-50 px-2 py-1 text-center text-xs text-blue-700">
                      New image
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* UPLOAD AREA */}

          {totalImages < MAX_IMAGES && (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50">

              <div className="mb-3 rounded-full bg-blue-100 p-3 text-blue-600">
                <ImagePlus size={25} />
              </div>

              <span className="font-medium text-gray-700">
                Add Product Images
              </span>

              <span className="mt-1 text-sm text-gray-500">
                Click to select images (maximum {MAX_IMAGES - totalImages} more)
              </span>

              <span className="mt-1 text-xs text-gray-400">
                Image files only · Maximum 5 MB per image
              </span>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}

          {totalImages === 0 && (
            <p className="mt-3 text-sm text-amber-600">
              This product currently has no images.
            </p>
          )}
        </div>

        {/* FORM ACTIONS */}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

          <Link
            to="/shop/products"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting || categories.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Updating Product...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>

        </div>
      </form>
    </div>
  );
};

export default EditProduct;
