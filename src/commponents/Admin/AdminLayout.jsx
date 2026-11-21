
import { useState } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import {
  Menu,
  X,
  LogOut,
  ShieldCheck,
  Shield,
  ChevronDown,
  Store,
  UserRound,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import AdminSidebar from "./AdminSidebar";

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const displayName = user?.name || "Administrator";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* MAIN AREA */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:ml-72">

        {/* HEADER */}
        <header className="sticky top-0 z-30 flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur-md sm:px-6 lg:px-8">

          {/* LEFT */}
          <div className="flex min-w-0 items-center gap-3">

            <button
              type="button"
              onClick={() => setSidebarOpen((previous) => !previous)}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X size={21} /> : <Menu size={21} />}
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                  ShopEase
                </h1>

                <span className="hidden rounded-md bg-indigo-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700 sm:inline-flex">
                  Management
                </span>
              </div>

              <p className="hidden text-xs text-slate-500 sm:block">
                Marketplace administration
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="relative flex items-center gap-2 sm:gap-3">

            {/* ROLE INDICATOR */}
            <div
              className={`hidden items-center gap-2 rounded-full px-3 py-2 sm:flex ${
                isSuperAdmin
                  ? "bg-violet-50 text-violet-700"
                  : "bg-indigo-50 text-indigo-700"
              }`}
            >
              {isSuperAdmin ? (
                <ShieldCheck size={16} />
              ) : (
                <Shield size={16} />
              )}

              <span className="text-xs font-semibold">
                {isSuperAdmin ? "Super Admin" : "Admin"}
              </span>
            </div>

            {/* PROFILE */}
            <button
              type="button"
              onClick={() => setProfileOpen((previous) => !previous)}
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-100 sm:px-3"
              aria-expanded={profileOpen}
              aria-label="Open profile menu"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                  isSuperAdmin
                    ? "bg-violet-100 text-violet-700"
                    : "bg-indigo-100 text-indigo-700"
                }`}
              >
                {initials || "A"}
              </div>

              <div className="hidden text-left sm:block">
                <p className="max-w-36 truncate text-sm font-semibold text-slate-800">
                  {displayName}
                </p>

                <p className="text-xs text-slate-500">
                  {user?.email || "Administrator"}
                </p>
              </div>

              <ChevronDown
                size={16}
                className={`hidden text-slate-400 transition-transform sm:block ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* PROFILE DROPDOWN */}
            {profileOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close profile menu"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setProfileOpen(false)}
                />

                <div className="absolute right-0 top-14 z-50 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">

                  <div className="border-b border-slate-100 p-4">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {displayName}
                    </p>

                    <p className="truncate text-xs text-slate-500">
                      {user?.email}
                    </p>

                    <span
                      className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isSuperAdmin
                          ? "bg-violet-50 text-violet-700"
                          : "bg-indigo-50 text-indigo-700"
                      }`}
                    >
                      {isSuperAdmin
                        ? "Super Administrator"
                        : "Administrator"}
                    </span>
                  </div>

                  {/* MY ACCOUNT */}
                  <Link
                    to="/my-account"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <UserRound size={17} />
                    My Account
                  </Link>

                  {/* STOREFRONT */}
                  <Link
                    to="/"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <Store size={17} />
                    Visit Storefront
                  </Link>

                  <div className="border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut size={17} />
                      Sign Out
                    </button>
                  </div>

                </div>
              </>
            )}

            {/* DESKTOP LOGOUT */}

          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default AdminLayout;
