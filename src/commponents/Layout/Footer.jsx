
import { Link } from "react-router-dom";
import {
  Mail,
  MapPin,
  ArrowRight,
  Headphones,
  MessageCircle,
} from "lucide-react";

const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || "";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-950 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* BRAND */}
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-2xl font-bold text-white"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                S
              </span>
              ShopEase
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-6 text-gray-400">
              Your one-stop destination for quality products from trusted
              shops. Shop with confidence and enjoy a better shopping
              experience.
            </p>

            <Link
              to="/help-center"
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-blue-400 transition hover:text-blue-300"
            >
              <Headphones size={17} />
              We're here to help
            </Link>
          </div>

          {/* SHOP */}
          <div>
            <h3 className="mb-4 text-base font-semibold text-white">
              Shop
            </h3>

            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/products" className="transition hover:text-blue-400">
                  All Products
                </Link>
              </li>

              <li>
                <Link to="/categories" className="transition hover:text-blue-400">
                  Categories
                </Link>
              </li>

              <li>
                <Link to="/cart" className="transition hover:text-blue-400">
                  Shopping Cart
                </Link>
              </li>

              <li>
                <Link
                  to="/my-account/orders"
                  className="transition hover:text-blue-400"
                >
                  My Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* CUSTOMER SUPPORT */}
          <div>
            <h3 className="mb-4 text-base font-semibold text-white">
              Customer Support
            </h3>

            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  to="/help-center"
                  className="transition hover:text-blue-400"
                >
                  Help Center
                </Link>
              </li>

              <li>
                <Link to="/faq" className="transition hover:text-blue-400">
                  Frequently Asked Questions
                </Link>
              </li>

              <li>
                <Link
                  to="/help-center"
                  className="transition hover:text-blue-400"
                >
                  Contact Us
                </Link>
              </li>

              <li>
                <Link to="/returns" className="transition hover:text-blue-400">
                  Returns & Refunds
                </Link>
              </li>
            </ul>
          </div>

          {/* CONTACT */}
          <div>
            <h3 className="mb-4 text-base font-semibold text-white">
              Get in Touch
            </h3>

            <ul className="space-y-4 text-sm">
              {SUPPORT_EMAIL && (
                <li className="flex items-start gap-3">
                  <Mail
                    size={18}
                    className="mt-0.5 shrink-0 text-blue-400"
                  />

                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="break-all transition hover:text-blue-400"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                </li>
              )}

              <li className="flex items-start gap-3">
                <MapPin
                  size={18}
                  className="mt-0.5 shrink-0 text-blue-400"
                />

                <span>Addis Ababa, Ethiopia</span>
              </li>
            </ul>

            <Link
              to="/help-center"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
            >
              <MessageCircle size={17} />
              Visit Help Center
              <ArrowRight size={16} />
            </Link>

            <p className="mt-3 text-xs leading-5 text-gray-500">
              Need assistance? Visit our Help Center to find answers or
              contact our support team.
            </p>
          </div>
        </div>

        {/* BOTTOM FOOTER */}
        <div className="mt-12 border-t border-gray-800 pt-6">
          <div className="flex flex-col items-center justify-between gap-3 text-center text-sm text-gray-500 sm:flex-row sm:text-left">
            <p>
              © {year} ShopEase. All rights reserved.
            </p>

            <div className="flex flex-wrap justify-center gap-5">
              <Link to="/about" className="transition hover:text-blue-400">
                About Us
              </Link>

              <Link
                to="/help-center"
                className="transition hover:text-blue-400"
              >
                Contact Us
              </Link>

              <Link to="/faq" className="transition hover:text-blue-400">
                FAQ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
