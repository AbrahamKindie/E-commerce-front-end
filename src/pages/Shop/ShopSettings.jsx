
import { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Save,
  Store,
  MapPin,
  Phone,
  Mail,
  Image as ImageIcon,
  AlertCircle,
  Camera,
  RotateCcw,
} from "lucide-react";

import shopService from "../../services/shopService";
import { API_BASE_URL } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

// ==========================================
// IMAGE URL CONFIGURATION
// ==========================================

const getBackendOrigin = () => {
  try {
    return new URL(API_BASE_URL, window.location.origin).origin;
  } catch (error) {
    console.error("Invalid backend API URL:", API_BASE_URL);
    return "";
  }
};

const BACKEND_URL = getBackendOrigin();

const getImageUrl = (imagePath) => {
  if (!imagePath || typeof imagePath !== "string") {
    return "";
  }

  // Keep temporary browser previews unchanged.
  if (
    imagePath.startsWith("blob:") ||
    imagePath.startsWith("data:") ||
    /^https?:\/\//i.test(imagePath)
  ) {
    return imagePath;
  }

  // Convert backend-relative paths into absolute URLs.
  return `${BACKEND_URL}/${imagePath.replace(/^\/+/, "")}`;
};

const ShopSettings = () => {
  const { user } = useAuth();

  // ==========================================
  // STATES
  // ==========================================

  const [shop, setShop] = useState(null);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    shopCategoryId: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    region: "",
  });

  const [coverPreview, setCoverPreview] = useState("");
  const [logoPreview, setLogoPreview] = useState("");

  const [coverFile, setCoverFile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // FILTER CATEGORIES
  // ==========================================

  const availableCategories = useMemo(() => {
    return categories.filter(
      (category) =>
        category?.name?.trim().toLowerCase() !== "other"
    );
  }, [categories]);

  // ==========================================
  // APPLY SHOP DATA
  // ==========================================

  const applyShopData = (shopData) => {
    setShop(shopData);

    setForm({
      name: shopData.name || "",
      description: shopData.description || "",
      shopCategoryId: shopData.shopCategoryId
        ? String(shopData.shopCategoryId)
        : "",
      phone: shopData.phone || "",
      email: shopData.email || "",
      address: shopData.address || "",
      city: shopData.city || "",
      region: shopData.region || "",
    });

    // Stored image paths are converted when rendered.
    setCoverPreview(shopData.coverImage || "");
    setLogoPreview(shopData.logo || "");

    setCoverFile(null);
    setLogoFile(null);
  };

  // ==========================================
  // FETCH SHOP AND CATEGORIES
  // ==========================================

  const fetchShop = async () => {
    try {
      setLoading(true);
      setError("");
      setCategoryError("");

      const response = await shopService.getMyShop();

      const responseData =
        response?.data?.shop
          ? response.data
          : response?.shop
            ? response
            : response?.data?.data;

      const shopData = responseData?.shop;
      const categoryList = responseData?.categories;

      if (!shopData) {
        throw new Error(
          "Shop information was not returned by the server."
        );
      }

      applyShopData(shopData);

      if (Array.isArray(categoryList)) {
        setCategories(categoryList);
      } else {
        setCategories([]);

        setCategoryError(
          "Categories were not included in the Get My Shop API response."
        );

        console.error(
          "Expected categories array in Get My Shop response:",
          response
        );
      }
    } catch (err) {
      console.error("Fetch shop information error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not load shop information."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    fetchShop();
  }, []);

  // ==========================================
  // HANDLE INPUT CHANGES
  // ==========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // ==========================================
  // HANDLE IMAGE SELECTION
  // ==========================================

  const handleImageChange = (event, type) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError(
        "Only JPEG, PNG, WebP, and GIF images are allowed."
      );

      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image size must not exceed 5 MB.");

      event.target.value = "";
      return;
    }

    const preview = URL.createObjectURL(file);

    if (type === "cover") {
      setCoverFile(file);
      setCoverPreview(preview);
    }

    if (type === "logo") {
      setLogoFile(file);
      setLogoPreview(preview);
    }

    event.target.value = "";
  };

  // ==========================================
  // BUILD PROFILE DATA
  // ==========================================

  const buildProfileData = () => {
    const profileData = {
      name: form.name.trim(),
      shopCategoryId: Number(form.shopCategoryId),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      address: form.address.trim(),
      city: form.city.trim(),
      region: form.region.trim(),
    };

    if (form.description.trim()) {
      profileData.description = form.description.trim();
    }

    return profileData;
  };

  // ==========================================
  // VALIDATE FORM
  // ==========================================

  const validateForm = () => {
    if (!form.name.trim()) {
      setError("Shop name is required.");
      return false;
    }

    if (!form.phone.trim()) {
      setError("Shop contact phone is required.");
      return false;
    }

    if (!form.shopCategoryId) {
      setError("Please select a shop category.");
      return false;
    }

    const selectedCategory = availableCategories.find(
      (category) =>
        String(category.id) === String(form.shopCategoryId)
    );

    if (!selectedCategory) {
      setError("Please select a valid shop category.");
      return false;
    }

    return true;
  };

  // ==========================================
  // UPLOAD SHOP IMAGES
  // ==========================================

  const uploadSelectedImages = async () => {
    if (!logoFile && !coverFile) {
      return;
    }

    const formData = new FormData();

    if (logoFile) {
      formData.append("logo", logoFile);
    }

    if (coverFile) {
      formData.append("coverImage", coverFile);
    }

    await shopService.updateMyShopImages(formData);
  };

  // ==========================================
  // SAVE SHOP INFORMATION
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    if (!validateForm()) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await shopService.updateMyShop(buildProfileData());

      await uploadSelectedImages();

      await fetchShop();

      setSuccess(
        "Shop information and images updated successfully."
      );
    } catch (err) {
      console.error("Update shop error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not update shop settings."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // CLEAN UP OBJECT URLS
  // ==========================================

  useEffect(() => {
    return () => {
      if (coverPreview.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview);
      }

      if (logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [coverPreview, logoPreview]);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center gap-3 text-gray-500">
        <RefreshCw size={20} className="animate-spin" />
        Loading shop settings...
      </div>
    );
  }

  // ==========================================
  // FORM FIELDS
  // ==========================================

  const fields = [
    {
      name: "name",
      label: "Shop Name",
      required: true,
      icon: Store,
    },
    {
      name: "phone",
      label: "Contact Phone",
      required: true,
      icon: Phone,
    },
    {
      name: "email",
      label: "Shop Email",
      required: false,
      icon: Mail,
    },
    {
      name: "address",
      label: "Street Address",
      required: false,
      icon: MapPin,
    },
    {
      name: "city",
      label: "City",
      required: false,
      icon: MapPin,
    },
    {
      name: "region",
      label: "Region",
      required: false,
      icon: MapPin,
    },
  ];

  const shopStatus = shop?.status || "ACTIVE";

  const statusStyles =
    shopStatus === "ACTIVE"
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700";

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      {/* PAGE HEADER */}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Shop Settings
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage your shop profile, business information and
          contact details.
        </p>
      </div>

      {/* ERROR MESSAGE */}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* SUCCESS MESSAGE */}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* SHOP OVERVIEW */}

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

        {/* COVER IMAGE */}

        <div className="relative h-36 bg-gradient-to-r from-indigo-600 to-violet-500 sm:h-48">

          {coverPreview && (
            <img
              src={getImageUrl(coverPreview)}
              alt="Shop cover"
              className="h-full w-full object-cover"
              onError={(event) => {
                console.error(
                  "Cover image failed to load:",
                  event.currentTarget.src
                );
              }}
            />
          )}

          <label
            htmlFor="coverImage"
            className="absolute right-4 top-4 flex cursor-pointer items-center gap-2 rounded-xl bg-black/60 px-3 py-2 text-sm font-medium text-white hover:bg-black/80"
          >
            <Camera size={17} />
            Change Cover
          </label>

          <input
            id="coverImage"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            disabled={saving}
            onChange={(event) =>
              handleImageChange(event, "cover")
            }
          />
        </div>

        {/* LOGO AND SHOP DETAILS */}

        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between">

          <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start">

            {/* SHOP LOGO */}

            <div className="relative -mt-12 h-20 w-20 shrink-0 sm:-mt-14 sm:h-24 sm:w-24">

              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow">

                {logoPreview ? (
                  <img
                    src={getImageUrl(logoPreview)}
                    alt="Shop logo"
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      console.error(
                        "Shop logo failed to load:",
                        event.currentTarget.src
                      );
                    }}
                  />
                ) : (
                  <Store
                    size={36}
                    className="text-indigo-600"
                  />
                )}

              </div>

              <label
                htmlFor="shopLogo"
                title="Change shop logo"
                className="absolute -bottom-1 -right-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-white shadow hover:bg-indigo-700"
              >
                <Camera size={17} />
              </label>

              <input
                id="shopLogo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={saving}
                onChange={(event) =>
                  handleImageChange(event, "logo")
                }
              />

            </div>

            {/* SHOP INFORMATION */}

            <div className="min-w-0 flex-1">

              <h2 className="text-lg font-bold text-gray-900">
                {shop?.name || "Your Shop"}
              </h2>

              <p className="text-sm text-gray-500">
                Owner: {user?.name || "—"}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                {shop?.shopCategory?.name || "No category"}
              </p>

              {/* SHOP BRANDING */}

              <div className="mt-4 rounded-xl bg-gray-50 p-3">

                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <ImageIcon
                    size={17}
                    className="text-indigo-600"
                  />
                  Shop Branding
                </h3>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Upload a shop logo and cover image to customize
                  how your shop appears to customers.
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Supported formats: JPEG, PNG, WebP and GIF.
                  Maximum size: 5 MB per image.
                </p>

              </div>

            </div>
          </div>

          {/* STATUS */}

          <span
            className={`w-fit shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyles}`}
          >
            {shopStatus}
          </span>

        </div>

        {/* SELECTED IMAGES */}

        {(coverFile || logoFile) && (
          <div className="mx-5 mb-5 rounded-xl border border-indigo-200 bg-indigo-50 p-3">

            <p className="text-sm font-semibold text-indigo-800">
              Image changes selected
            </p>

            {coverFile && (
              <p className="mt-1 text-xs text-indigo-700">
                Cover image: {coverFile.name}
              </p>
            )}

            {logoFile && (
              <p className="mt-1 text-xs text-indigo-700">
                Shop logo: {logoFile.name}
              </p>
            )}

            <p className="mt-2 text-xs text-indigo-600">
              Save your changes to upload the selected images.
            </p>

          </div>
        )}

      </div>

      {/* SHOP PROFILE FORM */}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border bg-white p-5 shadow-sm sm:p-7"
      >

        {/* FORM HEADER */}

        <div className="border-b pb-4">
          <h2 className="text-lg font-bold text-gray-900">
            Business Information
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Update the information customers see about your shop.
          </p>
        </div>

        {/* BASIC INFORMATION */}

        <div>

          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Basic Information
          </h3>

          <div className="grid gap-5 sm:grid-cols-2">

            {fields.map(
              ({ name, label, required, icon: Icon }) => (
                <div key={name}>

                  <label
                    htmlFor={name}
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    {label}

                    {required && (
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    )}
                  </label>

                  <div className="relative">

                    <Icon
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      id={name}
                      name={name}
                      type={name === "email" ? "email" : "text"}
                      value={form[name]}
                      onChange={handleChange}
                      required={required}
                      disabled={saving}
                      className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
                    />

                  </div>
                </div>
              )
            )}

            {/* SHOP CATEGORY */}

            <div className="sm:col-span-2">

              <label
                htmlFor="shopCategoryId"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Shop Category *
              </label>

              <select
                id="shopCategoryId"
                name="shopCategoryId"
                value={form.shopCategoryId}
                onChange={handleChange}
                required
                disabled={saving || categories.length === 0}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
              >
                <option value="">
                  Select category
                </option>

                {availableCategories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}

              </select>

              {categoryError && (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">

                  <p className="text-xs text-amber-800">
                    {categoryError}
                  </p>

                  <button
                    type="button"
                    onClick={fetchShop}
                    disabled={loading || saving}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-900 disabled:opacity-50"
                  >
                    <RotateCcw size={13} />
                    Retry
                  </button>

                </div>
              )}

              {!categoryError &&
                categories.length > 0 &&
                availableCategories.length === 0 && (
                  <p className="mt-2 text-xs text-amber-700">
                    No available shop categories were found.
                  </p>
                )}

            </div>

            {/* DESCRIPTION */}

            <div className="sm:col-span-2">

              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Shop Description
              </label>

              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                disabled={saving}
                rows={5}
                placeholder="Tell customers about your shop and the products you offer..."
                className="w-full resize-y rounded-xl border border-gray-200 px-3 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
              />

            </div>

          </div>
        </div>

        {/* SAVE BUTTON */}

        <div className="flex justify-end border-t pt-5">

          <button
            type="submit"
            disabled={
              saving ||
              !!categoryError ||
              availableCategories.length === 0
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <RefreshCw
                  size={18}
                  className="animate-spin"
                />
                Saving Changes...
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

      {/* SHOP RECORD */}

      <div className="rounded-xl border bg-white p-5">

        <h3 className="font-semibold text-gray-800">
          Shop Record
        </h3>

        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">

          <div>
            <span className="text-gray-500">
              Created:
            </span>{" "}

            <span className="font-medium text-gray-700">
              {shop?.createdAt
                ? new Date(shop.createdAt).toLocaleDateString()
                : "—"}
            </span>
          </div>

          <div>
            <span className="text-gray-500">
              Last Updated:
            </span>{" "}

            <span className="font-medium text-gray-700">
              {shop?.updatedAt
                ? new Date(shop.updatedAt).toLocaleDateString()
                : "—"}
            </span>
          </div>

        </div>
      </div>

    </div>
  );
};

export default ShopSettings;
