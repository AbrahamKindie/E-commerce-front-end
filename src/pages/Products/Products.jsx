
import { useEffect, useRef, useState } from "react";
import {
  useSearchParams,
  useLocation,
} from "react-router-dom";

import {
  Search,
  SlidersHorizontal,
  LoaderCircle,
} from "lucide-react";

import productService from "../../services/productService";
import categoryService from "../../services/categoryService";
import ProductCard from "../../commponents/Products/ProductCard";

const LIMIT = 12;

// Supports Axios responses and service responses.
const getResponseData = (response) => {
  return response?.data?.data ?? response?.data ?? response ?? [];
};

const getArray = (response) => {
  const data = getResponseData(response);
  return Array.isArray(data) ? data : [];
};

const getPageNumber = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const applyingUrlRef = useRef(false);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || ""
  );

  const [search, setSearch] = useState(
    searchParams.get("search") || ""
  );

  const [categoryId, setCategoryId] = useState(
    searchParams.get("categoryId") || ""
  );

  const [sortBy, setSortBy] = useState(
    searchParams.get("sortBy") || "newest"
  );

  const [page, setPage] = useState(
    getPageNumber(searchParams.get("page"))
  );

  const [totalProducts, setTotalProducts] = useState(0);

  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);

  // ==========================================
  // SYNC FILTERS FROM URL
  // Supports browser Back and Forward navigation.
  // ==========================================

  useEffect(() => {
    applyingUrlRef.current = true;

    const params = new URLSearchParams(location.search);

    const urlSearch = params.get("search") || "";
    const urlCategoryId = params.get("categoryId") || "";
    const urlSortBy = params.get("sortBy") || "newest";
    const urlPage = getPageNumber(params.get("page"));

    setSearchInput(urlSearch);
    setSearch(urlSearch);
    setCategoryId(urlCategoryId);
    setSortBy(urlSortBy);
    setPage(urlPage);
  }, [location.search]);

  // ==========================================
  // SYNC FILTERS TO URL
  // ==========================================

  useEffect(() => {
    // Do not overwrite a URL change coming from Back/Forward.
    if (applyingUrlRef.current) {
      applyingUrlRef.current = false;
      return;
    }

    const nextParams = new URLSearchParams();

    if (search.trim()) {
      nextParams.set("search", search.trim());
    }

    if (categoryId) {
      nextParams.set("categoryId", categoryId);
    }

    if (sortBy !== "newest") {
      nextParams.set("sortBy", sortBy);
    }

    if (page > 1) {
      nextParams.set("page", String(page));
    }

    if (nextParams.toString() !== location.search.replace(/^\?/, "")) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [
    search,
    categoryId,
    sortBy,
    page,
    location.search,
    setSearchParams,
  ]);

  // ==========================================
  // DEBOUNCE SEARCH INPUT
  // ==========================================

  useEffect(() => {
    const timeout = setTimeout(() => {
      const trimmedSearch = searchInput.trim();

      setSearch((current) =>
        current === trimmedSearch ? current : trimmedSearch
      );

      setPage(1);
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  // ==========================================
  // LOAD PRODUCT CATEGORIES
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);

        const response = await categoryService.getCategories();
        const shopCategories = getArray(response);

        const productCategories = shopCategories.flatMap(
          (shopCategory) =>
            (shopCategory.shops || []).flatMap((shop) =>
              (shop.productCategories || []).map(
                (productCategory) => ({
                  ...productCategory,
                  shopName: shop.name,
                  shopCategoryName: shopCategory.name,
                })
              )
            )
        );

        if (!cancelled) {
          setCategories(productCategories);
        }
      } catch (err) {
        console.error(
          "Failed to load product categories:",
          err
        );
      } finally {
        if (!cancelled) {
          setCategoriesLoading(false);
        }
      }
    };

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================
  // LOAD PRODUCTS
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      setLoading(true);
      setError("");

      try {
        const params = {
          page,
          limit: LIMIT,
          sortBy,
        };

        if (search.trim()) {
          params.search = search.trim();
        }

        // This is a ProductCategory ID, not a ShopCategory ID.
        if (categoryId) {
          params.categoryId = categoryId;
        }

        const response = await productService.getProducts(params);

        if (cancelled) return;

        const result = getResponseData(response);

        // Supports both the new paginated response and
        // the previous array response.
        const productList = Array.isArray(result)
          ? result
          : Array.isArray(result?.products)
            ? result.products
            : [];

        const pagination = Array.isArray(result)
          ? null
          : result?.pagination;

        setProducts(productList);

        setTotalProducts(
          Number.isFinite(Number(pagination?.total))
            ? Number(pagination.total)
            : productList.length
        );

        setHasMore(
          typeof pagination?.hasNextPage === "boolean"
            ? pagination.hasNextPage
            : productList.length === LIMIT
        );
      } catch (err) {
        if (cancelled) return;

        console.error("Products loading error:", err);

        setError(
          err.response?.data?.message ||
            "Unable to load products. Please try again."
        );

        setProducts([]);
        setTotalProducts(0);
        setHasMore(false);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [search, categoryId, sortBy, page]);

  // ==========================================
  // FILTER HANDLERS
  // ==========================================

  const handleSearch = (event) => {
    event.preventDefault();

    const trimmedSearch = searchInput.trim();

    setSearch(trimmedSearch);
    setPage(1);
  };

  const handleSearchInputChange = (event) => {
    setSearchInput(event.target.value);
    setPage(1);
  };

  const handleCategoryChange = (event) => {
    setCategoryId(event.target.value);
    setPage(1);
  };

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setCategoryId("");
    setSortBy("newest");
    setPage(1);
  };

  // ==========================================
  // PAGINATION HANDLERS
  // ==========================================

  const handlePreviousPage = () => {
    if (page <= 1 || loading) return;

    setPage((current) => Math.max(1, current - 1));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleNextPage = () => {
    if (!hasMore || loading) return;

    setPage((current) => current + 1);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <main className="min-h-screen bg-gray-50">

      {/* PAGE HEADER */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="mx-auto max-w-7xl px-4 py-14">

          <p className="text-sm font-bold uppercase tracking-widest text-orange-300">
            ShopEase Collection
          </p>

          <h1 className="mt-3 text-3xl font-extrabold md:text-5xl">
            Explore Our Products
          </h1>

          <p className="mt-4 max-w-xl text-blue-100">
            Discover quality products, great prices and exciting
            offers. Find exactly what you need.
          </p>

        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10">

        {/* FILTERS */}
        <div className="mb-8 rounded-xl border border-gray-100 bg-white p-5">

          <div className="mb-5 flex items-center gap-2">
            <SlidersHorizontal
              size={19}
              className="text-blue-700"
            />

            <h2 className="font-bold text-gray-800">
              Search and Filter Products
            </h2>
          </div>

          <form
            onSubmit={handleSearch}
            className="grid grid-cols-1 gap-4 md:grid-cols-4"
          >

            {/* SEARCH */}
            <div className="relative md:col-span-2">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="search"
                value={searchInput}
                onChange={handleSearchInputChange}
                placeholder="Search products..."
                className="w-full rounded-lg border border-gray-200 py-3 pl-11 pr-4 outline-none focus:border-blue-700"
              />
            </div>

            {/* PRODUCT CATEGORY */}
            <select
              value={categoryId}
              onChange={handleCategoryChange}
              disabled={categoriesLoading}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 outline-none focus:border-blue-700 disabled:cursor-wait disabled:bg-gray-100"
            >
              <option value="">
                {categoriesLoading
                  ? "Loading categories..."
                  : "All Product Categories"}
              </option>

              {categories.map((category) => (
                <option
                  key={`${category.id}-${category.shopName}`}
                  value={category.id}
                >
                  {category.name} — {category.shopName}
                </option>
              ))}
            </select>

            {/* SORT */}
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 outline-none focus:border-blue-700"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price_asc">
                Price: Low to High
              </option>
              <option value="price_desc">
                Price: High to Low
              </option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
            </select>

            {/* CLEAR FILTERS */}
            <div className="flex justify-end md:col-span-4">
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-semibold text-red-500 hover:text-red-700"
              >
                Clear Filters
              </button>
            </div>

          </form>
        </div>

        {/* PRODUCT RESULTS HEADER */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              All Products
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {loading
                ? "Loading products..."
                : `${totalProducts} products found`}
            </p>
          </div>

          <span className="text-sm text-gray-500">
            Page {page}
          </span>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-100 bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <LoaderCircle
              size={40}
              className="animate-spin text-blue-700"
            />

            <p className="mt-4 text-gray-500">
              Loading products...
            </p>
          </div>
        ) : products.length === 0 ? (

          /* EMPTY STATE */
          <div className="rounded-xl bg-white p-12 text-center">
            <Search
              size={45}
              className="mx-auto text-gray-300"
            />

            <h3 className="mt-5 text-xl font-bold">
              No Products Found
            </h3>

            <p className="mt-2 text-gray-500">
              Try another search term or change your filters.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-6 rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
            >
              Clear Filters
            </button>
          </div>

        ) : (
          <>
            {/* PRODUCT GRID */}
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>

            {/* PAGINATION */}
            <div className="mt-12 flex items-center justify-center gap-4">
              <button
                type="button"
                disabled={page === 1 || loading}
                onClick={handlePreviousPage}
                className="rounded-lg border border-gray-200 bg-white px-5 py-3 font-semibold text-gray-700 hover:border-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <span className="text-sm font-semibold text-gray-600">
                Page {page}
              </span>

              <button
                type="button"
                disabled={!hasMore || loading}
                onClick={handleNextPage}
                className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </>
        )}

      </div>
    </main>
  );
};

export default Products;
