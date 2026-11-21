
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  UserRound,
  UserPlus,
  Tag,
  LoaderCircle,
  ChevronDown,
  LogOut,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/cartContext";
import { API_BASE_URL } from "../../services/api";

import NotificationDropdown from "./NotificationDropdown";

import productService from "../../services/productService";
import categoryService from "../../services/categoryService";

// ==========================================
// EXTRACT ARRAYS FROM API RESPONSES
// ==========================================

const getArray = (response) => {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.data)) return response.data;

  if (Array.isArray(response?.data?.products)) {
    return response.data.products;
  }

  if (Array.isArray(response?.products)) {
    return response.products;
  }

  return [];
};

// ==========================================
// PROFILE AVATAR
// ==========================================

const ProfileAvatar = ({ image, name }) => {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [image]);

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-blue-50">
      {image && !imageFailed ? (
        <img
          key={image}
          src={image}
          alt={`${name || "User"} profile`}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <UserRound size={21} className="text-blue-600" />
      )}
    </div>
  );
};

// ==========================================
// SEARCH FORM
// ==========================================

const SearchForm = ({
  search,
  setSearch,
  onSearch,
  products,
  categories,
  loading,
  onSelectProduct,
  onSelectCategory,
  mobile = false,
}) => {
  const showResults = search.trim().length > 0;

  return (
    <form
      onSubmit={onSearch}
      className={`relative ${
        mobile ? "w-full" : "hidden max-w-md flex-1 md:flex"
      }`}
    >
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search products or categories..."
        autoComplete="off"
        className="w-full rounded-full bg-gray-100 py-3 pl-5 pr-12 outline-none focus:ring-2 focus:ring-blue-500"
      />

      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-blue-600 p-2 text-white transition hover:bg-blue-700"
        aria-label="Search"
      >
        <Search size={18} />
      </button>

      {showResults && (
        <div className="absolute left-0 right-0 top-full z-[100] mt-3 max-h-[420px] overflow-y-auto overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
          {products.length > 0 && (
            <div className="p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Products
              </p>

              {products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => onSelectProduct(product)}
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-blue-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <ShoppingBag size={18} className="text-gray-500" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {product.name}
                    </p>

                    {product.price !== undefined && (
                      <p className="text-xs text-gray-500">
                        ETB {Number(product.price).toLocaleString()}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {categories.length > 0 && (
            <div className="border-t border-gray-100 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Categories
              </p>

              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onSelectCategory(category)}
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-blue-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                    <Tag size={18} className="text-blue-600" />
                  </div>

                  <span className="text-sm font-medium text-gray-800">
                    {category.name}
                  </span>
                </button>
              ))}
            </div>
          )}

          {loading && products.length === 0 && (
            <div className="flex items-center justify-center gap-2 p-5 text-gray-500">
              <LoaderCircle size={17} className="animate-spin" />
              <span className="text-sm">Searching...</span>
            </div>
          )}

          {!loading &&
            products.length === 0 &&
            categories.length === 0 && (
              <div className="p-5 text-center text-sm text-gray-500">
                No products or categories found.
              </div>
            )}
        </div>
      )}
    </form>
  );
};

