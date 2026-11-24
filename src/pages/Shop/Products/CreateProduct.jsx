
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  Upload,
  X,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import productService from "../../../services/productService";
import productCategoryService from "../../../services/productCategoryService";

const initialForm = {
  name: "",
  description: "",
  price: "",
  stock: "0",
  productCategoryId: "",
};

const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// ==========================================
// EXTRACT CATEGORIES FROM API RESPONSE
// ==========================================

const extractCategories = (response) => {
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  if (Array.isArray(response?.categories)) {
    return response.categories;
  }

  throw new Error("Invalid product categories response.");
};

// ==========================================
// COMPONENT
// ==========================================

const CreateProduct = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // FETCH PRODUCT CATEGORIES
  // ==========================================

  useEffect(() => {
    let mounted = true;

    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        setError("");

        const response =
          await productCategoryService.getMyProductCategories();

        const categoryList = extractCategories(response);

        if (mounted) {
          setCategories(categoryList);
          setCategoriesLoaded(true);
        }
      } catch (err) {
        console.error("Fetch Product Categories Error:", err);

        if (mounted) {
          setCategories([]);
          setCategoriesLoaded(false);

          setError(
            err.response?.data?.message ||
              err.message ||
              "Could not load your product categories."
          );
        }
      } finally {
        if (mounted) {
          setLoadingCategories(false);
        }
      }
    };

    fetchCategories();

    return () => {
      mounted = false;
    };
  }, []);

  // ==========================================
  // HANDLE INPUT CHANGES
  // ==========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  // ==========================================
  // HANDLE IMAGE SELECTION
  // ==========================================

  const handleImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    event.target.value = "";
    setError("");

    if (selectedFiles.length === 0) return;

    const invalidImage = selectedFiles.find(
      (file) => !file.type.startsWith("image/")
    );

    if (invalidImage) {
      setError("Please select valid image files only.");
      return;
    }

    const oversizedImage = selectedFiles.find(
      (file) => file.size > MAX_IMAGE_SIZE
    );

    if (oversizedImage) {
      setError("Each image must be smaller than 5 MB.");
      return;
    }

    setImages((previousImages) => {
      const combinedImages = [...previousImages, ...selectedFiles];

      if (combinedImages.length > MAX_IMAGES) {
        setError(`You can upload a maximum of ${MAX_IMAGES} images.`);
        return previousImages;
      }

      return combinedImages;
    });
  };

  // ==========================================
  // REMOVE IMAGE
  // ==========================================

  const removeImage = (index) => {
    setImages((previous) =>
      previous.filter((_, imageIndex) => imageIndex !== index)
    );
  };

  // ==========================================
  // CREATE PRODUCT
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    setError("");

    if (!categoriesLoaded) {
      setError(
        "Product categories have not loaded. Please refresh the page and try again."
      );
      return;
    }

    if (categories.length === 0) {
      setError(
        "You need to create a product category before adding a product."
      );
      return;
    }

    const selectedCategory = categories.find(
      (category) =>
        String(category.id) === String(form.productCategoryId)
    );

    if (!selectedCategory) {
      setError(
        "Please select a valid product category belonging to your shop."
      );
      return;
    }

    if (!form.name.trim()) {
      setError("Product name is required.");
      return;
    }

    const price = Number(form.price);
    const stock = Number(form.stock);

    if (!Number.isFinite(price) || price <= 0) {
      setError("Product price must be greater than zero.");
      return;
    }

    if (!Number.isSafeInteger(stock) || stock < 0) {
      setError("Stock must be a valid non-negative whole number.");
      return;
    }

    if (images.length > MAX_IMAGES) {
      setError(`You can upload a maximum of ${MAX_IMAGES} images.`);
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("name", form.name.trim());
      formData.append("description", form.description.trim());
      formData.append("price", String(price));
      formData.append("stock", String(stock));

      formData.append(
        "productCategoryId",
        String(selectedCategory.id)
      );

      images.forEach((image) => {
        formData.append("images", image);
      });

      console.log("[CREATE PRODUCT UPLOAD]", {
  selectedImages: images.length,
  uploadedFileParts: formData.getAll("images").length,
  fileNames: formData.getAll("images").map((file) => file.name),
});

      await productService.createShopProduct(formData);

      navigate("/shop/products", {
        replace: true,
        state: {
          success: "Product created successfully.",
        },
      });
    } catch (err) {
      console.error("Create Product Error:", err);

      setError(
        err.response?.data?.message ||
          "Could not create product. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="mx-auto max-w-4xl space-y-6">

      {/* PAGE HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/shop/products"
            className="mb-3 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-indigo-600"
          >
            <ArrowLeft size={16} />
            Back to Products
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">
            Create Product
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Add a new product to your shop.
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Package size={25} />
        </div>
      </div>

      {/* ERROR MESSAGE */}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* CATEGORY LOADING */}

      {loadingCategories && (
        <div className="flex items-center gap-2 rounded-lg border bg-white p-4 text-sm text-gray-500">
          <RefreshCw size={18} className="animate-spin" />
          Loading your product categories...
        </div>
      )}

      {/* NO CATEGORIES WARNING */}

      {!loadingCategories &&
        categoriesLoaded &&
        categories.length === 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="font-semibold text-amber-800">
              No Product Categories Found
            </h2>

            <p className="mt-2 text-sm text-amber-700">
              You must create at least one product category before adding
              products to your shop.
            </p>

            <Link
              to="/shop/categories"
              className="mt-4 inline-flex rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700"
            >
              Manage Product Categories
            </Link>
          </div>
        )}

      {/* PRODUCT FORM */}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7"
      >
        {/* BASIC INFORMATION */}

        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Product Information
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Enter the basic details of your product.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">

          {/* PRODUCT NAME */}

          <div className="md:col-span-2">
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Product Name <span className="text-red-500">*</span>
            </label>

            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={150}
              value={form.name}
              onChange={handleChange}
              disabled={saving}
              placeholder="Enter product name"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
            />
          </div>

          {/* PRICE */}

          <div>
            <label
              htmlFor="price"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Price (ETB) <span className="text-red-500">*</span>
            </label>

            <input
              id="price"
              name="price"
              type="number"
              required
              min="0.01"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              disabled={saving}
              placeholder="Enter product price"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
            />
          </div>

          {/* STOCK */}

          <div>
            <label
              htmlFor="stock"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Available Stock <span className="text-red-500">*</span>
            </label>

            <input
              id="stock"
              name="stock"
              type="number"
              required
              min="0"
              step="1"
              value={form.stock}
              onChange={handleChange}
              disabled={saving}
              placeholder="Enter available quantity"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
            />
          </div>

          {/* PRODUCT CATEGORY */}

          <div className="md:col-span-2">
            <label
              htmlFor="productCategoryId"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Product Category <span className="text-red-500">*</span>
            </label>

            <select
              id="productCategoryId"
              name="productCategoryId"
              required
              value={form.productCategoryId}
              onChange={handleChange}
              disabled={
                loadingCategories ||
                !categoriesLoaded ||
                categories.length === 0 ||
                saving
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              <option value="">
                {loadingCategories
                  ? "Loading your categories..."
                  : !categoriesLoaded
                    ? "Categories could not be loaded"
                    : categories.length === 0
                      ? "No product categories available"
                      : "Select a product category"}
              </option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <p className="mt-2 text-xs text-gray-500">
              Only categories created for your shop are displayed.
            </p>

            <Link
              to="/shop/categories"
              className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              + Manage Product Categories
            </Link>
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
              maxLength={3000}
              value={form.description}
              onChange={handleChange}
              disabled={saving}
              placeholder="Describe your product..."
              className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
            />

            <p className="mt-1 text-right text-xs text-gray-400">
              {form.description.length}/3000 characters
            </p>
          </div>
        </div>

        {/* PRODUCT IMAGES */}

        <div className="border-t border-gray-100 pt-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Product Images
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Upload up to 10 images, maximum 5 MB each.
              </p>
            </div>

            <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              {images.length}/{MAX_IMAGES}
            </span>
          </div>

          {/* UPLOAD BUTTON */}

          {images.length < MAX_IMAGES && (
            <label
              htmlFor="images"
              className={`mt-4 inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition ${
                saving
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer hover:border-indigo-400 hover:bg-indigo-50"
              }`}
            >
              <Upload size={18} className="text-indigo-600" />
              Add Images

              <input
                id="images"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                disabled={saving}
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}

          {/* HORIZONTAL IMAGE PREVIEWS */}

          {images.length > 0 && (
            <div className="mt-5">
              <div className="flex flex-wrap items-start gap-3">
                {images.map((image, index) => (
                  <div
                    key={`${image.name}-${image.size}-${index}`}
                    className="group relative h-20 w-20 shrink-0"
                  >
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Product preview ${index + 1}`}
                      className="h-full w-full rounded-lg border border-gray-200 object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      disabled={saving}
                      title="Remove image"
                      aria-label={`Remove image ${index + 1}`}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <p className="mt-3 text-xs text-gray-400">
                {images.length} image(s) selected. Click the × icon to remove
                an image.
              </p>
            </div>
          )}
        </div>

        {/* FORM ACTIONS */}

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
          <Link
            to="/shop/products"
            className="rounded-lg border border-gray-300 px-6 py-3 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={
              saving ||
              loadingCategories ||
              !categoriesLoaded ||
              categories.length === 0
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw size={17} className="animate-spin" />
                Creating Product...
              </>
            ) : (
              "Create Product"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProduct;
