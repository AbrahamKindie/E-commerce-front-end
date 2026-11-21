
import { useEffect, useRef, useState } from "react";
import {
  Link,
  useParams,
  useSearchParams,
} from "react-router-dom";

import {
  ArrowLeft,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Layers,
  RefreshCw,
} from "lucide-react";

import categoryService from "../../services/categoryService";
import ProductCard from "../../commponents/Products/ProductCard";

// ============================================
// CONSTANTS
// ============================================

const PRODUCTS_PER_PAGE = 12;

// ============================================
// CATEGORY DETAILS
// ============================================

const CategoryDetails = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // ============================================
  // STATE
  // ============================================

  const [category, setCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);

  // The frontend URL uses productCategory.
  // The backend currently expects subcategory.

  const [selectedProductCategory, setSelectedProductCategory] =
    useState(() => searchParams.get("productCategory") || "");

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  const categoryScrollRef = useRef(null);

  // ============================================
  // URL FILTER SYNCHRONIZATION
  // ============================================

  useEffect(() => {
    const urlProductCategory =
      searchParams.get("productCategory") || "";

    setSelectedProductCategory((current) =>
      current === urlProductCategory
        ? current
        : urlProductCategory
    );

    setPage(1);
  }, [searchParams]);

  // ============================================
  // FETCH SHOP CATEGORY PRODUCTS
  // ============================================

  useEffect(() => {
    let isMounted = true;

    const fetchCategoryProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await categoryService.getShopCategoryProducts(id, {
            page,
            limit: PRODUCTS_PER_PAGE,
            search,
            sortBy,

            // Keep the existing backend API parameter.
            // The URL parameter is productCategory.
            subcategory: selectedProductCategory,
          });

        // categoryService returns Axios response.data.
        // Expected API response:
        // { success, message, data: result }

        const result = response?.data ?? response;

        if (!result || !Array.isArray(result.products)) {
          throw new Error(
            "Invalid category response from server."
          );
        }

        if (!isMounted) return;

        setCategory(result.category || null);

        setSubcategories(
          Array.isArray(result.subcategories)
            ? result.subcategories
            : []
        );

        setProducts(result.products);

        setPagination(result.pagination || null);
      } catch (err) {
        if (!isMounted) return;

        console.error("Category products error:", err);

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load products in this category."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (id) {
      fetchCategoryProducts();
    } else {
      setError("Invalid shop category.");
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [
    id,
    page,
    search,
    sortBy,
    selectedProductCategory,
    retryKey,
  ]);

  // ============================================
  // PRODUCT CATEGORY SCROLLING
  // ============================================

  const scrollCategories = (direction) => {
    if (!categoryScrollRef.current) return;

    categoryScrollRef.current.scrollBy({
      left: direction === "left" ? -350 : 350,
      behavior: "smooth",
    });
  };

  // ============================================
  // FILTER HANDLERS
  // ============================================

  const handleProductCategoryChange = (productCategory) => {
    setPage(1);
    setSelectedProductCategory(productCategory);

    // Preserve other query parameters if needed.
    const nextParams = new URLSearchParams(searchParams);

    if (productCategory) {
      nextParams.set("productCategory", productCategory);
    } else {
      nextParams.delete("productCategory");
    }

    // Remove legacy parameter from the URL.
    nextParams.delete("subcategory");

    setSearchParams(nextParams);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSelectedProductCategory("");
    setSearch("");
    setSortBy("newest");
    setPage(1);

    // Remove category filters from the URL.
    setSearchParams({});
  };

  const retryFetch = () => {
    setRetryKey((current) => current + 1);
  };

  // ============================================
  // FILTER STATUS
  // ============================================

  const hasFilters =
    Boolean(selectedProductCategory) ||
    Boolean(search) ||
    sortBy !== "newest";

  // ============================================
  // LOADING STATE
  // ============================================

  if (loading && !category) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

          <p className="text-gray-500">
            Loading category...
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================

  if (error && !category) {
    return (
      <div className="py-20 text-center">
        <p className="mb-5 text-red-600">{error}</p>

        <button
          type="button"
          onClick={retryFetch}
          className="mr-3 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
        >
          Try Again
        </button>

        <Link
          to="/categories"
          className="rounded-lg border border-gray-200 px-5 py-3 text-gray-700 hover:bg-gray-50"
        >
          Browse Categories
        </Link>
      </div>
    );
  }

  // ============================================
  // CATEGORY NOT FOUND
  // ============================================

  if (!category) {
    return (
      <div className="py-20 text-center">
        <Layers
          size={45}
          className="mx-auto mb-4 text-gray-300"
        />

        <p className="mb-5 text-gray-600">
          Category not found.
        </p>

        <Link
          to="/categories"
          className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
        >
          Browse Categories
        </Link>
      </div>
    );
  }

  // ============================================
  // MAIN PAGE
  // ============================================

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* BACK NAVIGATION */}

      <Link
        to="/categories"
        className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-blue-600"
      >
        <ArrowLeft size={17} />
        All Categories
      </Link>

      {/* SHOP CATEGORY HEADER */}

      <div className="mb-9 border-b border-gray-200 pb-7">
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
          <Layers size={17} />
          Shop Category
        </div>

        <h1 className="mt-3 text-3xl font-bold text-gray-900 md:text-4xl">
          {category.name}
        </h1>

        {category.description && (
          <p className="mt-3 max-w-2xl leading-7 text-gray-500">
            {category.description}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-5 text-sm text-gray-500">
          <span>
            <strong className="text-gray-900">
              {pagination?.total ?? 0}
            </strong>{" "}
            Products
          </span>

          <span>
            <strong className="text-gray-900">
              {subcategories.length}
            </strong>{" "}
            Product Categories
          </span>
        </div>
      </div>

      {/* PRODUCT CATEGORIES */}

      <section className="mb-10">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
              Explore Collections
            </p>

            <h2 className="mt-1 text-xl font-bold text-gray-900">
              Product Categories
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Filter products by their product category.
            </p>
          </div>

          {subcategories.length > 0 && (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => scrollCategories("left")}
                aria-label="Scroll product categories left"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:border-blue-600 hover:bg-blue-600 hover:text-white"
              >
                <ChevronLeft size={21} />
              </button>

              <button
                type="button"
                onClick={() => scrollCategories("right")}
                aria-label="Scroll product categories right"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:border-blue-600 hover:bg-blue-600 hover:text-white"
              >
                <ChevronRight size={21} />
              </button>
            </div>
          )}
        </div>

        {/* HORIZONTAL CATEGORY FILTERS */}

        <div
          ref={categoryScrollRef}
          className="flex gap-3 overflow-x-auto scroll-smooth pb-4"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {/* ALL PRODUCTS */}

          <button
            type="button"
            onClick={() => handleProductCategoryChange("")}
            className={`flex min-w-[155px] shrink-0 items-center gap-3 rounded-xl border p-4 text-left transition duration-200 ${
              selectedProductCategory === ""
                ? "border-blue-600 bg-blue-50 shadow-sm ring-1 ring-blue-600"
                : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md"
            }`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                selectedProductCategory === ""
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              <Layers size={20} />
            </div>

            <div>
              <p
                className={`text-sm font-bold ${
                  selectedProductCategory === ""
                    ? "text-blue-700"
                    : "text-gray-800"
                }`}
              >
                All Products
              </p>

              <p className="mt-1 text-xs text-gray-400">
                View everything
              </p>
            </div>
          </button>

          {/* PRODUCT CATEGORY BOXES */}

          {subcategories.map((subcategory) => {
            const isSelected =
              selectedProductCategory.toLowerCase() ===
              String(subcategory.name).toLowerCase();

            return (
              <button
                key={subcategory.id ?? subcategory.name}
                type="button"
                onClick={() =>
                  handleProductCategoryChange(subcategory.name)
                }
                title={`Filter by ${subcategory.name}`}
                className={`flex min-w-[175px] max-w-[220px] shrink-0 items-center gap-3 rounded-xl border p-4 text-left transition duration-200 ${
                  isSelected
                    ? "border-blue-600 bg-blue-50 shadow-sm ring-1 ring-blue-600"
                    : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md"
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    isSelected
                      ? "bg-blue-600 text-white"
                      : "bg-orange-50 text-orange-500"
                  }`}
                >
                  <Layers size={19} />
                </div>

                <div className="min-w-0">
                  <p
                    className={`truncate text-sm font-bold ${
                      isSelected
                        ? "text-blue-700"
                        : "text-gray-800"
                    }`}
                  >
                    {subcategory.name}
                  </p>

                  {subcategory.shopCount !== undefined && (
                    <p className="mt-1 text-xs text-gray-400">
                      Available in {subcategory.shopCount}{" "}
                      {Number(subcategory.shopCount) === 1
                        ? "shop"
                        : "shops"}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* EMPTY PRODUCT CATEGORIES */}

        {subcategories.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-8 text-center">
            <Layers
              size={30}
              className="mx-auto text-gray-300"
            />

            <p className="mt-3 text-sm font-medium text-gray-600">
              No product categories available.
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Product categories from active shops will appear here.
            </p>
          </div>
        )}
      </section>

      {/* SEARCH AND SORT */}

      <section className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* SEARCH */}

        <div className="relative w-full sm:max-w-md">
          <Search
            size={19}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search products in this category..."
            className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          {search && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              aria-label="Clear search"
            >
              <X size={17} />
            </button>
          )}
        </div>

        {/* SORT */}

        <div className="flex items-center gap-2">
          <SlidersHorizontal
            size={18}
            className="text-gray-500"
          />

          <label
            htmlFor="sort-products"
            className="whitespace-nowrap text-sm text-gray-600"
          >
            Sort by:
          </label>

          <select
            id="sort-products"
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A to Z</option>
            <option value="name_desc">Name: Z to A</option>
          </select>
        </div>
      </section>

      {/* ACTIVE FILTERS */}

      {hasFilters && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500">
            Active filters:
          </span>

          {selectedProductCategory && (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              {selectedProductCategory}
            </span>
          )}

          {search && (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              Search: {search}
            </span>
          )}

          {sortBy !== "newest" && (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              Sort: {sortBy.replaceAll("_", " ")}
            </span>
          )}

          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-medium text-red-600 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* PRODUCTS */}

      <section>
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-gray-900">
            {selectedProductCategory || "All Products"}
          </h2>

          <span className="text-sm text-gray-500">
            {pagination?.total ?? 0} results
          </span>
        </div>

        {error && (
          <div className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[250px] items-center justify-center">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-gray-200 py-16 text-center">
            <Layers
              size={40}
              className="mx-auto text-gray-300"
            />

            <h3 className="mt-4 text-lg font-semibold text-gray-800">
              No products found
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Try another product category or change your search.
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        )}
      </section>

      {/* PAGINATION */}

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() =>
              setPage((current) => Math.max(1, current - 1))
            }
            disabled={
              !pagination.hasPreviousPage || loading
            }
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={17} />
            Previous
          </button>

          <span className="text-sm text-gray-600">
            Page{" "}
            <strong className="text-gray-900">
              {pagination.page}
            </strong>{" "}
            of{" "}
            <strong className="text-gray-900">
              {pagination.totalPages}
            </strong>
          </span>

          <button
            type="button"
            onClick={() =>
              setPage((current) =>
                Math.min(pagination.totalPages, current + 1)
              )
            }
            disabled={!pagination.hasNextPage || loading}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ChevronRight size={17} />
          </button>
        </div>
      )}

      {/* RETRY ACTION */}

      {error && category && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={retryFetch}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            <RefreshCw size={15} />
            Retry
          </button>
        </div>
      )}
    </main>
  );
};

export default CategoryDetails;
