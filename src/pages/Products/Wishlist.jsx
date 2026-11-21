
import { useCallback, useEffect, useState } from "react";
import { Heart, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

import productInteractionService from "../../services/productInteractionService";
import ProductCard from "../../commponents/Products/ProductCard";

const Wishlist = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // FETCH WISHLIST
  // ==========================================

  const fetchWishlist = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await productInteractionService.getMyLikedProducts({
          page: 1,
          limit: 100,
        });

const result = response.data || response;

setProducts(result.products || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load your wishlist."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // ==========================================
  // REMOVE FROM WISHLIST
  // ==========================================

  const handleRemove = async (productId) => {
    try {
      await productInteractionService.unlikeProduct(productId);

      setProducts((previous) =>
        previous.filter(
          (product) => product.id !== productId
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to remove this product from your wishlist."
      );
    }
  };

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-gray-500">Loading your wishlist...</p>
      </div>
    );
  }

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <main className="mx-auto min-h-[60vh] max-w-7xl px-4 py-10">

      {/* HEADER */}

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Heart
              size={28}
              className="fill-red-500 text-red-500"
            />

            <h1 className="text-3xl font-bold text-gray-900">
              My Wishlist
            </h1>
          </div>

          <p className="mt-2 text-gray-500">
            Products you've saved for later.
          </p>
        </div>

        <span className="rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">
          {products.length} {products.length === 1 ? "Product" : "Products"}
        </span>
      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>

          <button
            type="button"
            onClick={fetchWishlist}
            className="inline-flex items-center gap-2 text-sm font-semibold text-red-700 hover:underline"
          >
            <RefreshCw size={15} />
            Try Again
          </button>
        </div>
      )}

      {/* EMPTY WISHLIST */}

      {products.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-gray-300 px-5 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <Heart
              size={30}
              className="text-red-500"
            />
          </div>

          <h2 className="mt-5 text-xl font-bold text-gray-900">
            Your wishlist is empty
          </h2>

          <p className="mx-auto mt-2 max-w-md text-gray-500">
            You haven't liked any products yet. Explore our
            marketplace and save products you love.
          </p>

          <Link
            to="/products"
            className="mt-6 inline-flex rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Explore Products
          </Link>
        </div>
      ) : (
        /* WISHLIST PRODUCTS */

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <div key={product.id} className="relative">
              <ProductCard product={product} />

              <button
                type="button"
                onClick={() => handleRemove(product.id)}
                title="Remove from wishlist"
                aria-label={`Remove ${product.name} from wishlist`}
                className="absolute right-3 top-3 z-20 rounded-full bg-white p-2 text-red-500 shadow-md transition hover:bg-red-50"
              >
                <Heart
                  size={19}
                  className="fill-current"
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default Wishlist;
