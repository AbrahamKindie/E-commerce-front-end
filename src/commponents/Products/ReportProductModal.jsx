
import { useState } from "react";
import { X, Flag, Send } from "lucide-react";

import productInteractionService from "../../services/productInteractionService";

const REPORT_REASONS = [
  {
    value: "COUNTERFEIT",
    label: "Counterfeit or fake product",
  },
  {
    value: "MISLEADING_INFORMATION",
    label: "Misleading product information",
  },
  {
    value: "PROHIBITED_PRODUCT",
    label: "Prohibited product",
  },
  {
    value: "SUSPICIOUS_ACTIVITY",
    label: "Suspicious activity",
  },
  {
    value: "OTHER",
    label: "Other",
  },
];

const ReportProductModal = ({
  productId,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!reason) {
      setError("Please select a reason for reporting this product.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await productInteractionService.reportProduct(productId, {
        reason,
        description: description.trim() || undefined,
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to submit your report. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-product-title"
        className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-red-50 p-2 text-red-600">
              <Flag size={20} />
            </div>

            <div>
              <h2
                id="report-product-title"
                className="text-lg font-bold text-gray-900"
              >
                Report Product
              </h2>

              <p className="text-sm text-gray-500">
                Help us keep the marketplace safe.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close report modal"
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5">
          <label
            htmlFor="report-reason"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Why are you reporting this product?
          </label>

          <select
            id="report-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            required
            disabled={submitting}
            className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Select a reason</option>

            {REPORT_REASONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <label
            htmlFor="report-description"
            className="mb-2 mt-5 block text-sm font-semibold text-gray-700"
          >
            Additional details (optional)
          </label>

          <textarea
            id="report-description"
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            rows={4}
            maxLength={1000}
            disabled={submitting}
            placeholder="Please explain why this product should be reviewed..."
            className="w-full resize-y rounded-lg border border-gray-300 p-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <div className="mt-1 text-right text-xs text-gray-400">
            {description.length}/1000 characters
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || !reason}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={16} />

              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportProductModal;
