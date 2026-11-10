
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, LoaderCircle } from "lucide-react";

import productService from "../../services/productService";
import categoryService from "../../services/categoryService";
import ProductCard from "../../commponents/Products/ProductCard";

const LIMIT = 12;

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

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
    Math.max(1, Number(searchParams.get("page")) || 1)
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryService.getCategories();
        setCategories(response.data || []);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };

    loadCategories();
  }, []);

  // Load products whenever filters or page changes
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

        if (categoryId) {
          params.categoryId = categoryId;
        }

        const response = await productService.getProducts(params);

        if (cancelled) return;

        const result = response.data || [];

        setProducts(result);
        setHasMore(result.length === LIMIT);

        setSearchParams(
          {
            ...(search.trim() && { search: search.trim() }),
            ...(categoryId && { categoryId }),
            ...(sortBy !== "newest" && { sortBy }),
            ...(page > 1 && { page: String(page) }),
          },
          { replace: true }
        );
      } catch (err) {
        if (cancelled) return;

        console.error("Products loading error:", err);

        setError(
          err.response?.data?.message ||
            "Unable to load products. Please try again."
        );

        setProducts([]);
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
  }, [search, categoryId, sortBy, page, setSearchParams]);

  const handleSearch = (event) => {
    event.preventDefault();
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
    setSearch("");
    setCategoryId("");
    setSortBy("newest");
    setPage(1);
  };

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* PAGE HEADER */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-14">
          <p className="text-orange-300 text-sm font-bold uppercase tracking-widest">
            ShopEase Collection
          </p>

          <h1 className="text-3xl md:text-5xl font-extrabold mt-3">
            Explore Our Products
          </h1>

          <p className="text-blue-100 mt-4 max-w-xl">
            Discover quality products, great prices and exciting offers.
            Find exactly what you need.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* FILTERS */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 mb-8">
          <div className="flex items-center gap-2 mb-5">
            <SlidersHorizontal size={19} className="text-blue-700" />
            <h2 className="font-bold text-gray-800">
              Search and Filter Products
            </h2>
          </div>

          <form
            onSubmit={handleSearch}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            {/* SEARCH */}
            <div className="md:col-span-2 relative">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products..."
                className="w-full border border-gray-200 rounded-lg pl-11 pr-4 py-3 outline-none focus:border-blue-700"
              />
            </div>

            {/* CATEGORY */}
            <select
              value={categoryId}
              onChange={handleCategoryChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-blue-700 bg-white"
            >
              <option value="">All Categories</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* SORT */}
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-blue-700 bg-white"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
            </select>

            <div className="md:col-span-4 flex justify-end">
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-red-500 hover:text-red-700 font-semibold"
              >
                Clear Filters
              </button>
            </div>
          </form>
        </div>

        {/* PRODUCT RESULTS */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              All Products
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {loading
                ? "Loading products..."
                : `${products.length} products on this page`}
            </p>
          </div>

          <span className="text-sm text-gray-500">
            Page {page}
          </span>
        </div>

        {/* ERROR */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-lg mb-6">
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
            <p className="text-gray-500 mt-4">
              Loading products...
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <Search
              size={45}
              className="mx-auto text-gray-300"
            />

            <h3 className="text-xl font-bold mt-5">
              No Products Found
            </h3>

            <p className="text-gray-500 mt-2">
              Try another search term or change your filters.
            </p>

            <button
              onClick={clearFilters}
              className="mt-6 bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>

            {/* PAGINATION */}
            <div className="flex justify-center items-center gap-4 mt-12">
              <button
                disabled={page === 1}
                onClick={() => {
                  setPage((current) => current - 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="px-5 py-3 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:border-blue-700"
              >
                Previous
              </button>

              <span className="text-sm font-semibold text-gray-600">
                Page {page}
              </span>

              <button
                disabled={!hasMore}
                onClick={() => {
                  setPage((current) => current + 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="px-5 py-3 rounded-lg bg-blue-700 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-800"
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
