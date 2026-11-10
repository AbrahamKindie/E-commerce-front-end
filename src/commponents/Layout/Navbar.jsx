
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  UserRound,
  LogOut,
  UserPlus,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState("");

  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const handleSearch = (e) => {
    e.preventDefault();

    if (!search.trim()) return;

    navigate(`/products?search=${encodeURIComponent(search.trim())}`);

    setSearch("");
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setMobileMenuOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Categories", path: "/categories" },
    { name: "Products", path: "/products" },
  ];

  const SearchForm = ({ mobile = false }) => (
    <form
      onSubmit={handleSearch}
      className={`relative ${mobile ? "w-full" : "hidden md:flex flex-1 max-w-md"}`}
    >
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search products..."
        className="w-full bg-gray-100 rounded-full py-3 pl-5 pr-12 outline-none focus:ring-2 focus:ring-blue-500"
      />

      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition"
        aria-label="Search products"
      >
        <Search size={18} />
      </button>
    </form>
  );

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main Navbar */}
        <div className="h-20 flex items-center justify-between gap-6">

          {/* Logo */}
          <Link
            to="/"
            onClick={closeMobileMenu}
            className="flex items-center gap-2 shrink-0"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <ShoppingBag className="text-white" size={23} />
            </div>

            <span className="text-2xl font-bold text-gray-900">
              Shop<span className="text-blue-600">Ease</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-gray-600 font-medium hover:text-blue-600 transition"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Search */}
          <SearchForm />

          {/* Desktop Account and Cart */}
          <div className="hidden md:flex items-center gap-5">

            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 text-gray-700">
                  <UserRound size={21} />
                  <span className="font-medium">
                    Hi, {user?.name || "Customer"}
                  </span>
                </div>

                <Link
                  to="/cart"
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition"
                >
                  <ShoppingBag size={23} />
                  <span className="font-medium">Cart</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition"
                >
                  <UserRound size={21} />
                  <span className="font-medium">Login</span>
                </Link>

                <Link
                  to="/register"
                  className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-full hover:bg-blue-700 transition"
                >
                  <UserPlus size={19} />
                  <span className="font-medium">Register</span>
                </Link>
              </>
            )}

          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-gray-700 p-2"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X size={25} /> : <Menu size={25} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 py-5 space-y-5">

            <SearchForm mobile />

            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={closeMobileMenu}
                  className="text-gray-700 font-medium hover:text-blue-600"
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            <div className="border-t border-gray-100 pt-4 flex flex-col gap-4">

              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-2 text-gray-700">
                    <UserRound size={20} />
                    Hi, {user?.name || "Customer"}
                  </div>

                  <Link
                    to="/cart"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-2 text-gray-700"
                  >
                    <ShoppingBag size={20} />
                    Shopping Cart
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-red-600 text-left"
                  >
                    <LogOut size={20} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-2 text-gray-700"
                  >
                    <UserRound size={20} />
                    Login
                  </Link>

                  <Link
                    to="/register"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-2 text-blue-600"
                  >
                    <UserPlus size={20} />
                    Register
                  </Link>
                </>
              )}

            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
