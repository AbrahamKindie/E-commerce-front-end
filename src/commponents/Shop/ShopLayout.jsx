
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";

import ShopSidebar from "./ShopSidebar";

const ShopLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-[70vh] bg-gray-50">
      {/* Mobile Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Shop Management
          </h2>
          <p className="text-xs text-gray-500">
            Manage your shop and products
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSidebarOpen((prev) => !prev)}
          className="rounded-lg border border-gray-200 p-2 text-gray-700 transition hover:bg-gray-100"
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
          aria-expanded={sidebarOpen}
        >
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div className="relative flex min-h-[70vh]">
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={closeSidebar}
            className="fixed inset-0 top-[65px] z-30 bg-black/40 lg:hidden"
          />
        )}

        {/* Sidebar */}
        <div
          className={`
            fixed bottom-0 left-0 top-[65px] z-40 w-72
            transform bg-white transition-transform duration-300
            lg:sticky lg:top-0 lg:z-10 lg:min-h-[70vh]
            lg:translate-x-0
            ${
              sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full"
            }
          `}
        >
          <ShopSidebar onNavigate={closeSidebar} />
        </div>

        {/* Main Content */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ShopLayout;
