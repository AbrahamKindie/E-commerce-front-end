
import { Link } from "react-router-dom";
import { Star, Eye } from "lucide-react";

import getImageUrl from "../../utils/imageUrl";
import ProductLikeButton from "./ProductLikeButton";

const ProductCard = ({ product }) => {
  if (!product) return null;

  const hasDiscount = Boolean(product.hasActiveDiscount);

  const originalPrice = Number(product.price);

  const discountedPrice = Number(product.discountedPrice);

  const currentPrice =
    hasDiscount && Number.isFinite(discountedPrice)
      ? discountedPrice
      : originalPrice;

  const image = getImageUrl(product.images?.[0]);

  const rating = Number(product.averageRating || 0);
  const reviews = Number(product.totalReviews || 0);

  const availableStock =
    Number(product.stockInfo?.available ?? product.stock ?? 0);

  const discount = product.discount;

  const formatPrice = (price) => {
    const parsedPrice = Number(price);

    return `ETB ${
      Number.isFinite(parsedPrice)
        ? parsedPrice.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : "0.00"
    }`;
  };

  const getDiscountLabel = () => {
    if (!discount) return "SALE";

    const value = Number(discount.value);

    if (discount.type === "PERCENTAGE" && Number.isFinite(value)) {
      return `${value}% OFF`;
    }

    if (discount.type === "FIXED" && Number.isFinite(value)) {
      return `${formatPrice(value)} OFF`;
    }

    return "SALE";
  };

  return (
    <div className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-lg">

      {/* Product Image */}
      <div className="relative">
        <Link
          to={`/products/${product.id}`}
          className="relative block overflow-hidden bg-gray-100"
        >
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src =
                "https://placehold.co/600x600?text=No+Image";
            }}
          />

          {/* Discount Badge */}
          {hasDiscount && (
            <span className="absolute left-3 top-3 rounded-md bg-red-500 px-3 py-1 text-xs font-semibold text-white">
              {getDiscountLabel()}
            </span>
          )}

          {/* Out of Stock Badge */}
          {availableStock <= 0 && (
            <span className="absolute bottom-3 right-3 rounded-md bg-gray-800 px-3 py-1 text-xs font-semibold text-white">
              Out of stock
            </span>
          )}
        </Link>

        {/* Like Button */}
        <div className="absolute right-3 top-3 z-10">
          <ProductLikeButton
            productId={product.id}
            showCount={false}
            size="sm"
          />
        </div>
      </div>

      {/* Product Information */}
      <div className="p-4">

        {/* Product Category */}
        <p className="mb-1 text-xs text-gray-500">
          {product.productCategory?.name || "Uncategorized"}
        </p>

        {/* Product Name */}
        <Link to={`/products/${product.id}`}>
          <h3 className="line-clamp-2 min-h-12 font-semibold text-gray-800 transition hover:text-blue-600">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="mt-2 flex items-center gap-1 text-sm">
          <Star
            size={15}
            className="fill-yellow-400 text-yellow-400"
          />

          <span className="font-medium">
            {rating.toFixed(1)}
          </span>

          <span className="text-gray-500">
            ({reviews} reviews)
          </span>
        </div>

        {/* Price and Details */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div>
            <p className="font-bold text-gray-900">
              {formatPrice(currentPrice)}
            </p>

            {hasDiscount && (
              <p className="text-sm text-gray-400 line-through">
                {formatPrice(originalPrice)}
              </p>
            )}
          </div>

          {/* View Product Details */}
          <Link
            to={`/products/${product.id}`}
            aria-label={`View ${product.name}`}
            title="View Product Details"
            className="rounded-lg bg-blue-600 p-2 text-white transition hover:bg-blue-700"
          >
            <Eye size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
