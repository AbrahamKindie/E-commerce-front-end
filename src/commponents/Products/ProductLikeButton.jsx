
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import productInteractionService from "../../services/productInteractionService";

const ProductLikeButton = ({
  productId,
  showCount = true,
  size = "md",
}) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isLiked, setIsLiked] = useState(false);
  const [totalLikes, setTotalLikes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const sizes = {
    sm: {
      button: "p-2",
      icon: 17,
      text: "text-xs",
    },
    md: {
      button: "px-3 py-2",
      icon: 19,
      text: "text-sm",
    },
    lg: {
      button: "px-4 py-3",
      icon: 22,
      text: "text-base",
    },
  };

  const selectedSize = sizes[size] || sizes.md;

  // Normalize API response
  const getResponseData = (response) => {
    let data = response?.data || response;

    if (data?.data) {
      data = data.data;
    }

    return data;
  };

  // ==========================================
  // FETCH PRODUCT LIKES
  // ==========================================

  useEffect(() => {
    let isMounted = true;

    const fetchLikes = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await productInteractionService.getProductLikes(productId);

        if (!isMounted) return;

        const data = getResponseData(response);

        setIsLiked(Boolean(data.isLiked));
        setTotalLikes(Number(data.totalLikes) || 0);
      } catch (err) {
        if (isMounted) {
          console.error("Failed to fetch product likes:", err);
          setError("Unable to load likes.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (productId) {
      fetchLikes();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [productId, isAuthenticated]);

  // ==========================================
  // LIKE / UNLIKE PRODUCT
  // ==========================================

  const handleLike = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: window.location.pathname,
        },
      });

      return;
    }

    if (processing || loading || !productId) return;

    const previousLiked = isLiked;
    const previousCount = totalLikes;

    setProcessing(true);
    setError("");

    // Optimistic update
    setIsLiked(!previousLiked);
    setTotalLikes(
      Math.max(0, previousCount + (previousLiked ? -1 : 1))
    );

    try {
      const response = previousLiked
        ? await productInteractionService.unlikeProduct(productId)
        : await productInteractionService.likeProduct(productId);

      const data = getResponseData(response);

      if (typeof data.isLiked === "boolean") {
        setIsLiked(data.isLiked);
      }

      if (data.totalLikes !== undefined) {
        setTotalLikes(Number(data.totalLikes) || 0);
      }
    } catch (err) {
      // Restore previous state if request fails
      setIsLiked(previousLiked);
      setTotalLikes(previousCount);

      setError(
        err.response?.data?.message ||
          "Unable to update like. Please try again."
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-start">
      <button
        type="button"
        onClick={handleLike}
        disabled={loading || processing}
        aria-label={isLiked ? "Unlike product" : "Like product"}
        aria-pressed={isLiked}
        title={isLiked ? "Unlike product" : "Like product"}
        className={`inline-flex items-center justify-center gap-2 rounded-full border shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
          selectedSize.button
        } ${
          isLiked
            ? "border-red-200 bg-red-50 text-red-600"
            : "border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:text-red-600"
        }`}
      >
        <Heart
          size={selectedSize.icon}
          className={isLiked ? "fill-current" : ""}
        />

        {showCount && (
          <span className={`font-medium ${selectedSize.text}`}>
            {loading ? "..." : totalLikes}
          </span>
        )}
      </button>

      {error && (
        <p className="mt-1 max-w-40 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

export default ProductLikeButton;
