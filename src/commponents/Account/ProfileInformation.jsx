
import { useEffect, useRef, useState } from "react";
import {
  Camera,
  UserRound,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  Save,
  X,
  LoaderCircle,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import userService from "../../services/userService";
import { API_BASE_URL } from "../../services/api";

// ==========================================
// PROFILE INFORMATION
// ==========================================

const ProfileInformation = () => {
  const { user, updateUser } = useAuth();

  const fileInputRef = useRef(null);

  // ==========================================
  // ROLE-BASED PROFILE PERMISSIONS
  // ==========================================

  const isCustomerRole = [
    "USER",
    "SHOP_OWNER",
  ].includes(user?.role);

  const isAdminRole = [
    "ADMIN",
    "SUPER_ADMIN",
  ].includes(user?.role);

  // All authenticated account roles can edit
  // their permitted personal information.
  const canEditProfile = isCustomerRole || isAdminRole;

  // Only customers and shop owners can change phone.
  const canEditPhone = isCustomerRole;

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
    address: "",
    city: "",
    country: "",
    profileImage: "",
    isVerified: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState(null);

  // ==========================================
  // PROFILE IMAGE URL
  // ==========================================

  const getImageUrl = (image) => {
    if (!image) return null;

    if (
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      return image;
    }

    return `${API_BASE_URL}${image.startsWith("/") ? "" : "/"}${image}`;
  };

  // ==========================================
  // MAP PROFILE DATA TO FORM
  // ==========================================

  const mapProfileToForm = (profile) => ({
    name: profile.name || "",
    email: profile.email || "",
    phone: profile.phone || "",
    gender: profile.gender || "",
    dateOfBirth: profile.dateOfBirth
      ? profile.dateOfBirth.split("T")[0]
      : "",
    address: profile.address || "",
    city: profile.city || "",
    country: profile.country || "",
    profileImage: profile.profileImage || "",
    isVerified: profile.isVerified || false,
  });

  // ==========================================
  // LOAD PROFILE
  // ==========================================

  const loadProfile = async () => {
    try {
      setLoading(true);

      const response = await userService.getProfile();

      const profile = response.user;

      updateUser(profile);

      setForm(mapProfileToForm(profile));
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Unable to load your profile.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // ==========================================
  // FORM HANDLING
  // ==========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================
  // CANCEL EDITING
  // ==========================================

  const handleCancel = () => {
    setForm(
      user
        ? mapProfileToForm(user)
        : form
    );

    setEditing(false);
    setMessage(null);
  };

  // ==========================================
  // SAVE PROFILE
  // ==========================================

  const handleSave = async (event) => {
    event.preventDefault();

    setMessage(null);

    if (!canEditProfile) {
      setMessage({
        type: "error",
        text: "You are not allowed to edit this profile.",
      });
      return;
    }

    if (form.name.trim().length < 2) {
      setMessage({
        type: "error",
        text: "Name must contain at least 2 characters.",
      });
      return;
    }

    setSaving(true);

    try {
      // Common fields available to all account roles.
      const profileData = {
        name: form.name.trim(),
        gender: form.gender || null,
        dateOfBirth: form.dateOfBirth || null,
        address: form.address.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
      };

      // Phone is editable only by customers and shop owners.
      if (canEditPhone) {
        profileData.phone = form.phone.trim() || null;
      }

      // Never submit email, Admin Role, or permissions.
      const response = await userService.updateProfile(
        profileData
      );

      updateUser(response.user);

      setForm(mapProfileToForm(response.user));

      setEditing(false);

      setMessage({
        type: "success",
        text:
          response.message ||
          "Profile updated successfully.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Unable to update your profile.",
      });
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // UPLOAD PROFILE PICTURE
  // ALL ACCOUNT ROLES
  // ==========================================

  const handleImageChange = async (event) => {
    const imageFile = event.target.files?.[0];

    if (!imageFile) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(imageFile.type)) {
      setMessage({
        type: "error",
        text:
          "Only JPEG, PNG, WebP, and GIF images are allowed.",
      });

      event.target.value = "";
      return;
    }

    if (imageFile.size > 5 * 1024 * 1024) {
      setMessage({
        type: "error",
        text: "Image size cannot exceed 5 MB.",
      });

      event.target.value = "";
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const response =
        await userService.uploadProfilePicture(imageFile);

      updateUser(response.user);

      setForm((previous) => ({
        ...previous,
        profileImage: response.user.profileImage || "",
      }));

      setMessage({
        type: "success",
        text:
          response.message ||
          "Profile picture updated successfully.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Unable to upload profile picture.",
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  // ==========================================
  // INPUT STYLING
  // ==========================================

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-500 transition";

  // ==========================================
  // REUSABLE INPUT FIELD
  // ==========================================

  const renderField = ({
    label,
    name,
    icon: Icon,
    type = "text",
    placeholder = "",
    editable = true,
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
        )}

        <input
          type={type}
          name={name}
          value={form[name]}
          onChange={handleChange}
          disabled={!editing || !editable}
          placeholder={placeholder}
          className={`${inputClass} ${Icon ? "pl-11" : ""}`}
        />
      </div>
    </div>
  );

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center justify-center">
        <LoaderCircle
          className="animate-spin text-blue-600 mb-3"
          size={32}
        />

        <p className="text-gray-500">
          Loading your profile...
        </p>
      </div>
    );
  }

  // ==========================================
  // PROFILE INFORMATION
  // ==========================================

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* HEADER */}

        <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Personal Information
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Manage your personal account information.
            </p>
          </div>

          {canEditProfile && !editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(true);
                setMessage(null);
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition"
            >
              Edit Profile
            </button>
          )}
        </div>

        <div className="p-6 md:p-8">

          {/* PROFILE IMAGE */}

          <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-8">
            <div className="relative w-24 h-24 shrink-0">
              {form.profileImage ? (
                <img
                  src={getImageUrl(form.profileImage)}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <UserRound size={42} />
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center border-4 border-white hover:bg-blue-700 disabled:opacity-50"
                title="Change profile picture"
              >
                {uploading ? (
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Camera size={17} />
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">
                Profile Picture
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                JPEG, PNG, WebP, or GIF. Maximum 5 MB.
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Your picture is visible across ShopEase.
              </p>
            </div>
          </div>

          {/* ADMIN ACCOUNT NOTICE */}

          {isAdminRole && (
            <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                You can update your personal information and
                profile picture here. Your email address,
                phone number, Admin Role, and permissions
                cannot be changed through My Account.
              </p>
            </div>
          )}

          {/* NOTIFICATIONS */}

          {message && (
            <div
              className={`mb-6 p-4 rounded-xl text-sm ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-100"
                  : "bg-red-50 text-red-700 border border-red-100"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* PROFILE FORM */}

          <form onSubmit={handleSave}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {renderField({
                label: "Full Name",
                name: "name",
                icon: UserRound,
                placeholder: "Enter your full name",
              })}

              {/* EMAIL */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="email"
                    value={form.email}
                    disabled
                    className={`${inputClass} pl-11`}
                  />
                </div>

                <p className="text-xs mt-2 text-gray-500">
                  {form.isVerified
                    ? "Email verified"
                    : "Email not verified"}
                </p>
              </div>

              {/* PHONE */}

              {renderField({
                label: "Phone Number",
                name: "phone",
                icon: Phone,
                placeholder: "09XXXXXXXX",
                editable: canEditPhone,
              })}

              {/* GENDER */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>

                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  disabled={!editing || !canEditProfile}
                  className={inputClass}
                >
                  <option value="">Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {renderField({
                label: "Date of Birth",
                name: "dateOfBirth",
                icon: CalendarDays,
                type: "date",
              })}

              {renderField({
                label: "Address",
                name: "address",
                icon: MapPin,
                placeholder: "Enter your address",
              })}

              {renderField({
                label: "City",
                name: "city",
                placeholder: "Enter your city",
              })}

              {renderField({
                label: "Country",
                name: "country",
                placeholder: "Enter your country",
              })}
            </div>

            {/* ACTION BUTTONS */}

            {canEditProfile && editing && (
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-5 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <X size={18} />
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving ? (
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={18} />
                  )}

                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileInformation;
