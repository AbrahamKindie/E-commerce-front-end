
import { useNavigate } from "react-router-dom";
import {
  UserRound,
  ShoppingBag,
  Heart,
  Store,
  Settings,
  ShieldCheck,
  BarChart3,
  ArrowRight,
} from "lucide-react";

const AccountOverview = ({ user, onSectionChange }) => {
  const navigate = useNavigate();

  const role = user?.role;
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isAdmin = role === "ADMIN" || isSuperAdmin;

  const permissions = user?.adminPermissions || [];

  const hasPermission = (permission) =>
    isSuperAdmin || permissions.includes(permission);

  const getDescription = () => {
    switch (role) {
      case "SHOP_OWNER":
        return "Manage your personal account and shop settings, or access your Shop Owner Dashboard.";

      case "ADMIN":
        return "Access your assigned marketplace tools and privileges.";

      case "SUPER_ADMIN":
        return "Manage your administrator account and marketplace dashboard.";

      default:
        return "Manage your personal information, orders, and shopping preferences.";
    }
  };

  const cards = [
    {
      title: "Personal Information",
      description: "View and update your account information.",
      icon: UserRound,
      section: "profile",
    },

    ...(role === "USER"
      ? [
          {
            title: "My Orders",
            description: "View and track your purchases.",
            icon: ShoppingBag,
            path: "/my-orders",
          },
          {
            title: "Liked Products",
            description: "View your saved products.",
            icon: Heart,
            path: "/wishlist",
          },
        ]
      : []),

    ...(role === "SHOP_OWNER"
      ? [
          {
            title: "Shop Settings",
            description:
              "View and update your shop information, logo, and details.",
            icon: Settings,
            path: "/shop/settings",
          },
          {
            title: "Shop Owner Dashboard",
            description:
              "Manage your products, categories, orders, and reviews.",
            icon: Store,
            path: "/shop/dashboard",
          },
        ]
      : []),

    ...(isAdmin
      ? [
          ...(hasPermission("VIEW_REPORTS")
            ? [
                {
                  title: "Admin Dashboard",
                  description:
                    "View marketplace statistics and activity.",
                  icon: BarChart3,
                  path: "/admin",
                },
              ]
            : []),

          {
            title: "My Privileges",
            description:
              "Review your assigned administrator permissions.",
            icon: ShieldCheck,
            section: "permissions",
          },
        ]
      : []),
  ];

  const handleCardClick = (card) => {
    if (card.path) {
      navigate(card.path);
      return;
    }

    if (card.section) {
      onSectionChange(card.section);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-600 p-7 text-white md:p-9">
        <p className="mb-2 text-sm font-medium text-blue-100">
          Welcome back!
        </p>

        <h2 className="mb-3 text-2xl font-bold md:text-3xl">
          Hello, {user?.name?.split(" ")[0] || "there"}!
        </h2>

        <p className="max-w-xl text-blue-100">
          {getDescription()}
        </p>
      </div>

      {/* Account Shortcuts */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {role === "USER"
              ? "Account Overview"
              : role === "SHOP_OWNER"
                ? "My Account & Shop"
                : "My Account"}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Select a section to continue.
          </p>
        </div>

        {cards.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {cards.map((card) => {
              const Icon = card.icon;

              return (
                <button
                  key={card.title}
                  type="button"
                  onClick={() => handleCardClick(card)}
                  className="group rounded-2xl border border-gray-100 bg-white p-5 text-left transition hover:border-blue-200 hover:shadow-md"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon size={22} />
                  </div>

                  <h3 className="mb-1 font-semibold text-gray-900">
                    {card.title}
                  </h3>

                  <p className="mb-4 text-sm text-gray-500">
                    {card.description}
                  </p>

                  <span className="flex items-center gap-2 text-sm font-medium text-blue-600">
                    Open section
                    <ArrowRight
                      size={16}
                      className="transition group-hover:translate-x-1"
                    />
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center">
            <ShieldCheck
              className="mx-auto mb-3 text-gray-400"
              size={32}
            />

            <p className="font-medium text-gray-700">
              No management sections are currently available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountOverview;
