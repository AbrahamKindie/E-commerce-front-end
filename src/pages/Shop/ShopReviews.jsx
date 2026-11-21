
import { useEffect, useState } from "react";
import { MessageSquare, RefreshCw, Star } from "lucide-react";
import shopReviewService from "../../services/shopReviewService";

const ShopReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await shopReviewService.getMyShopReviews();
      setReviews(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load product reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Product Reviews</h1>
        <p className="mt-1 text-sm text-gray-500">See what customers say about your products.</p>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Total Reviews</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{reviews.length}</p>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Average Rating</p>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-3xl font-bold text-gray-900">{averageRating.toFixed(1)}</p>
            <Star className="fill-yellow-400 text-yellow-400" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-gray-500"><RefreshCw className="mr-2 animate-spin" /> Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white px-6 py-16 text-center">
          <MessageSquare className="mx-auto mb-3 text-gray-400" size={36} />
          <h2 className="font-semibold text-gray-800">No reviews yet</h2>
          <p className="mt-2 text-sm text-gray-500">Customer reviews for your products will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border bg-white p-5">
              <div className="flex flex-col justify-between gap-2 sm:flex-row">
                <div>
                  <h3 className="font-semibold text-gray-900">{review.product?.name || "Product"}</h3>
                  <p className="text-sm text-gray-500">By {review.user?.name || "Customer"}</p>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} size={16} className={index < Number(review.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                  ))}
                  <span className="ml-1 text-sm text-gray-600">{review.rating}/5</span>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-gray-700">{review.comment || "No written comment."}</p>
              <p className="mt-3 text-xs text-gray-400">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopReviews;
