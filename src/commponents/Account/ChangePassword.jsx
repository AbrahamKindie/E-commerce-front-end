
import { useState } from "react";
import {
  LockKeyhole,
  Eye,
  EyeOff,
  Save,
  LoaderCircle,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";

import passwordService from "../../services/passwordService";

const ChangePassword = () => {
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage(null);

    if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
      setMessage({
        type: "error",
        text: "Please complete all password fields.",
      });
      return;
    }

    if (form.newPassword.length < 8) {
      setMessage({
        type: "error",
        text: "New password must contain at least 8 characters.",
      });
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setMessage({
        type: "error",
        text: "New password and confirmation do not match.",
      });
      return;
    }

    if (form.oldPassword === form.newPassword) {
      setMessage({
        type: "error",
        text: "New password must be different from your current password.",
      });
      return;
    }

    try {
      setSaving(true);

      const response = await passwordService.changePassword({
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      });

      setForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setMessage({
        type: "success",
        text:
          response.message ||
          "Password changed successfully. Please log in again on your other devices.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Unable to change your password. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-white text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition";

  const renderPasswordField = (label, name, placeholder) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <div className="relative">
        <input
          type={showPasswords[name] ? "text" : "password"}
          name={name}
          value={form[name]}
          onChange={handleChange}
          placeholder={placeholder}
          autoComplete={
            name === "oldPassword"
              ? "current-password"
              : "new-password"
          }
          className={inputClass}
        />

        <button
          type="button"
          onClick={() => togglePasswordVisibility(name)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
          aria-label={
            showPasswords[name] ? "Hide password" : "Show password"
          }
        >
          {showPasswords[name] ? (
            <EyeOff size={19} />
          ) : (
            <Eye size={19} />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 md:p-8 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <LockKeyhole size={24} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Change Password
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Update your password to keep your account secure.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <div className="max-w-xl">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex gap-3">
            <ShieldCheck
              size={22}
              className="text-blue-600 shrink-0 mt-0.5"
            />

            <div>
              <h3 className="text-sm font-semibold text-blue-900">
                Password security
              </h3>

              <p className="text-sm text-blue-700 mt-1">
                Choose a strong password containing at least 8 characters.
                Avoid reusing your current password.
              </p>
            </div>
          </div>

          {message && (
            <div
              className={`rounded-xl p-4 mb-6 text-sm border ${
                message.type === "success"
                  ? "bg-green-50 border-green-100 text-green-700"
                  : "bg-red-50 border-red-100 text-red-700"
              }`}
            >
              <div className="flex items-start gap-2">
                {message.type === "success" && (
                  <CheckCircle size={18} className="shrink-0 mt-0.5" />
                )}

                <p>{message.text}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {renderPasswordField(
              "Current Password",
              "oldPassword",
              "Enter your current password"
            )}

            {renderPasswordField(
              "New Password",
              "newPassword",
              "Enter your new password"
            )}

            {renderPasswordField(
              "Confirm New Password",
              "confirmPassword",
              "Re-enter your new password"
            )}

            <div className="pt-5 border-t border-gray-100">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-60 transition"
              >
                {saving ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}

                {saving ? "Updating Password..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
