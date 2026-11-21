
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import categoryService from "../../services/categoryService";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  address: "",
  city: "",
  country: "",
  password: "",
  confirmPassword: "",
  shopName: "",
  shopDescription: "",
  shopCategoryId: "",
  customCategoryName: "",
  shopPhone: "",
  shopEmail: "",
  shopAddress: "",
  shopCity: "",
  shopRegion: "",
};

const phoneRegex = /^(0[79]\d{8}|\+251[79]\d{8}|251[79]\d{8})$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];

const DUPLICATE_CATEGORY_MESSAGE =
  "This category already exists. Please select it from the category list.";

const normalizeCategoryName = (name = "") =>
  name.trim().replace(/\s+/g, " ").toLowerCase();

const Register = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [accountType, setAccountType] = useState("");
  const [step, setStep] = useState("type");
  const [formData, setFormData] = useState(initialForm);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [showPassword, setShowPassword] = useState(false);

  // Actual image File objects (not Base64 strings).
  const [profileImage, setProfileImage] = useState(null);
  const [shopLogo, setShopLogo] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [customCategoryImage, setCustomCategoryImage] =
    useState(null);

  // Category states.
  const [shopCategories, setShopCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState("");
  const [categoriesReloadKey, setCategoriesReloadKey] = useState(0);

  const inputClass =
    "w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  // ==========================================
  // DETECT SELECTED CATEGORY
  // ==========================================

  const selectedCategory = shopCategories.find(
    (category) =>
      String(category.id) === String(formData.shopCategoryId)
  );

  const isOtherCategory =
    normalizeCategoryName(selectedCategory?.name || "") === "other";

  // ==========================================
  // FIELD ERROR HELPERS
  // ==========================================

  const setFieldError = (field, message) => {
    setFieldErrors((prev) => ({
      ...prev,
      [field]: message,
    }));
  };

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  };

  const clearAllErrors = () => {
    setError("");
    setFieldErrors({});
  };

  const FieldError = ({ name }) =>
    fieldErrors[name] ? (
      <p className="mt-1 text-xs text-red-600" role="alert">
        {fieldErrors[name]}
      </p>
    ) : null;

  // ==========================================
  // DUPLICATE CATEGORY VALIDATION
  // ==========================================

  const isDuplicateCategory = (categoryName) => {
    const normalizedName = normalizeCategoryName(categoryName);

    if (!normalizedName) return false;

    return shopCategories.some(
      (category) =>
        normalizeCategoryName(category.name) === normalizedName
    );
  };

  const validateCustomCategoryName = (categoryName) => {
    const trimmedName = categoryName.trim();

    if (!trimmedName) {
      clearFieldError("customCategoryName");
      return false;
    }

    if (trimmedName.length < 2) {
      setFieldError(
        "customCategoryName",
        "Please enter a category name with at least 2 characters."
      );
      return false;
    }

    if (isDuplicateCategory(trimmedName)) {
      setFieldError(
        "customCategoryName",
        DUPLICATE_CATEGORY_MESSAGE
      );
      return false;
    }

    clearFieldError("customCategoryName");
    return true;
  };

  // ==========================================
  // FETCH SHOP CATEGORIES
  // ==========================================

  useEffect(() => {
    if (step !== "shop") return;

    let isMounted = true;

    const fetchShopCategories = async () => {
      try {
        setCategoriesLoading(true);
        setCategoriesError("");

        const response = await categoryService.getCategories();

        if (!isMounted) return;

        const categories = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];

        setShopCategories(categories);
      } catch (err) {
        if (!isMounted) return;

        setCategoriesError(
          err.response?.data?.message ||
            "Unable to load shop categories. Please try again."
        );

        setShopCategories([]);
      } finally {
        if (isMounted) {
          setCategoriesLoading(false);
        }
      }
    };

    fetchShopCategories();

    return () => {
      isMounted = false;
    };
  }, [step, categoriesReloadKey]);

  // ==========================================
  // HANDLE INPUT CHANGES
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");

    if (name === "customCategoryName" && isOtherCategory) {
      validateCustomCategoryName(value);
    } else {
      clearFieldError(name);
    }
  };

  // ==========================================
  // IMAGE FILE HANDLING
  // ==========================================

  const handleImageChange = (e, setImage, fieldName) => {
    const file = e.target.files?.[0];

    if (!file) return;

    clearFieldError(fieldName);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setFieldError(
        fieldName,
        "Only PNG, JPG, JPEG, WEBP, and GIF images are allowed."
      );

      e.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setFieldError(
        fieldName,
        "Image size must not exceed 5 MB."
      );

      e.target.value = "";
      return;
    }

    setImage(file);
  };

  const removeImage = (setImage, fieldName, inputId) => {
    setImage(null);
    clearFieldError(fieldName);

    const input = document.getElementById(inputId);

    if (input) {
      input.value = "";
    }
  };

  // ==========================================
  // ACCOUNT TYPE
  // ==========================================

  const handleAccountType = (type) => {
    setAccountType(type);
    setStep("personal");
    clearAllErrors();
    setSuccess("");
  };

  // ==========================================
  // CATEGORY SELECTION
  // ==========================================

  const handleShopCategoryChange = (e) => {
    const value = e.target.value;

    const selected = shopCategories.find(
      (category) => String(category.id) === String(value)
    );

    const selectingOther =
      normalizeCategoryName(selected?.name || "") === "other";

    setFormData((prev) => ({
      ...prev,
      shopCategoryId: value,
      customCategoryName: selectingOther
        ? prev.customCategoryName
        : "",
    }));

    if (!selectingOther) {
      setCustomCategoryImage(null);

      const input = document.getElementById("customCategoryImage");
      if (input) input.value = "";

      clearFieldError("customCategoryName");
      clearFieldError("customCategoryImage");
    } else {
      validateCustomCategoryName(formData.customCategoryName);
    }

    clearFieldError("shopCategoryId");
    setError("");
  };

  // ==========================================
  // VALIDATE PERSONAL INFORMATION
  // ==========================================

  const handleContinue = () => {
    clearAllErrors();

    let hasErrors = false;

    if (formData.name.trim().length < 2) {
      setFieldError("name", "Please enter your full name.");
      hasErrors = true;
    }

    if (!emailRegex.test(formData.email.trim())) {
      setFieldError("email", "Please enter a valid email address.");
      hasErrors = true;
    }

    if (!phoneRegex.test(formData.phone.trim())) {
      setFieldError(
        "phone",
        "Please enter a valid Ethiopian phone number."
      );
      hasErrors = true;
    }

    if (!formData.dateOfBirth) {
      setFieldError("dateOfBirth", "Please enter your date of birth.");
      hasErrors = true;
    } else {
      const dob = new Date(`${formData.dateOfBirth}T00:00:00`);
      const today = new Date();

      let age = today.getFullYear() - dob.getFullYear();

      const birthdayNotReached =
        today.getMonth() < dob.getMonth() ||
        (today.getMonth() === dob.getMonth() &&
          today.getDate() < dob.getDate());

      if (birthdayNotReached) age--;

      if (
        Number.isNaN(dob.getTime()) ||
        age < 18 ||
        dob >=
          new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
          )
      ) {
        setFieldError(
          "dateOfBirth",
          "You must be at least 18 years old."
        );
        hasErrors = true;
      }
    }

    if (!formData.gender) {
      setFieldError("gender", "Please select your gender.");
      hasErrors = true;
    }

    if (hasErrors) return;

    setStep(accountType === "SHOP_OWNER" ? "shop" : "password");
  };

  // ==========================================
  // VALIDATE SHOP INFORMATION
  // ==========================================

  const handleShopContinue = () => {
    clearAllErrors();

    let hasErrors = false;

    if (formData.shopName.trim().length < 2) {
      setFieldError(
        "shopName",
        "Shop name must contain at least 2 characters."
      );
      hasErrors = true;
    }

    if (formData.shopDescription.trim().length < 10) {
      setFieldError(
        "shopDescription",
        "Shop description must contain at least 10 characters."
      );
      hasErrors = true;
    }

    const category = shopCategories.find(
      (item) =>
        String(item.id) === String(formData.shopCategoryId)
    );

    if (!formData.shopCategoryId || !category) {
      setFieldError(
        "shopCategoryId",
        "Please select a valid shop category."
      );
      hasErrors = true;
    } else if (
      normalizeCategoryName(category.name) === "other"
    ) {
      const categoryName = formData.customCategoryName.trim();

      if (categoryName.length < 2) {
        setFieldError(
          "customCategoryName",
          "Please enter a category name with at least 2 characters."
        );
        hasErrors = true;
      } else if (isDuplicateCategory(categoryName)) {
        setFieldError(
          "customCategoryName",
          DUPLICATE_CATEGORY_MESSAGE
        );
        hasErrors = true;
      }

      if (!customCategoryImage) {
        setFieldError(
          "customCategoryImage",
          "Please upload an image for your new category."
        );
        hasErrors = true;
      }
    }

    if (!phoneRegex.test(formData.shopPhone.trim())) {
      setFieldError(
        "shopPhone",
        "Please enter a valid shop contact phone number."
      );
      hasErrors = true;
    }

    if (
      formData.shopEmail.trim() &&
      !emailRegex.test(formData.shopEmail.trim())
    ) {
      setFieldError(
        "shopEmail",
        "Please enter a valid shop email address."
      );
      hasErrors = true;
    }

    if (categoriesLoading) {
      setError("Please wait while shop categories are loading.");
      hasErrors = true;
    }

    if (categoriesError) {
      setError("Please reload shop categories before continuing.");
      hasErrors = true;
    }

    if (hasErrors) return;

    setStep("password");
  };

  // ==========================================
  // MAP BACKEND ERRORS TO FORM FIELDS
  // ==========================================

  const handleRegistrationError = (err) => {
    const response = err.response?.data;
    const message = response?.message || "Registration failed.";
    const lowerMessage = message.toLowerCase();

    if (response?.errors?.length) {
      let hasMappedError = false;

      response.errors.forEach((item) => {
        const field = item.field || item.path;
        let itemMessage = item.message || "Invalid value.";

        if (field) {
          const normalizedField = field.split(".").pop();

          const fieldMap = {
            name: "name",
            email: "email",
            phone: "phone",
            dateOfBirth: "dateOfBirth",
            gender: "gender",
            profileImage: "profileImage",
            shopName: "shopName",
            shopDescription: "shopDescription",
            shopCategoryId: "shopCategoryId",
            customCategoryName: "customCategoryName",
            customCategoryImage: "customCategoryImage",
            shopPhone: "shopPhone",
            shopEmail: "shopEmail",
            logo: "shopLogo",
            coverImage: "coverImage",
          };

          const mappedField = fieldMap[normalizedField];

          if (mappedField) {
            if (
              mappedField === "customCategoryName" &&
              itemMessage.toLowerCase().includes("already exists")
            ) {
              itemMessage = DUPLICATE_CATEGORY_MESSAGE;
            }

            setFieldError(mappedField, itemMessage);
            hasMappedError = true;
          }
        }
      });

      if (!hasMappedError) {
        setError(
          response.errors.map((item) => item.message).join(", ")
        );
      }

      return;
    }

    if (
      lowerMessage.includes("already exists") &&
      (lowerMessage.includes("categor") || isOtherCategory)
    ) {
      setFieldError(
        "customCategoryName",
        DUPLICATE_CATEGORY_MESSAGE
      );
      return;
    }

    if (
      lowerMessage.includes("valid shop category") ||
      lowerMessage.includes("shop category")
    ) {
      setFieldError("shopCategoryId", message);
      return;
    }

    if (lowerMessage.includes("category image")) {
      setFieldError("customCategoryImage", message);
      return;
    }

    if (lowerMessage.includes("category name")) {
      setFieldError("customCategoryName", message);
      return;
    }

    setError(message);
  };

  // ==========================================
  // CREATE ACCOUNT USING FORMDATA
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearAllErrors();

    if (formData.password.length < 8) {
      setFieldError(
        "password",
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFieldError("confirmPassword", "Passwords do not match.");
      return;
    }

    try {
      const formPayload = new FormData();

      // Personal information.
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        country: formData.country.trim() || undefined,
        role: accountType,
      };

      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formPayload.append(key, String(value));
        }
      });

      // Personal profile image.
      if (profileImage) {
        formPayload.append("profileImage", profileImage);
      }

      // Shop owner information.
      if (accountType === "SHOP_OWNER") {
        const shopPayload = {
          name: formData.shopName.trim(),
          description: formData.shopDescription.trim(),
          shopCategoryId: Number(formData.shopCategoryId),
          phone: formData.shopPhone.trim(),
          email: formData.shopEmail.trim() || undefined,
          address: formData.shopAddress.trim() || undefined,
          city: formData.shopCity.trim() || undefined,
          region: formData.shopRegion.trim() || undefined,
        };

        if (isOtherCategory) {
          shopPayload.customCategoryName =
            formData.customCategoryName.trim();
        }

        // Backend multipart middleware expects shop as JSON.
        formPayload.append("shop", JSON.stringify(shopPayload));

        // Shop logo.
        if (shopLogo) {
          formPayload.append("logo", shopLogo);
        }

        // Shop cover image.
        if (coverImage) {
          formPayload.append("coverImage", coverImage);
        }

        // Custom category image, only for Other.
        if (isOtherCategory && customCategoryImage) {
          formPayload.append(
            "customCategoryImage",
            customCategoryImage
          );
        }
      }

      const response = await register(formPayload);

      setSuccess(
        accountType === "SHOP_OWNER"
          ? "Your account and shop have been created successfully!"
          : response?.message || "Account created successfully!"
      );

      setTimeout(() => {
        navigate("/login");
      }, 1800);
    } catch (err) {
      handleRegistrationError(err);
    }
  };

  // ==========================================
  // NAVIGATION
  // ==========================================

  const goBack = () => {
    clearAllErrors();

    if (step === "personal") {
      setStep("type");
      setAccountType("");
    } else if (step === "shop") {
      setStep("personal");
    } else if (step === "password") {
      setStep(accountType === "SHOP_OWNER" ? "shop" : "personal");
    }
  };

  // ==========================================
  // PROGRESS
  // ==========================================

  const progressSteps =
    accountType === "SHOP_OWNER"
      ? [
          "Personal Information",
          "Shop Information",
          "Create Password",
        ]
      : ["Personal Information", "Create Password"];

  const currentProgress =
    step === "personal"
      ? 1
      : step === "shop"
        ? 2
        : step === "password"
          ? accountType === "SHOP_OWNER"
            ? 3
            : 2
          : 0;

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 sm:p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Create Your ShopEase Account
          </h1>

          <p className="text-gray-500 mt-2">
            {step === "type"
              ? "Choose how you want to use ShopEase."
              : step === "personal"
                ? "Let's start with your personal information."
                : step === "shop"
                  ? "Tell us about your shop."
                  : "Create a secure password for your account."}
          </p>
        </div>

        {/* Progress */}
        {step !== "type" && (
          <div className="mb-8">
            <div className="flex justify-between text-xs sm:text-sm mb-3 gap-2">
              {progressSteps.map((item, index) => (
                <span
                  key={item}
                  className={
                    currentProgress === index + 1
                      ? "font-semibold text-blue-600"
                      : currentProgress > index + 1
                        ? "text-green-600"
                        : "text-gray-400"
                  }
                >
                  {index + 1}. {item}
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              {progressSteps.map((item, index) => (
                <div
                  key={item}
                  className={`h-2 flex-1 rounded-full ${
                    currentProgress >= index + 1
                      ? "bg-blue-600"
                      : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* General Messages */}
        {error && (
          <div className="mb-5 rounded-lg bg-red-100 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-lg bg-green-100 p-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* STEP 0: ACCOUNT TYPE */}
        {step === "type" && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-gray-800 text-center">
              How would you like to register?
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleAccountType("USER")}
                className="group border-2 border-gray-200 rounded-xl p-6 text-left hover:border-blue-500 hover:bg-blue-50 transition"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl mb-4">
                  🛍️
                </div>

                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600">
                  Buyer
                </h3>

                <p className="text-sm text-gray-500 mt-2">
                  Create an account to explore products, shop, and manage your orders.
                </p>

                <span className="block mt-5 text-sm font-semibold text-blue-600">
                  Register as Buyer →
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleAccountType("SHOP_OWNER")}
                className="group border-2 border-gray-200 rounded-xl p-6 text-left hover:border-green-500 hover:bg-green-50 transition"
              >
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl mb-4">
                  🏪
                </div>

                <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600">
                  Shop Owner
                </h3>

                <p className="text-sm text-gray-500 mt-2">
                  Register your shop and start selling your products on ShopEase.
                </p>

                <span className="block mt-5 text-sm font-semibold text-green-600">
                  Register as Shop Owner →
                </span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: PERSONAL INFORMATION */}
        {step === "personal" && (
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">
                Personal Information
              </h2>

              <span className="text-sm text-blue-600 font-medium">
                {accountType === "SHOP_OWNER" ? "Shop Owner" : "Buyer"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className={inputClass}
                />
                <FieldError name="name" />
              </div>

              <div>
                <label className={labelClass}>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  className={inputClass}
                />
                <FieldError name="email" />
              </div>

              <div>
                <label className={labelClass}>Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0912345678"
                  className={inputClass}
                />
                <FieldError name="phone" />
              </div>

              <div>
                <label className={labelClass}>Date of Birth *</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  max={new Date().toISOString().split("T")[0]}
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className={inputClass}
                />
                <FieldError name="dateOfBirth" />
              </div>

              <div>
                <label className={labelClass}>Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
                <FieldError name="gender" />
              </div>

              <div>
                <label className={labelClass}>Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Country"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street address"
                  className={inputClass}
                />
              </div>
            </div>

            {/* PERSONAL PROFILE IMAGE */}
            <div>
              <label className={labelClass}>
                Personal Profile Image (Optional)
              </label>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 hover:border-blue-500 transition">
                <label
                  htmlFor="profileImage"
                  className="flex flex-col items-center justify-center cursor-pointer text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3 text-2xl">
                    👤
                  </div>

                  <span className="font-semibold text-gray-700">
                    Click to upload your profile image
                  </span>

                  <span className="text-xs text-gray-400 mt-2">
                    PNG, JPG, JPEG, WEBP, or GIF (Maximum 5 MB)
                  </span>

                  <input
                    id="profileImage"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(e) =>
                      handleImageChange(
                        e,
                        setProfileImage,
                        "profileImage"
                      )
                    }
                    className="hidden"
                  />
                </label>

                {profileImage && (
                  <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-blue-50 p-3">
                    <span className="text-sm text-gray-700 truncate">
                      🖼️ {profileImage.name}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        removeImage(
                          setProfileImage,
                          "profileImage",
                          "profileImage"
                        )
                      }
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <FieldError name="profileImage" />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={goBack}
                className="w-1/3 rounded-lg border border-gray-300 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={handleContinue}
                className="w-2/3 rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: SHOP INFORMATION */}
        {step === "shop" && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-gray-800">
              Shop Information
            </h2>

            <p className="text-sm text-gray-500">
              Provide your shop details to register your shop on ShopEase.
            </p>

            {/* Shop Name and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Shop Name *</label>
                <input
                  type="text"
                  name="shopName"
                  value={formData.shopName}
                  onChange={handleChange}
                  placeholder="Enter your shop name"
                  className={inputClass}
                />
                <FieldError name="shopName" />
              </div>

              <div>
                <label className={labelClass}>Shop Category *</label>

                <select
                  name="shopCategoryId"
                  value={formData.shopCategoryId}
                  onChange={handleShopCategoryChange}
                  className={inputClass}
                  disabled={categoriesLoading || !!categoriesError}
                >
                  <option value="">
                    {categoriesLoading
                      ? "Loading categories..."
                      : "Select Shop Category"}
                  </option>

                  {shopCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <FieldError name="shopCategoryId" />

                {categoriesLoading && (
                  <p className="text-xs text-blue-600 mt-2">
                    Loading categories created by Admin...
                  </p>
                )}

                {categoriesError && (
                  <div className="mt-2">
                    <p className="text-xs text-red-600">
                      {categoriesError}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setCategoriesReloadKey((prev) => prev + 1)
                      }
                      className="text-xs font-semibold text-blue-600 hover:underline mt-1"
                    >
                      Try again
                    </button>
                  </div>
                )}

                {!categoriesLoading &&
                  !categoriesError &&
                  shopCategories.length === 0 && (
                    <p className="text-xs text-amber-600 mt-2">
                      No existing categories are available. Please try again later.
                    </p>
                  )}
              </div>
            </div>

            {/* CUSTOM CATEGORY NAME AND IMAGE */}
            {isOtherCategory && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-4">
                <div>
                  <label className={labelClass}>
                    Enter Your Shop Category *
                  </label>

                  <input
                    type="text"
                    name="customCategoryName"
                    value={formData.customCategoryName}
                    onChange={handleChange}
                    placeholder="Example: Pet Supplies, Bakery, Cosmetics..."
                    className={inputClass}
                    minLength={2}
                    maxLength={100}
                    aria-invalid={!!fieldErrors.customCategoryName}
                    aria-describedby={
                      fieldErrors.customCategoryName
                        ? "customCategoryName-error"
                        : undefined
                    }
                  />

                  {fieldErrors.customCategoryName && (
                    <p
                      id="customCategoryName-error"
                      className="mt-1 text-xs text-red-600"
                      role="alert"
                    >
                      {fieldErrors.customCategoryName}
                    </p>
                  )}

                  <p className="text-xs text-gray-600 mt-1">
                    Enter the name of the new category you want to register.
                  </p>
                </div>

                <div>
                  <label className={labelClass}>
                    Category Image *
                  </label>

                  <div className="border-2 border-dashed border-blue-200 rounded-xl p-5 bg-white">
                    <label
                      htmlFor="customCategoryImage"
                      className="flex flex-col items-center justify-center cursor-pointer text-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3 text-2xl">
                        🖼️
                      </div>

                      <span className="font-semibold text-gray-700">
                        Click to upload category image
                      </span>

                      <span className="text-xs text-gray-400 mt-2">
                        PNG, JPG, JPEG, WEBP, or GIF (Maximum 5 MB)
                      </span>

                      <input
                        id="customCategoryImage"
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={(e) =>
                          handleImageChange(
                            e,
                            setCustomCategoryImage,
                            "customCategoryImage"
                          )
                        }
                        className="hidden"
                      />
                    </label>

                    {customCategoryImage && (
                      <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-blue-50 p-3">
                        <span className="text-sm text-gray-700 truncate">
                          🖼️ {customCategoryImage.name}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            removeImage(
                              setCustomCategoryImage,
                              "customCategoryImage",
                              "customCategoryImage"
                            )
                          }
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  <FieldError name="customCategoryImage" />
                </div>
              </div>
            )}

            {/* Shop Description */}
            <div>
              <label className={labelClass}>Shop Description *</label>

              <textarea
                name="shopDescription"
                value={formData.shopDescription}
                onChange={handleChange}
                placeholder="Describe your shop and the products you sell..."
                rows={4}
                className={inputClass}
              />

              <FieldError name="shopDescription" />

              <p className="text-xs text-gray-400 mt-1">
                Minimum 10 characters.
              </p>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Shop Contact Phone *</label>
                <input
                  type="tel"
                  name="shopPhone"
                  value={formData.shopPhone}
                  onChange={handleChange}
                  placeholder="0912345678"
                  className={inputClass}
                />
                <FieldError name="shopPhone" />
              </div>

              <div>
                <label className={labelClass}>Shop Email</label>
                <input
                  type="email"
                  name="shopEmail"
                  value={formData.shopEmail}
                  onChange={handleChange}
                  placeholder="shop@example.com"
                  className={inputClass}
                />
                <FieldError name="shopEmail" />
              </div>
            </div>

            {/* SHOP LOGO */}
            <div>
              <label className={labelClass}>
                Shop Logo (Optional)
              </label>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 hover:border-blue-500 transition">
                <label
                  htmlFor="shopLogo"
                  className="flex flex-col items-center justify-center cursor-pointer text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                    🏪
                  </div>

                  <span className="font-semibold text-gray-700">
                    Click to upload shop logo
                  </span>

                  <span className="text-xs text-gray-400 mt-2">
                    PNG, JPG, JPEG, WEBP, or GIF (Maximum 5 MB)
                  </span>

                  <input
                    id="shopLogo"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(e) =>
                      handleImageChange(e, setShopLogo, "shopLogo")
                    }
                    className="hidden"
                  />
                </label>

                {shopLogo && (
                  <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-blue-50 p-3">
                    <span className="text-sm text-gray-700 truncate">
                      🖼️ {shopLogo.name}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        removeImage(setShopLogo, "shopLogo", "shopLogo")
                      }
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <FieldError name="shopLogo" />
            </div>

            {/* SHOP COVER IMAGE */}
            <div>
              <label className={labelClass}>
                Shop Cover Image (Optional)
              </label>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 hover:border-blue-500 transition">
                <label
                  htmlFor="coverImage"
                  className="flex flex-col items-center justify-center cursor-pointer text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                    🖼️
                  </div>

                  <span className="font-semibold text-gray-700">
                    Click to upload shop cover image
                  </span>

                  <span className="text-xs text-gray-400 mt-2">
                    PNG, JPG, JPEG, WEBP, or GIF (Maximum 5 MB)
                  </span>

                  <input
                    id="coverImage"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(e) =>
                      handleImageChange(e, setCoverImage, "coverImage")
                    }
                    className="hidden"
                  />
                </label>

                {coverImage && (
                  <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-blue-50 p-3">
                    <span className="text-sm text-gray-700 truncate">
                      🖼️ {coverImage.name}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        removeImage(
                          setCoverImage,
                          "coverImage",
                          "coverImage"
                        )
                      }
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <FieldError name="coverImage" />
            </div>

            {/* Shop Location */}
            <h3 className="text-sm font-semibold text-gray-800 pt-2">
              Shop Location
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Shop Address</label>
                <input
                  type="text"
                  name="shopAddress"
                  value={formData.shopAddress}
                  onChange={handleChange}
                  placeholder="Enter shop address"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Shop City</label>
                <input
                  type="text"
                  name="shopCity"
                  value={formData.shopCity}
                  onChange={handleChange}
                  placeholder="Enter city"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Shop Region</label>
                <input
                  type="text"
                  name="shopRegion"
                  value={formData.shopRegion}
                  onChange={handleChange}
                  placeholder="Enter region"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={goBack}
                className="w-1/3 rounded-lg border border-gray-300 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={handleShopContinue}
                disabled={categoriesLoading || !!categoriesError}
                className="w-2/3 rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CREATE PASSWORD */}
        {step === "password" && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <h2 className="text-xl font-semibold text-gray-800">
              Create Your Password
            </h2>

            <p className="text-sm text-gray-500">
              Choose a password to protect your ShopEase account.
            </p>

            <div>
              <label className={labelClass}>Password *</label>

              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                minLength={8}
                required
                placeholder="Enter your password"
                className={inputClass}
              />

              <FieldError name="password" />

              <p className="text-xs text-gray-400 mt-1">
                Password must contain at least 8 characters.
              </p>
            </div>

            <div>
              <label className={labelClass}>Confirm Password *</label>

              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                minLength={8}
                required
                placeholder="Confirm your password"
                className={inputClass}
              />

              <FieldError name="confirmPassword" />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              Show passwords
            </label>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={goBack}
                disabled={loading}
                className="w-1/3 rounded-lg border border-gray-300 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                ← Back
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-2/3 rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {loading
                  ? "Creating Account..."
                  : accountType === "SHOP_OWNER"
                    ? "Submit Shop Registration"
                    : "Create Account"}
              </button>
            </div>
          </form>
        )}

        {/* Login link */}
        <p className="mt-7 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-blue-600 hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