// ==========================================
// NAVBAR
// ==========================================

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const { user, isAuthenticated, logout } = useAuth();

  const { cartItemCount } = useCart();

  // ==========================================
  // USER ROLE INFORMATION
  // ==========================================

  const isAdmin =
    user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isShopOwner = user?.role === "SHOP_OWNER";

  const accountRole = isSuperAdmin
    ? "Super Administrator"
    : isAdmin
      ? "Administrator"
      : isShopOwner
        ? "Shop Owner"
        : "My Account";

  // ==========================================
  // STOREFRONT NAVIGATION
  // ALL AUTHENTICATED ROLES CAN SHOP
  // ==========================================

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Categories", path: "/categories" },
    { name: "Products", path: "/products" },
  ];

  // The storefront is available to all roles.
  const showSearch = true;
  const showAuthenticatedActions = isAuthenticated;

  // ==========================================
  // PROFILE IMAGE URL
  // ==========================================

  const profileImage = user?.profileImage
    ? user.profileImage.startsWith("http")
      ? user.profileImage
      : `${API_BASE_URL}${
          user.profileImage.startsWith("/") ? "" : "/"
        }${user.profileImage}`
    : null;

  // ==========================================
  // LOAD CATEGORIES FOR SEARCH
  // ==========================================

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryService.getCategories();
        setAllCategories(getArray(response));
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };

    loadCategories();
  }, []);

  // ==========================================
  // LIVE PRODUCT SEARCH
  // ==========================================

  useEffect(() => {
    const query = search.trim();

    if (!query) {
      setProducts([]);
      setCategories([]);
      setLoading(false);
      return;
    }

    const matchingCategories = allCategories
      .filter((category) =>
        category.name?.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5);

    setCategories(matchingCategories);

    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        setLoading(true);

        const response = await productService.getProducts({
          search: query,
          page: 1,
          limit: 5,
        });

        const results = getArray(response);

        if (!cancelled) {
          setProducts(results);
        }
      } catch (error) {
        console.error("Product search failed:", error);

        if (!cancelled) {
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, allCategories]);

  // ==========================================
  // CLOSE MENUS
  // ==========================================

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const closeProfileMenu = () => {
    setProfileMenuOpen(false);
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = async () => {
    closeProfileMenu();
    closeMobileMenu();

    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      navigate("/login", { replace: true });
    }
  };

  // ==========================================
  // SEARCH HANDLERS
  // ==========================================

  const handleSearch = (e) => {
    e.preventDefault();

    const query = search.trim();

    if (!query) return;

    const exactCategory = allCategories.find(
      (category) =>
        category.name?.toLowerCase() === query.toLowerCase()
    );

    if (exactCategory) {
      navigate(`/products?categoryId=${exactCategory.id}`);
    } else {
      navigate(`/products?search=${encodeURIComponent(query)}`);
    }

    setSearch("");
    setProducts([]);
    setCategories([]);
    closeMobileMenu();
  };

  const handleSelectProduct = (product) => {
    navigate(`/products/${product.id}`);

    setSearch("");
    setProducts([]);
    setCategories([]);
    closeMobileMenu();
  };

  const handleSelectCategory = (category) => {
    navigate(`/products?categoryId=${category.id}`);

    setSearch("");
    setProducts([]);
    setCategories([]);
    closeMobileMenu();
  };

  // ==========================================
  // SEARCH PROPS
  // ==========================================

  const searchProps = {
    search,
    setSearch,
    onSearch: handleSearch,
    products,
    categories,
    loading,
    onSelectProduct: handleSelectProduct,
    onSelectCategory: handleSelectCategory,
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">

        {/* MAIN NAVBAR */}

        <div className="flex h-20 items-center gap-5">

          {/* LOGO */}

          <Link
            to="/"
            onClick={() => {
              closeMobileMenu();
              closeProfileMenu();
            }}
            className="flex shrink-0 items-center gap-2"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <ShoppingBag className="text-white" size={23} />
            </div>

            <span className="text-2xl font-bold text-gray-900">
              Shop<span className="text-blue-600">Ease</span>
            </span>
          </Link>

          {/* DESKTOP NAVIGATION */}

          <nav className="hidden shrink-0 items-center gap-7 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="whitespace-nowrap font-medium text-gray-600 transition hover:text-blue-600"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* DESKTOP SEARCH */}

          {showSearch && (
            <SearchForm {...searchProps} />
          )}

          {/* RIGHT SIDE ACTIONS */}

          <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-4">

            {/* CART - AVAILABLE TO ALL VISITORS AND ROLES */}

            <Link
              to="/cart"
              className="relative flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-gray-700 transition hover:border-blue-100 hover:bg-blue-50 hover:text-blue-600 sm:px-4"
            >
              <div className="relative">
                <ShoppingBag size={21} />

                {cartItemCount > 0 && (
                  <span className="absolute -right-2.5 -top-2.5 flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold text-white">
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </span>
                )}
              </div>

              <span className="hidden text-sm font-semibold sm:inline">
                Cart
              </span>
            </Link>

            {/* AUTHENTICATED ACCOUNT */}

            {showAuthenticatedActions ? (
              <div
                className="relative"
                onMouseEnter={() => setProfileMenuOpen(true)}
                onMouseLeave={() => setProfileMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={() =>
                    setProfileMenuOpen((previous) => !previous)
                  }
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="true"
                  className="group flex items-center gap-2 rounded-xl border border-transparent px-2 py-2 transition hover:border-blue-100 hover:bg-blue-50/60 sm:gap-3 sm:px-3"
                >
                  <ProfileAvatar
                    image={profileImage}
                    name={user?.name}
                  />

                  <div className="hidden min-w-0 flex-col text-left sm:flex">
                    <span className="text-xs font-medium text-gray-400">
                      Welcome back
                    </span>

                    <span className="max-w-36 truncate text-sm font-bold text-gray-800 transition group-hover:text-blue-600">
                      {user?.name || "My Account"}
                    </span>

                    <span className="text-[10px] text-gray-400">
                      {accountRole}
                    </span>
                  </div>

                  <ChevronDown
                    size={16}
                    className={`hidden text-gray-400 transition-transform sm:block ${
                      profileMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* ACCOUNT DROPDOWN */}

                {profileMenuOpen && (
                  <div className="absolute right-0 top-full z-[100] w-64 pt-2">
                    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white py-2 shadow-xl">

                      <div className="border-b border-gray-100 px-4 py-3">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {user?.name || "User"}
                        </p>

                        <p className="truncate text-xs text-gray-500">
                          {user?.email || ""}
                        </p>

                        <span className="mt-2 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          {accountRole}
                        </span>
                      </div>

                      <Link
                        to="/my-account"
                        onClick={closeProfileMenu}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-blue-50 hover:text-blue-600"
                      >
                        <UserRound size={18} />
                        My Account
                      </Link>

                      <div className="my-1 border-t border-gray-100" />

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                      >
                        <LogOut size={18} />
                        Sign Out
                      </button>

                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden items-center gap-2 text-gray-700 transition hover:text-blue-600 sm:flex"
                >
                  <UserRound size={21} />
                  <span className="font-medium">Login</span>
                </Link>

                <Link
                  to="/register"
                  className="hidden items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-white transition hover:bg-blue-700 sm:flex"
                >
                  <UserPlus size={19} />
                  <span className="font-medium">Register</span>
                </Link>
              </>
            )}

            {/* NOTIFICATIONS */}

            {showAuthenticatedActions && (
              <NotificationDropdown />
            )}

          </div>

          {/* MOBILE MENU BUTTON */}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((previous) => !previous)}
            className="shrink-0 p-2 text-gray-700 transition hover:text-blue-600 lg:hidden"
            aria-label="Toggle navigation"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X size={25} />
            ) : (
              <Menu size={25} />
            )}
          </button>
        </div>

        {/* MOBILE NAVIGATION */}

        {mobileMenuOpen && (
          <div className="space-y-5 border-t border-gray-100 py-5 lg:hidden">

            {/* MOBILE SEARCH */}

            {showSearch && (
              <SearchForm mobile {...searchProps} />
            )}

            {/* MOBILE NAVIGATION LINKS */}

            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={closeMobileMenu}
                  className="font-medium text-gray-700 transition hover:text-blue-600"
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* MOBILE CART */}

            <Link
              to="/cart"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 text-gray-700 transition hover:bg-blue-50 hover:text-blue-600"
            >
              <ShoppingBag size={21} />

              <span className="flex-1 text-sm font-semibold">
                Shopping Cart
              </span>

              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-100 px-2 text-xs font-bold text-blue-700">
                {cartItemCount > 99 ? "99+" : cartItemCount}
              </span>
            </Link>

            {/* MOBILE ACCOUNT ACTIONS */}

            <div className="flex flex-col gap-3 border-t border-gray-100 pt-5">

              {showAuthenticatedActions ? (
                <>
                  <Link
                    to="/my-account"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 transition hover:bg-blue-50"
                  >
                    <ProfileAvatar
                      image={profileImage}
                      name={user?.name}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-gray-800">
                        {user?.name || "My Account"}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {accountRole}
                      </p>
                    </div>

                    <UserRound
                      size={18}
                      className="text-gray-400"
                    />
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut size={19} />
                    Sign Out
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
