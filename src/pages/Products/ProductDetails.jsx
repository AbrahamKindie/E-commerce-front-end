
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ShoppingCart,
  Star,
  Minus,
  Plus,
  ArrowLeft,
} from "lucide-react";

import productService from "../../services/productService";
import cartService from "../../services/cartService";
import { useAuth } from "../../context/AuthContext";

// Backend URL
const API_URL = new URL(
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).origin;

const FALLBACK_IMAGE = "https://placehold.co/600x600?text=No+Image";

// Convert relative image paths into complete URLs
const getImageUrl = (image) => {
  if (!image) return FALLBACK_IMAGE;

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return `${API_URL}/${image.replace(/^\/+/, "")}`;
};

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [error, setError] = useState("");
  const [cartError, setCartError] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await productService.getProductById(id);
        const productData = response.data;

        setProduct(productData);
        setSelectedImage(productData.images?.[0] || "");
        setQuantity(1);
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load this product."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const availableStock =
    product?.stockInfo?.available ?? product?.stock ?? 0;

  const hasDiscount = Boolean(product?.hasActiveDiscount);

  const currentPrice = hasDiscount
    ? Number(product?.discountedPrice)
    : Number(product?.price);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: "/cart",
          pendingAddToCart: {
            productId: product.id,
            quantity,
          },
        },
      });

      return;
    }

    try {
      setAddingToCart(true);
      setCartError("");

      await cartService.addToCart(product.id, quantity);

      navigate("/cart");
    } catch (err) {
      setCartError(
        err.response?.data?.message ||
          "Unable to add product to cart."
      );
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-gray-500">Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <p className="mb-5 text-red-600">
          {error || "Product not found."}
        </p>

        <Link
          to="/products"
          className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <Link
        to="/products"
        className="mb-8 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
      >
        <ArrowLeft size={17} />
        Back to Products
      </Link>

      <div className="grid gap-10 md:grid-cols-2">
        {/* Product Images */}
        <div>
          <div className="overflow-hidden rounded-2xl bg-gray-100">
            <img
              src={getImageUrl(selectedImage)}
              alt={product.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK_IMAGE;
              }}
              className="h-[420px] w-full object-contain"
            />
          </div>

          {product.images?.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {product.images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setSelectedImage(image)}
                  className={`overflow-hidden rounded-lg border-2 ${
                    selectedImage === image
                      ? "border-blue-600"
                      : "border-gray-200"
                  }`}
                >
                  <img
                    src={getImageUrl(image)}
                    alt={`${product.name} ${index + 1}`}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        "https://placehold.co/100x100?text=No+Image";
                    }}
                    className="h-20 w-20 object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Information */}
        <div>
          {product.category && (
            <Link
              to={`/categories/${product.categoryId}`}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              {product.category.name}
            </Link>
          )}

          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            {product.name}
          </h1>

          <div className="mt-4 flex items-center gap-2 text-sm">
            <Star
              size={18}
              className="fill-yellow-400 text-yellow-400"
            />

            <span className="font-semibold">
              {Number(product.averageRating || 0).toFixed(1)}
            </span>

            <span className="text-gray-500">
              ({product.totalReviews || 0} reviews)
            </span>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <span className="text-3xl font-bold text-gray-900">
              ${Number.isFinite(currentPrice)
                ? currentPrice.toFixed(2)
                : "0.00"}
            </span>

            {hasDiscount && (
              <span className="text-lg text-gray-400 line-through">
                ${Number(product.price).toFixed(2)}
              </span>
            )}
          </div>

          <div className="mt-5">
            {availableStock > 0 ? (
              <p className="font-medium text-green-600">
                In stock ({availableStock} available)
              </p>
            ) : (
              <p className="font-medium text-red-600">
                Out of stock
              </p>
            )}
          </div>

          {product.description && (
            <div className="mt-7">
              <h2 className="mb-2 text-lg font-semibold">
                Description
              </h2>

              <p className="whitespace-pre-line leading-7 text-gray-600">
                {product.description}
              </p>
            </div>
          )}

          {/* Quantity */}
          <div className="mt-8">
            <label className="mb-2 block text-sm font-semibold">
              Quantity
            </label>

            <div className="flex w-fit items-center rounded-lg border border-gray-300">
              <button
                type="button"
                disabled={quantity <= 1}
                onClick={() =>
                  setQuantity((current) => Math.max(1, current - 1))
                }
                className="p-3 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Minus size={16} />
              </button>

              <span className="min-w-12 text-center font-semibold">
                {quantity}
              </span>

              <button
                type="button"
                disabled={quantity >= availableStock}
                onClick={() =>
                  setQuantity((current) =>
                    Math.min(availableStock, current + 1)
                  )
                }
                className="p-3 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {cartError && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {cartError}
            </p>
          )}

          {/* Add to Cart */}
          <button
            type="button"
            disabled={availableStock <= 0 || addingToCart}
            onClick={handleAddToCart}
            className="mt-7 flex w-full items-center justify-center gap-3 rounded-lg bg-blue-600 px-6 py-4 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            <ShoppingCart size={20} />

            {addingToCart ? "Adding to Cart..." : "Add to Cart"}
          </button>
        </div>
      </div>
    </main>
  );
};

export default ProductDetails;
