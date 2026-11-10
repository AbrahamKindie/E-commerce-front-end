
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

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
  confirmPassword: ""
};

const Register = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Validate personal information
  const handleContinue = () => {
    setError("");

    if (formData.name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (
      formData.phone &&
      !/^(0[79]\d{8}|\+251[79]\d{8}|251[79]\d{8})$/.test(
        formData.phone.trim()
      )
    ) {
      setError("Please enter a valid Ethiopian phone number.");
      return;
    }

    if (formData.dateOfBirth) {
      const date = new Date(formData.dateOfBirth);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (Number.isNaN(date.getTime()) || date >= today) {
        setError("Please enter a valid date of birth.");
        return;
      }
    }

    setStep(2);
  };

  // Create account
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender || undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        country: formData.country.trim() || undefined
      };

      const response = await register(payload);

      setSuccess(response.message || "Account created successfully!");

      setTimeout(() => {
        navigate("/login");
      }, 1200);

    } catch (err) {
      const response = err.response?.data;

      if (response?.errors?.length) {
        setError(
          response.errors.map((item) => item.message).join(", ")
        );
      } else {
        setError(
          response?.message || "Registration failed. Please try again."
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 sm:p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Create Your ShopEase Account
          </h1>

          <p className="text-gray-500 mt-2">
            {step === 1
              ? "Let's start with your personal information."
              : "Create a secure password for your account."}
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-3">
            <span className={step === 1 ? "font-semibold text-blue-600" : "text-green-600"}>
              1. Personal Information
            </span>

            <span className={step === 2 ? "font-semibold text-blue-600" : "text-gray-400"}>
              2. Create Password
            </span>
          </div>

          <div className="flex gap-2">
            <div className="h-2 flex-1 rounded-full bg-blue-600" />
            <div
              className={`h-2 flex-1 rounded-full ${
                step === 2 ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
          </div>
        </div>

        {/* Messages */}
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

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-5">

            <h2 className="text-xl font-semibold text-gray-800">
              Personal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div>
                <label className="block text-sm font-medium mb-1">
                  Full Name *
                </label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0912345678"
                  className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  max={new Date().toISOString().split("T")[0]}
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Country
                </label>
                <input
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Country"
                  className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  City
                </label>
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                  className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Address
                </label>
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street address"
                  className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
                />
              </div>

            </div>

            <button
              type="button"
              onClick={handleContinue}
              className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Continue →
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-5">

            <h2 className="text-xl font-semibold text-gray-800">
              Create Your Password
            </h2>

            <p className="text-sm text-gray-500">
              Choose a password to protect your ShopEase account.
            </p>

            <div>
              <label className="block text-sm font-medium mb-1">
                Password *
              </label>

              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                minLength={6}
                required
                placeholder="Enter your password"
                className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Confirm Password *
              </label>

              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
                className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
              />
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
                onClick={() => {
                  setError("");
                  setStep(1);
                }}
                disabled={loading}
                className="w-1/3 rounded-lg border border-gray-300 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >
                ← Back
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-2/3 rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? "Creating Account..." : "Create Account"}
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
