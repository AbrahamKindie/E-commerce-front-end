
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";

import productInteractionService from "../../services/productInteractionService";
import getImageUrl from "../../utils/imageUrl";

// ==========================================
// STATUS CONFIGURATION
// ==========================================

const statusConfig = {
  PENDING: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-700",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    className: "bg-blue-100 text-blue-700",
  },
  RESOLVED: {
    label: "Resolved",
    className: "bg-green-100 text-green-700",
  },
  DISMISSED: {
    label: "Dismissed",
    className: "bg-gray-100 text-gray-700",
  },
};

// ==========================================
// REASON LABELS
// ==========================================

const reasonLabels = {
  COUNTERFEIT: "Counterfeit Product",
  MISLEADING_INFORMATION: "Misleading Information",
  PROHIBITED_PRODUCT: "Prohibited Product",
  SUSPICIOUS_ACTIVITY: "Suspicious Activity",
  OTHER: "Other",
};

// ==========================================
// DATE FORMATTER
// ==========================================

const formatDate = (date) => {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const MyProductReports = () => {
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // FETCH MY REPORTS
  // ==========================================

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await productInteractionService.getMyProductReports({
          page,
          limit: 10,
        });

      const result = response.data || response;

      setReports(result.reports || []);

      setPagination(
        result.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
        }
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load your product reports."
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // ==========================================
  // PAGINATION
  // ==========================================

  const handlePreviousPage = () => {
    setPage((previous) => Math.max(1, previous - 1));
  };

  const handleNextPage = () => {
    setPage((previous) =>
      Math.min(pagination.totalPages, previous + 1)
    );
  };

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading && reports.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-gray-500">
          Loading your product reports...
        </p>
      </div>
    );
  }

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <main className="mx-auto min-h-[60vh] max-w-5xl px-4 py-10">

      {/* HEADER */}

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <ClipboardList
              size={28}
              className="text-blue-600"
            />

            <h1 className="text-3xl font-bold text-gray-900">
              My Product Reports
            </h1>
          </div>

          <p className="mt-2 text-gray-500">
            Track the reports you've submitted about marketplace products.
          </p>
        </div>

        <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
          {pagination.total}{" "}
          {pagination.total === 1 ? "Report" : "Reports"}
        </span>
      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle
              size={18}
              className="text-red-600"
            />
            <p className="text-sm text-red-600">{error}</p>
          </div>

          <button
            type="button"
            onClick={fetchReports}
            className="inline-flex items-center gap-2 text-sm font-semibold text-red-700 hover:underline"
          >
            <RefreshCw size={15} />
            Try Again
          </button>
        </div>
      )}

      {/* LOADING ON PAGE CHANGE */}

      {loading && reports.length > 0 && (
        <p className="mb-4 text-sm text-gray-500">
          Updating reports...
        </p>
      )}

      {/* EMPTY STATE */}

      {!loading && reports.length === 0 && !error && (
        <div className="rounded-2xl border border-dashed border-gray-300 px-5 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <ClipboardList
              size={30}
              className="text-blue-600"
            />
          </div>

          <h2 className="mt-5 text-xl font-bold text-gray-900">
            No reports submitted
          </h2>

          <p className="mx-auto mt-2 max-w-md text-gray-500">
            You haven't reported any products yet. If you find a
            suspicious or misleading product, you can report it
            directly from its details page.
          </p>

          <Link
            to="/products"
            className="mt-6 inline-flex rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Browse Products
          </Link>
        </div>
      )}

      {/* REPORT LIST */}

      <div className="space-y-5">
        {reports.map((report) => {
          const status =
            statusConfig[report.status] ||
            statusConfig.PENDING;

          const productImage = getImageUrl(
            report.product?.images?.[0]
          );

          return (
            <article
              key={report.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="p-5">

                {/* REPORT HEADER */}

                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Report #{report.id}
                    </p>

                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                      <CalendarDays size={15} />
                      Submitted {formatDate(report.createdAt)}
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${status.className}`}
                  >
                    {status.label}
                  </span>
                </div>

                {/* PRODUCT DETAILS */}

                <div className="flex flex-col gap-4 sm:flex-row">
                  <Link
                    to={`/products/${report.product?.id}`}
                    className="h-24 w-full shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:w-24"
                  >
                    {productImage ? (
                      <img
                        src={productImage}
                        alt={report.product?.name || "Reported product"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-gray-400">
                        No image
                      </div>
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/products/${report.product?.id}`}
                      className="font-semibold text-gray-900 hover:text-blue-600"
                    >
                      {report.product?.name || "Product unavailable"}
                    </Link>

                    <p className="mt-2 text-sm text-gray-500">
                      Reason:{" "}
                      <span className="font-medium text-gray-700">
                        {reasonLabels[report.reason] || report.reason}
                      </span>
                    </p>

                    {report.description && (
                      <p className="mt-2 text-sm leading-relaxed text-gray-600">
                        {report.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* ADMIN FEEDBACK */}

                {report.adminNote && (
                  <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4">
                    <p className="text-sm font-semibold text-blue-900">
                      Admin Feedback
                    </p>

                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-blue-800">
                      {report.adminNote}
                    </p>

                    {report.reviewer?.name && (
                      <p className="mt-2 text-xs text-blue-600">
                        Reviewed by {report.reviewer.name}
                      </p>
                    )}

                    {report.reviewedAt && (
                      <p className="mt-1 text-xs text-blue-600">
                        {formatDate(report.reviewedAt)}
                      </p>
                    )}
                  </div>
                )}

                {/* STATUS MESSAGE */}

                {report.status === "PENDING" && (
                  <p className="mt-4 text-sm text-yellow-700">
                    Your report has been submitted and is waiting for review.
                  </p>
                )}

                {report.status === "UNDER_REVIEW" && (
                  <p className="mt-4 text-sm text-blue-700">
                    An administrator is currently reviewing your report.
                  </p>
                )}

                {report.status === "RESOLVED" && (
                  <p className="mt-4 text-sm text-green-700">
                    Your report has been reviewed and resolved.
                  </p>
                )}

                {report.status === "DISMISSED" && (
                  <p className="mt-4 text-sm text-gray-600">
                    Your report has been reviewed and dismissed.
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* PAGINATION */}

      {pagination.totalPages > 1 && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-5">
          <p className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePreviousPage}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={17} />
              Previous
            </button>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={
                page >= pagination.totalPages || loading
              }
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default MyProductReports;
