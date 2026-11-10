
import { Link } from "react-router-dom";
import { ShoppingBag, ShieldCheck, Truck, Headphones } from "lucide-react";

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">

      {/* Left promotional panel */}
      <div className="hidden lg:flex relative bg-blue-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950" />

        <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between w-full p-12 xl:p-16">
          <Link to="/" className="text-3xl font-extrabold">
            Shop<span className="text-orange-400">Ease</span>
          </Link>

          <div className="max-w-lg">
            <span className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm">
              <ShoppingBag size={16} />
              Welcome to ShopEase
            </span>

            <h1 className="text-5xl xl:text-6xl font-extrabold leading-tight mt-8">
              Shopping made
              <span className="block text-orange-400">simple.</span>
            </h1>

            <p className="text-blue-100 leading-8 mt-6">
              Discover quality products, explore exciting collections,
              and enjoy a better shopping experience with ShopEase.
            </p>

            <div className="mt-12 space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-white/10 p-3 rounded-xl">
                  <ShieldCheck size={23} />
                </div>
                <div>
                  <p className="font-semibold">Secure Shopping</p>
                  <p className="text-sm text-blue-200">
                    Your account and information matter.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-white/10 p-3 rounded-xl">
                  <Truck size={23} />
                </div>
                <div>
                  <p className="font-semibold">Convenient Delivery</p>
                  <p className="text-sm text-blue-200">
                    Shop your favorite products with ease.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-white/10 p-3 rounded-xl">
                  <Headphones size={23} />
                </div>
                <div>
                  <p className="font-semibold">Customer Support</p>
                  <p className="text-sm text-blue-200">
                    We're here whenever you need us.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-blue-200">
            © {new Date().getFullYear()} ShopEase. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right authentication panel */}
      <div className="flex flex-col min-h-screen">
        <div className="lg:hidden px-6 py-5 border-b">
          <Link to="/" className="text-2xl font-extrabold text-blue-700">
            Shop<span className="text-orange-500">Ease</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-5 py-10 sm:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <p className="text-orange-500 text-xs font-bold uppercase tracking-widest">
                ShopEase Account
              </p>

              <h2 className="text-3xl font-extrabold text-gray-900 mt-3">
                {title}
              </h2>

              <p className="text-gray-500 mt-2 text-sm leading-6">
                {subtitle}
              </p>
            </div>

            {children}
          </div>
        </div>

        <div className="text-center text-xs text-gray-400 px-5 py-5">
          By continuing, you agree to our{" "}
          <Link to="/terms" className="text-blue-700 hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="text-blue-700 hover:underline">
            Privacy Policy
          </Link>.
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
