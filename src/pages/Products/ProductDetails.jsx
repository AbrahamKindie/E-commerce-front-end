
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  ShoppingCart,
  Star,
  Minus,
  Plus,
  ArrowLeft,
  UserRound,
  Pencil,
  X,
  MessageSquare,
  Check,
  Flag,
} from "lucide-react";

import productService from "../../services/productService";
import cartService from "../../services/cartService";
import reviewService from "../../services/reviewService";

import { useAuth } from "../../context/AuthContext";

import ProductLikeButton from "../../commponents/Products/ProductLikeButton";
import ReportProductModal from "../../commponents/Products/ReportProductModal";

// ==========================================
// IMAGE CONFIGURATION
// ==========================================

const API_URL = new URL(
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).origin;

const FALLBACK_IMAGE = "https://placehold.co/600x600?text=No+Image";

const getImageUrl = (image) => {
  if (!image) return FALLBACK_IMAGE;

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  return `${API_URL}/${image.replace(/^\/+/, "")}`;
};

// ==========================================
// API RESPONSE HELPERS
// ==========================================

const getResponseData = (response) => {
  return (
    response?.data?.data ??
    response?.data ??
    response ??
    null
  );
};

const getResponseSummary = (response) => {
  return (
    response?.summary ??
    response?.data?.summary ??
    null
  );
};

const getResponsePagination = (response) => {
  return (
    response?.pagination ??
    response?.data?.pagination ??
    null
  );
};

// ==========================================
// PRICE FORMATTER
// ==========================================

const formatPrice = (price) => {
  const value = Number(price);

  return `ETB ${
    Number.isFinite(value)
      ? value.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "0.00"
  }`;
};

// ==========================================
// RATING STARS
// ==========================================

const RatingStars = ({
  rating = 0,
  size = 18,
  interactive = false,
  onSelect,
}) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        disabled={!interactive}
        onClick={() => onSelect?.(star)}
        className={
          interactive
            ? "rounded-sm transition hover:scale-110"
            : "cursor-default"
        }
        aria-label={`${star} star${star > 1 ? "s" : ""}`}
      >
        <Star
          size={size}
          className={
            star <= Number(rating || 0)
              ? "fill-yellow-400 text-yellow-400"
              : "fill-transparent text-gray-300"
          }
        />
      </button>
    ))}
  </div>
);

