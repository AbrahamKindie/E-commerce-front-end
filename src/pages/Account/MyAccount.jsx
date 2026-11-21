
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { UserRound, AlertCircle } from "lucide-react";

import { useAuth } from "../../context/AuthContext";

import AccountSidebar from "../../commponents/Account/AccountSidebar";
import AccountOverview from "../../commponents/Account/AccountOverview";
import ProfileInformation from "../../commponents/Account/ProfileInformation";
import ChangePassword from "../../commponents/Account/ChangePassword";

// ==========================================
// ROLE LABELS
// ==========================================

const getRoleLabel = (role) => {
  const roles = {
    USER: "Customer",
    SHOP_OWNER: "Shop Owner",
    ADMIN: "Administrator",
    SUPER_ADMIN: "Super Administrator",
  };

  return roles[role] || "Account";
};

// ==========================================
// MY ACCOUNT
// ==========================================

const MyAccount = () => {
  const { user } = useAuth();
  const location = useLocation();

  const [activeSection, setActiveSection] = useState("overview");

  const deactivationMessage = location.state?.message;

  // ==========================================
  // SECTION TITLES
  // ==========================================

  const sectionTitles = {
    overview: "My Account",
    profile: "Personal Information",
    password: "Change Password",
  };

  // ==========================================
  // ACCOUNT SECTION RENDERER
  // ==========================================

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return (
          <AccountOverview
            user={user}
            onSectionChange={setActiveSection}
          />
        );

      case "profile":
        return <ProfileInformation />;

      case "password":
        return <ChangePassword />;

      default:
        return (
          <AccountOverview
            user={user}
            onSectionChange={setActiveSection}
          />
        );
    }
  };

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">

        {/* ACCOUNT HEADER */}

        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UserRound size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
                My Account
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage your personal information and account settings.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {getRoleLabel(user?.role)}
            </span>

            {user?.email && (
              <span className="text-xs text-gray-400">
                {user.email}
              </span>
            )}
          </div>
        </div>

        {/* SHOP DEACTIVATION NOTICE */}

        {deactivationMessage === "Your shop is deactivated." && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertCircle
              size={21}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>
              <h3 className="text-sm font-semibold text-red-800">
                Shop Deactivated
              </h3>

              <p className="mt-1 text-sm text-red-700">
                Your shop is deactivated. You can still use your account
                to browse products and make purchases, but shop management
                features are currently unavailable.
              </p>
            </div>
          </div>
        )}

        {/* ACCOUNT CONTENT */}

        <div className="flex flex-col items-start gap-6 lg:flex-row">

          {/* SIDEBAR */}

          <AccountSidebar
            user={user}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />

          {/* MAIN SECTION */}

          <main className="w-full min-w-0 flex-1">

            {/* SECTION TITLE */}

            <div className="mb-5">
              <h2 className="text-xl font-bold text-gray-900">
                {sectionTitles[activeSection] || "My Account"}
              </h2>
            </div>

            {renderSection()}

          </main>
        </div>
      </div>
    </div>
  );
};

export default MyAccount;
