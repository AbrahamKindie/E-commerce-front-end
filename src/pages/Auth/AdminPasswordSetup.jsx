
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const AdminPasswordSetup = () => {
  const {
    verifyAdminPasswordSetup,
    setupAdminPassword,
  } = useAuth();

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [verifying, setVerifying] = useState(true);
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);

  const [adminName, setAdminName] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submittingRef = useRef(false);

  // ==========================================
  // VERIFY ADMIN PASSWORD SETUP TOKEN
  // ==========================================

  useEffect(() => {
    let isMounted = true;

    const verifyToken = async () => {
      setVerifying(true);
      setTokenValid(false);
      setError("");

      if (!token) {
        setError("Invalid or missing password setup link.");
        setVerifying(false);
        return;
      }

      try {
        const response = await verifyAdminPasswordSetup(token);

        if (!isMounted) return;

        if (response?.valid) {
          setTokenValid(true);
          setAdminName(response.name || "Admin");
        } else {
          setTokenValid(false);
          setError(
            response?.message ||
              "This password setup link is invalid or has expired."
          );
        }
      } catch (err) {
        if (!isMounted) return;

        setTokenValid(false);
        setError(
          err.response?.data?.message ||
            "This password setup link is invalid, expired, or has already been used."
        );
      } finally {
        if (isMounted) {
          setVerifying(false);
        }
      }
    };

    verifyToken();

    return () => {
      isMounted = false;
    };

    // verifyAdminPasswordSetup is provided by AuthContext.
    // The token is the value that determines when verification must run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ==========================================
  // HANDLE PASSWORD SUBMISSION
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submittingRef.current || loading) return;

    setError("");
    setSuccess("");

    if (!token || !tokenValid) {
      setError("Your password setup link is invalid or expired.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      submittingRef.current = true;
      setLoading(true);

      const response = await setupAdminPassword(
        token,
        password,
        confirmPassword
      );

      if (response?.success === false) {
        setError(
          response.message || "Unable to set your password."
        );
        return;
      }

      setSuccess(
        response?.message ||
          "Your Admin password has been set successfully."
      );

      setTokenValid(false);

      setPassword("");
      setConfirmPassword("");

      setShowPassword(false);
      setShowConfirmPassword(false);

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to set your password. The link may have expired or already been used."
      );
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  // ==========================================
  // VERIFYING SCREEN
  // ==========================================

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

          <h1 className="text-xl font-bold text-gray-900">
            Verifying Your Invitation
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Please wait while we verify your password setup link.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN PAGE
  // ==========================================

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

        {/* HEADER */}

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Set Your Admin Password
          </h1>

          <p className="mt-2 text-gray-500">
            {tokenValid
              ? `Welcome, ${adminName}! Create a secure password for your ShopEase Admin account.`
              : "Complete your ShopEase Admin account setup."}
          </p>
        </div>

        {/* ERROR MESSAGE */}

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg bg-red-100 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* SUCCESS MESSAGE */}

        {success && (
          <div
            role="status"
            className="mb-5 rounded-lg bg-green-100 p-3 text-sm text-green-700"
          >
            {success}
          </div>
        )}

        {/* PASSWORD SETUP FORM */}

        {tokenValid && !success && (
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* NEW PASSWORD */}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                New Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Enter your new password"
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-gray-300 p-3 pr-20 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <p className="mt-1 text-xs text-gray-500">
                Password must contain at least 8 characters.
              </p>
            </div>

            {/* CONFIRM PASSWORD */}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Confirm Password
              </label>

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  required
                  minLength={8}
                  placeholder="Confirm your new password"
                  autoComplete="new-password"
                  className={`w-full rounded-lg border p-3 pr-20 outline-none focus:ring-2 ${
                    confirmPassword && password !== confirmPassword
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-100"
                  }`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((prev) => !prev)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>

              {/* LIVE PASSWORD MATCH VALIDATION */}

              {confirmPassword && (
                <p
                  className={`mt-1 text-xs ${
                    password === confirmPassword
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {password === confirmPassword
                    ? "Passwords match."
                    : "Passwords do not match."}
                </p>
              )}
            </div>

            {/* SUBMIT BUTTON */}

            <button
              type="submit"
              disabled={
                loading ||
                !tokenValid ||
                password.length < 8 ||
                !confirmPassword ||
                password !== confirmPassword
              }
              className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Setting Password..." : "Set Password"}
            </button>
          </form>
        )}

        {/* SUCCESS REDIRECT */}

        {success && (
          <div className="text-center text-sm text-gray-600">
            Redirecting you to the login page...
          </div>
        )}

        {/* INVALID OR EXPIRED LINK */}

        {!tokenValid && !success && (
          <div className="text-center">
            <p className="mb-5 text-sm text-gray-600">
              Please contact your Super Admin to request a new password setup link.
            </p>

            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:underline"
            >
              ← Back to Login
            </Link>
          </div>
        )}

        {/* BACK TO LOGIN */}

        {tokenValid && (
          <p className="mt-6 text-center text-sm">
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:underline"
            >
              ← Back to Login
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminPasswordSetup;