// ==========================================
// PRODUCT DETAILS PAGE
// ==========================================

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { user, isAuthenticated } = useAuth();

  // ==========================================
  // REQUEST TRACKING
  // ==========================================

  const reviewRequestRef = useRef(0);

  // ==========================================
  // PRODUCT STATES
  // ==========================================

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  const [error, setError] = useState("");
  const [cartError, setCartError] = useState("");

  // ==========================================
  // PRODUCT INTERACTION STATES
  // ==========================================

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportMessage, setReportMessage] = useState("");

  // ==========================================
  // REVIEW STATES
  // ==========================================

  const [reviews, setReviews] = useState([]);
  const [ownReview, setOwnReview] = useState(null);

  const [reviewSummary, setReviewSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
  });

  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");

  const [reviewPage, setReviewPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ==========================================
  // REVIEW FORM STATES
  // ==========================================

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const [submittingReview, setSubmittingReview] = useState(false);

  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");

  const [editingReview, setEditingReview] = useState(null);

  // ==========================================
  // FETCH PRODUCT DETAILS
  // ==========================================

  useEffect(() => {
    let isMounted = true;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");
        setProduct(null);
        setSelectedImage("");
        setQuantity(1);
        setCartError("");
        setReportMessage("");

        const response = await productService.getProductById(id);

        // Supports both an Axios response and a service response.
        const productData = getResponseData(response);

        if (!isMounted) return;

        if (!productData || !productData.id) {
          setError("Product not found.");
          setProduct(null);
          return;
        }

        setProduct(productData);
        setSelectedImage(productData.images?.[0] || "");
      } catch (err) {
        if (!isMounted) return;

        setError(
          err.response?.data?.message ||
            "Unable to load this product."
        );

        setProduct(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProduct();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // ==========================================
  // FETCH PRODUCT REVIEWS
  // ==========================================

  const fetchReviews = useCallback(
    async (
      page = 1,
      append = false,
      requestId = reviewRequestRef.current
    ) => {
      try {
        setReviewsLoading(true);
        setReviewsError("");

        const response = await reviewService.getProductReviews(
          id,
          page,
          10
        );

        if (requestId !== reviewRequestRef.current) return;

        const responseData = getResponseData(response);

        const newReviews = Array.isArray(responseData)
          ? responseData
          : Array.isArray(responseData?.reviews)
            ? responseData.reviews
            : [];

        if (append) {
          setReviews((previous) => [
            ...previous,
            ...newReviews,
          ]);
        } else {
          setReviews(newReviews);
        }

        const summary = getResponseSummary(response);

        if (summary) {
          setReviewSummary({
            averageRating: Number(summary.averageRating || 0),
            totalReviews: Number(summary.totalReviews || 0),
            ratingDistribution: {
              1: Number(summary.ratingDistribution?.[1] || 0),
              2: Number(summary.ratingDistribution?.[2] || 0),
              3: Number(summary.ratingDistribution?.[3] || 0),
              4: Number(summary.ratingDistribution?.[4] || 0),
              5: Number(summary.ratingDistribution?.[5] || 0),
            },
          });
        } else if (!append) {
          setReviewSummary({
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: {
              1: 0,
              2: 0,
              3: 0,
              4: 0,
              5: 0,
            },
          });
        }

        const pagination = getResponsePagination(response);

        setReviewPage(Number(pagination?.page || page));
        setTotalPages(Number(pagination?.totalPages || 1));
      } catch (err) {
        if (requestId !== reviewRequestRef.current) return;

        setReviewsError(
          err.response?.data?.message ||
            "Unable to load product reviews."
        );
      } finally {
        if (requestId === reviewRequestRef.current) {
          setReviewsLoading(false);
        }
      }
    },
    [id]
  );

  // ==========================================
  // FETCH CUSTOMER'S EXISTING REVIEW
  // ==========================================

  const fetchOwnReview = useCallback(
    async (requestId = reviewRequestRef.current) => {
      if (!isAuthenticated || !user?.id) {
        if (requestId === reviewRequestRef.current) {
          setOwnReview(null);
        }

        return;
      }

      try {
        const firstResponse =
          await reviewService.getProductReviews(id, 1, 100);

        if (requestId !== reviewRequestRef.current) return;

        const firstResponseData = getResponseData(firstResponse);

        const firstReviews = Array.isArray(firstResponseData)
          ? firstResponseData
          : Array.isArray(firstResponseData?.reviews)
            ? firstResponseData.reviews
            : [];

        const findOwnReview = (reviewList) =>
          reviewList.find(
            (review) =>
              String(review.user?.id ?? review.userId) ===
              String(user.id)
          );

        const existingReview = findOwnReview(firstReviews);

        if (existingReview) {
          setOwnReview(existingReview);
          return;
        }

        const pagination = getResponsePagination(firstResponse);
        const pages = Number(pagination?.totalPages || 1);

        for (let page = 2; page <= pages; page++) {
          const response =
            await reviewService.getProductReviews(id, page, 100);

          if (requestId !== reviewRequestRef.current) return;

          const responseData = getResponseData(response);

          const pageReviews = Array.isArray(responseData)
            ? responseData
            : Array.isArray(responseData?.reviews)
              ? responseData.reviews
              : [];

          const foundReview = findOwnReview(pageReviews);

          if (foundReview) {
            setOwnReview(foundReview);
            return;
          }
        }

        if (requestId === reviewRequestRef.current) {
          setOwnReview(null);
        }
      } catch {
        // Keep the main review list functional if this check fails.
      }
    },
    [id, isAuthenticated, user?.id]
  );

  // ==========================================
  // LOAD REVIEWS WHEN PRODUCT OR USER CHANGES
  // ==========================================

  useEffect(() => {
    const requestId = ++reviewRequestRef.current;

    setReviews([]);
    setOwnReview(null);
    setReviewPage(1);
    setTotalPages(1);

    setReviewSummary({
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
    });

    setEditingReview(null);
    setRating(5);
    setComment("");
    setReviewMessage("");
    setReviewError("");
    setReviewsError("");

    fetchReviews(1, false, requestId);
    fetchOwnReview(requestId);

    return () => {
      if (reviewRequestRef.current === requestId) {
        reviewRequestRef.current += 1;
      }
    };
  }, [
    id,
    user?.id,
    isAuthenticated,
    fetchReviews,
    fetchOwnReview,
  ]);

  // ==========================================
  // PRODUCT INFORMATION
  // ==========================================

  const availableStock = Math.max(
    0,
    Number(
      product?.stockInfo?.available ??
        product?.stock ??
        0
    )
  );

  const originalPrice = Number(product?.price);

  const discountedPrice = Number(product?.discountedPrice);

  const hasDiscount =
    Boolean(product?.hasActiveDiscount) &&
    Number.isFinite(originalPrice) &&
    Number.isFinite(discountedPrice) &&
    discountedPrice >= 0;

  const currentPrice = hasDiscount
    ? discountedPrice
    : originalPrice;

  // ==========================================
  // ADD TO CART
  // ==========================================

  const handleAddToCart = async () => {
    if (!product || availableStock <= 0) return;

    if (quantity > availableStock) {
      setCartError(
        `Only ${availableStock} item(s) are currently available.`
      );
      return;
    }

    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: `/products/${id}`,
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

  // ==========================================
  // REPORT PRODUCT
  // ==========================================

  const handleReportProduct = () => {
    if (!isAuthenticated) {
      navigate("/login", {
        state: { from: `/products/${id}` },
      });

      return;
    }

    setReportMessage("");
    setShowReportModal(true);
  };

  const handleReportSuccess = () => {
    setShowReportModal(false);

    setReportMessage(
      "Your report was submitted successfully. Thank you for helping keep our marketplace safe."
    );
  };

  // ==========================================
  // RESET REVIEW FORM
  // ==========================================

  const resetReviewForm = () => {
    setRating(5);
    setComment("");
    setEditingReview(null);
    setReviewError("");
  };

  // ==========================================
  // EDIT OWN REVIEW
  // ==========================================

  const handleEditReview = (review) => {
    setEditingReview(review);
    setRating(Number(review.rating) || 5);
    setComment(review.comment || "");
    setReviewError("");
    setReviewMessage("");

    setTimeout(() => {
      document
        .getElementById(`edit-review-${review.id}`)
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 100);
  };

  // ==========================================
  // CREATE REVIEW
  // ==========================================

  const handleCreateReview = async (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      navigate("/login", {
        state: { from: `/products/${id}` },
      });

      return;
    }

    if (!comment.trim()) {
      setReviewError("Please enter your review comment.");
      return;
    }

    try {
      setSubmittingReview(true);
      setReviewError("");
      setReviewMessage("");

      const response = await reviewService.createReview(id, {
        rating,
        comment: comment.trim(),
      });

      const createdReview = getResponseData(response);

      if (!createdReview?.id) {
        throw new Error("The review response was invalid.");
      }

      setOwnReview(createdReview);

      setReviews((previous) => [
        createdReview,
        ...previous.filter(
          (review) => review.id !== createdReview.id
        ),
      ]);

      resetReviewForm();

      setReviewMessage("Your review was submitted successfully.");

      await fetchReviews(1);
    } catch (err) {
      setReviewError(
        err.response?.data?.message ||
          err.message ||
          "Unable to submit your review. Please try again."
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  // ==========================================
  // UPDATE REVIEW
  // ==========================================

  const handleUpdateReview = async (event) => {
    event.preventDefault();

    if (!editingReview) return;

    if (!comment.trim()) {
      setReviewError("Please enter your review comment.");
      return;
    }

    try {
      setSubmittingReview(true);
      setReviewError("");
      setReviewMessage("");

      const response = await reviewService.updateReview(
        editingReview.id,
        {
          rating,
          comment: comment.trim(),
        }
      );

      const updatedReview = getResponseData(response);

      if (!updatedReview?.id) {
        throw new Error("The review response was invalid.");
      }

      setOwnReview(updatedReview);

      setReviews((previous) =>
        previous.map((review) =>
          review.id === updatedReview.id
            ? updatedReview
            : review
        )
      );

      resetReviewForm();

      setReviewMessage("Your review was updated successfully.");

      await fetchReviews(1);
    } catch (err) {
      setReviewError(
        err.response?.data?.message ||
          err.message ||
          "Unable to update your review. Please try again."
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  // ==========================================
  // LOAD MORE REVIEWS
  // ==========================================

  const handleLoadMore = () => {
    if (reviewPage < totalPages && !reviewsLoading) {
      fetchReviews(reviewPage + 1, true);
    }
  };

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-gray-500">Loading product...</p>
      </div>
    );
  }

  // ==========================================
  // ERROR STATE
  // ==========================================

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

  // ==========================================
  // MAIN UI
  // ==========================================

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

        {/* PRODUCT IMAGES */}

        <div>
          <div className="overflow-hidden rounded-2xl bg-gray-100">
            <img
              src={getImageUrl(selectedImage)}
              alt={product.name}
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = FALLBACK_IMAGE;
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
                  aria-label={`View product image ${index + 1}`}
                  className={`overflow-hidden rounded-lg border-2 ${
                    selectedImage === image
                      ? "border-blue-600"
                      : "border-gray-200"
                  }`}
                >
                  <img
                    src={getImageUrl(image)}
                    alt={`${product.name} ${index + 1}`}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = FALLBACK_IMAGE;
                    }}
                    className="h-20 w-20 object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PRODUCT DETAILS */}

        <div>

          {/* PRODUCT CATEGORY */}

          {product.productCategory && (
            <Link
              to={`/products?categoryId=${encodeURIComponent(
                product.productCategoryId
              )}`}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              {product.productCategory.name}
            </Link>
          )}

          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            {product.name}
          </h1>

          {/* SHOP INFORMATION */}

          {product.shop && (
            <p className="mt-2 text-sm text-gray-500">
              Sold by{" "}
              <span className="font-semibold text-gray-700">
                {product.shop.name}
              </span>
            </p>
          )}

          {/* LIKE AND REPORT ACTIONS */}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <ProductLikeButton productId={product.id} />

            <button
              type="button"
              onClick={handleReportProduct}
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
            >
              <Flag size={18} />
              Report Product
            </button>
          </div>

          {reportMessage && (
            <p
              role="status"
              className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-700"
            >
              {reportMessage}
            </p>
          )}

          {/* RATING */}

          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
            <RatingStars
              rating={reviewSummary.averageRating}
              size={18}
            />

            <span className="font-semibold">
              {Number(reviewSummary.averageRating || 0).toFixed(1)}
            </span>

            <a
              href="#reviews"
              className="text-gray-500 hover:text-blue-600"
            >
              ({reviewSummary.totalReviews || 0} reviews)
            </a>
          </div>

          {/* PRICE */}

          <div className="mt-6 flex items-center gap-3">
            <span className="text-3xl font-bold text-gray-900">
              {formatPrice(currentPrice)}
            </span>

            {hasDiscount && (
              <span className="text-lg text-gray-400 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>

          {/* STOCK */}

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

          {/* DESCRIPTION */}

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

          {/* QUANTITY */}

          <div className="mt-8">
            <label className="mb-2 block text-sm font-semibold">
              Quantity
            </label>

            <div className="flex w-fit items-center rounded-lg border border-gray-300">
              <button
                type="button"
                disabled={quantity <= 1}
                onClick={() =>
                  setQuantity((current) =>
                    Math.max(1, current - 1)
                  )
                }
                aria-label="Decrease quantity"
                className="p-3 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Minus size={16} />
              </button>

              <span className="min-w-12 text-center font-semibold">
                {quantity}
              </span>

              <button
                type="button"
                disabled={
                  quantity >= availableStock ||
                  availableStock <= 0
                }
                onClick={() =>
                  setQuantity((current) =>
                    Math.min(availableStock, current + 1)
                  )
                }
                aria-label="Increase quantity"
                className="p-3 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* CART ERROR */}

          {cartError && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {cartError}
            </p>
          )}

          {/* ADD TO CART */}

          <button
            type="button"
            disabled={availableStock <= 0 || addingToCart}
            onClick={handleAddToCart}
            className="mt-7 flex w-full items-center justify-center gap-3 rounded-lg bg-blue-600 px-6 py-4 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            <ShoppingCart size={20} />

            {addingToCart
              ? "Adding to Cart..."
              : availableStock <= 0
                ? "Out of Stock"
                : "Add to Cart"}
          </button>
        </div>
      </div>

      {/* ========================================
          PRODUCT REVIEWS
      ======================================== */}

      <section
        id="reviews"
        className="mt-20 border-t border-gray-200 pt-12"
      >
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Customer Reviews
          </h2>

          <p className="mt-2 text-gray-500">
            See what customers think about this product.
          </p>
        </div>

        {reviewMessage && (
          <div
            role="status"
            className="mb-6 flex items-center gap-2 rounded-lg bg-green-50 p-4 text-sm text-green-700"
          >
            <Check size={18} />
            {reviewMessage}
          </div>
        )}

        {/* RATING SUMMARY */}

        <div className="grid gap-8 rounded-2xl border border-gray-200 p-6 md:grid-cols-2">
          <div className="flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-gray-900">
              {Number(reviewSummary.averageRating || 0).toFixed(1)}
            </span>

            <div className="mt-3">
              <RatingStars
                rating={reviewSummary.averageRating}
                size={24}
              />
            </div>

            <p className="mt-3 text-sm text-gray-500">
              Based on {reviewSummary.totalReviews || 0} reviews
            </p>
          </div>

          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((star) => {
              const count =
                reviewSummary.ratingDistribution?.[star] || 0;

              const total = reviewSummary.totalReviews || 0;

              const percentage =
                total > 0 ? (count / total) * 100 : 0;

              return (
                <div
                  key={star}
                  className="flex items-center gap-3"
                >
                  <span className="w-12 text-sm text-gray-600">
                    {star} star
                  </span>

                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-yellow-400"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <span className="w-8 text-right text-sm text-gray-500">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* WRITE REVIEW */}

        {!isAuthenticated ? (
          <div className="mt-10 rounded-2xl border border-gray-200 p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Write a Review
            </h3>

            <div className="rounded-lg bg-gray-50 p-5 text-center">
              <p className="mb-3 text-gray-600">
                Please log in to write a product review.
              </p>

              <Link
                to="/login"
                state={{ from: `/products/${id}` }}
                className="inline-flex rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
              >
                Login to Review
              </Link>
            </div>
          </div>
        ) : !ownReview ? (
          <div className="mt-10 rounded-2xl border border-gray-200 p-6">
            <h3 className="mb-5 text-lg font-semibold text-gray-900">
              Write a Review
            </h3>

            <form onSubmit={handleCreateReview}>
              <label className="mb-3 block text-sm font-medium text-gray-700">
                Your Rating
              </label>

              <RatingStars
                rating={rating}
                size={28}
                interactive
                onSelect={setRating}
              />

              <label
                htmlFor="review-comment"
                className="mb-2 mt-6 block text-sm font-medium text-gray-700"
              >
                Your Comment
              </label>

              <textarea
                id="review-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={4}
                maxLength={1000}
                minLength={3}
                required
                placeholder="Share your experience with this product..."
                className="w-full rounded-lg border border-gray-300 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <div className="mt-1 text-right text-xs text-gray-400">
                {comment.length}/1000 characters
              </div>

              {reviewError && (
                <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {reviewError}
                </p>
              )}

              <button
                type="submit"
                disabled={submittingReview}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <MessageSquare size={17} />

                {submittingReview
                  ? "Submitting..."
                  : "Submit Review"}
              </button>
            </form>
          </div>
        ) : null}

        {/* CUSTOMER FEEDBACK */}

        <div className="mt-12">
          <h3 className="mb-6 text-xl font-bold text-gray-900">
            Customer Feedback ({reviewSummary.totalReviews || 0})
          </h3>

          {reviewsLoading && reviews.length === 0 ? (
            <p className="py-8 text-center text-gray-500">
              Loading reviews...
            </p>
          ) : reviewsError && reviews.length === 0 ? (
            <div className="rounded-lg bg-red-50 p-5 text-center">
              <p className="text-red-600">{reviewsError}</p>

              <button
                type="button"
                onClick={() => fetchReviews(1)}
                className="mt-3 text-sm font-medium text-blue-600 hover:underline"
              >
                Try Again
              </button>
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center">
              <MessageSquare
                size={35}
                className="mx-auto text-gray-400"
              />

              <p className="mt-4 font-medium text-gray-700">
                No reviews yet
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Be the first customer to review this product!
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {reviews.map((review) => {
                const isOwnReview =
                  String(review.user?.id ?? review.userId) ===
                  String(user?.id);

                const isEditing =
                  editingReview?.id === review.id;

                return (
                  <article
                    key={review.id}
                    id={`edit-review-${review.id}`}
                    className="rounded-xl border border-gray-200 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                          <UserRound size={22} />
                        </div>

                        <div>
                          <p className="font-semibold text-gray-900">
                            {review.user?.name || "Customer"}
                          </p>

                          <p className="text-xs text-gray-500">
                            {review.createdAt
                              ? new Date(
                                  review.createdAt
                                ).toLocaleDateString()
                              : ""}
                          </p>
                        </div>
                      </div>

                      {isOwnReview && !isEditing && (
                        <button
                          type="button"
                          onClick={() => handleEditReview(review)}
                          title="Edit your review"
                          aria-label="Edit your review"
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Pencil size={18} />
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <form
                        onSubmit={handleUpdateReview}
                        className="mt-6 border-t border-gray-100 pt-5"
                      >
                        <h4 className="mb-4 font-semibold text-gray-900">
                          Edit Your Review
                        </h4>

                        <label className="mb-3 block text-sm font-medium text-gray-700">
                          Your Rating
                        </label>

                        <RatingStars
                          rating={rating}
                          size={26}
                          interactive
                          onSelect={setRating}
                        />

                        <label
                          htmlFor={`edit-comment-${review.id}`}
                          className="mb-2 mt-5 block text-sm font-medium text-gray-700"
                        >
                          Your Comment
                        </label>

                        <textarea
                          id={`edit-comment-${review.id}`}
                          value={comment}
                          onChange={(event) =>
                            setComment(event.target.value)
                          }
                          rows={4}
                          maxLength={1000}
                          minLength={3}
                          required
                          className="w-full rounded-lg border border-gray-300 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />

                        <div className="mt-1 text-right text-xs text-gray-400">
                          {comment.length}/1000 characters
                        </div>

                        {reviewError && (
                          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                            {reviewError}
                          </p>
                        )}

                        <div className="mt-5 flex flex-wrap gap-3">
                          <button
                            type="submit"
                            disabled={submittingReview}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Check size={16} />

                            {submittingReview
                              ? "Saving..."
                              : "Save Changes"}
                          </button>

                          <button
                            type="button"
                            disabled={submittingReview}
                            onClick={resetReviewForm}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                          >
                            <X size={16} />
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="mt-4">
                          <RatingStars
                            rating={review.rating}
                            size={17}
                          />
                        </div>

                        <p className="mt-3 whitespace-pre-line leading-7 text-gray-600">
                          {review.comment}
                        </p>

                        {review.updatedAt &&
                          review.createdAt &&
                          new Date(review.updatedAt).getTime() !==
                            new Date(review.createdAt).getTime() && (
                            <p className="mt-3 text-xs text-gray-400">
                              Updated{" "}
                              {new Date(
                                review.updatedAt
                              ).toLocaleDateString()}
                            </p>
                          )}
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {reviewPage < totalPages && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={reviewsLoading}
                className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition hover:border-blue-600 hover:text-blue-600 disabled:opacity-50"
              >
                {reviewsLoading
                  ? "Loading..."
                  : "Load More Reviews"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* REPORT PRODUCT MODAL */}

      {showReportModal && (
        <ReportProductModal
          productId={product.id}
          onClose={() => setShowReportModal(false)}
          onSuccess={handleReportSuccess}
        />
      )}
    </main>
  );
};

export default ProductDetails;
