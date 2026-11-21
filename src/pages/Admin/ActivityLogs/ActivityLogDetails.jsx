
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  UserRound,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Trash2,
  PlusCircle,
  Pencil,
  ShieldCheck,
  Mail,
  Info,
} from "lucide-react";

import adminService from "../../../services/adminService";
import { API_BASE_URL } from "../../../services/api";

// ==========================================
// CONSTANTS
// ==========================================

const HIDDEN_FIELDS = [
  "password",
  "refreshToken",
  "passwordSetupToken",
  "passwordSetupTokenExpiresAt",
  "resetPasswordToken",
  "resetPasswordTokenExpiresAt",
  "token",
  "accessToken",
  "createdAt",
  "updatedAt",
];

const COMPARISON_FIELDS = [
  "id",
  "createdAt",
  "updatedAt",
  "password",
  "refreshToken",
  "passwordSetupToken",
  "passwordSetupTokenExpiresAt",
];

const SNAPSHOT_FIELDS = [
  "previousData",
  "previous",
  "updatedData",
  "newData",
  "updated",
];

// ==========================================
// HELPERS
// ==========================================

const formatAction = (action) => {
  if (!action) return "Unknown Action";

  return action
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleString();
};

const formatFieldName = (field) => {
  return String(field)
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
};

const isObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value);

const normalizeDetails = (details) => {
  if (!details) return {};

  if (isObject(details)) return details;

  if (typeof details === "string") {
    try {
      const parsed = JSON.parse(details);

      return isObject(parsed)
        ? parsed
        : { description: String(parsed) };
    } catch {
      return { description: details };
    }
  }

  return { description: String(details) };
};

// ==========================================
// IMAGE HELPERS
// ==========================================

// Detect common image-related field names.
const IMAGE_FIELD_PATTERN =
  /(image|imageurl|image_url|photo|picture|thumbnail|logo|cover)/i;

// Convert relative image paths into full backend URLs.
const getImageUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const imagePath = value.trim();

  // Support base64 images.
  if (imagePath.startsWith("data:image/")) {
    return imagePath;
  }

  // Support temporary browser previews.
  if (imagePath.startsWith("blob:")) {
    return imagePath;
  }

  // Already an absolute URL.
  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath;
  }

  // Convert relative backend paths into full URLs.
  return `${API_BASE_URL.replace(/\/+$/, "")}/${imagePath.replace(/^\/+/, "")}`;
};

const isImageField = (field, value) => {
  if (!IMAGE_FIELD_PATTERN.test(String(field))) {
    return false;
  }

  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
};

// ==========================================
// VALUE FORMATTERS
// ==========================================

const formatValue = (value) => {
  if (value === null) return "Not provided";
  if (value === undefined) return "—";

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value.length
      ? value.map(formatPermission).join(", ")
      : "None";
  }

  if (isObject(value)) {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
};

const valuesAreEqual = (first, second) => {
  return JSON.stringify(first) === JSON.stringify(second);
};

const normalizeActor = (log, details) => {
  const snapshot = details?.actorSnapshot || {};

  return {
    name: log.actor?.name || snapshot.name || "Deleted Admin",
    email:
      log.actor?.email ||
      snapshot.email ||
      "Account unavailable",
    role: log.actor?.role || snapshot.role || "Former Admin",
  };
};

// Supports string permissions and permission objects.
const formatPermission = (permission) => {
  if (typeof permission === "string") {
    return permission;
  }

  if (isObject(permission)) {
    return (
      permission.permission ||
      permission.name ||
      permission.code ||
      permission.key ||
      String(permission.id ?? "Unknown Permission")
    );
  }

  return String(permission);
};

const normalizePermissions = (permissions) => {
  if (!Array.isArray(permissions)) return [];

  return permissions.map(formatPermission);
};

const isPermissionField = (field) => {
  return String(field).toLowerCase() === "permissions";
};

const getPreviousData = (details) => {
  return (
    details.previousData ||
    details.previous ||
    null
  );
};

const getUpdatedData = (details) => {
  return (
    details.updatedData ||
    details.newData ||
    details.updated ||
    null
  );
};

const getRecordSnapshot = (details, action) => {
  const isDelete = action.startsWith("DELETE_");
  const isCreate = action.startsWith("CREATE_");

  if (isDelete) {
    return (
      details.deletedData ||
      details.deletedRecord ||
      details.deletedAdmin ||
      details.deletedShop ||
      details.deletedCategory ||
      details.deletedProduct ||
      details.record ||
      details.admin ||
      details.shop ||
      details.category ||
      details.product ||
      null
    );
  }

  if (isCreate) {
    return (
      details.createdData ||
      details.createdRecord ||
      details.createdAdmin ||
      details.createdShop ||
      details.createdCategory ||
      details.createdProduct ||
      details.record ||
      details.admin ||
      details.shop ||
      details.category ||
      details.product ||
      details.newData ||
      null
    );
  }

  return null;
};

// ==========================================
// VALUE DISPLAY
// ==========================================

const Value = ({ value, field = "" }) => {
  // Display image previews instead of raw image URLs.
  if (isImageField(field, value)) {
    const imageUrl = getImageUrl(value);

    return (
      <div className="space-y-2">
        <div className="flex min-h-28 w-fit max-w-full items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-2">
          <img
            src={imageUrl}
            alt={formatFieldName(field)}
            className="h-32 w-32 rounded-lg object-contain"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        </div>

        <p className="max-w-full break-all text-xs text-gray-400">
          {value}
        </p>
      </div>
    );
  }

  if (value !== null && typeof value === "object") {
    return (
      <pre className="max-w-full overflow-auto whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-3 text-xs leading-5 text-gray-700">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return (
    <span className="break-words text-sm font-medium text-gray-800">
      {formatValue(value)}
    </span>
  );
};

// ==========================================
// INFORMATION MESSAGE
// ==========================================

const InformationMessage = ({ children }) => (
  <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
    <div className="flex items-center gap-2 text-gray-500">
      <Info size={18} />
      <p className="text-sm">{children}</p>
    </div>
  </div>
);

// ==========================================
// PERMISSION COMPARISON
// ==========================================

const PermissionChips = ({
  previousPermissions,
  currentPermissions,
  showChanges = false,
}) => {
  const previous = normalizePermissions(previousPermissions);
  const current = normalizePermissions(currentPermissions);

  const allPermissions = [
    ...current,
    ...previous.filter(
      (permission) => !current.includes(permission)
    ),
  ];

  if (!allPermissions.length) {
    return (
      <span className="text-sm text-gray-400">
        No permissions
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {allPermissions.map((permission, index) => {
        const existedBefore = previous.includes(permission);
        const existsNow = current.includes(permission);

        const isAdded =
          showChanges && existsNow && !existedBefore;

        const isRemoved =
          showChanges && existedBefore && !existsNow;

        let chipClass =
          "border border-gray-200 bg-gray-100 text-gray-700";

        if (isAdded) {
          chipClass =
            "border border-green-200 bg-green-50 text-green-700";
        } else if (isRemoved) {
          chipClass =
            "border border-red-200 bg-red-50 text-red-700";
        }

        return (
          <span
            key={`${permission}-${index}`}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${chipClass}`}
            title={
              isAdded
                ? "Newly added permission"
                : isRemoved
                  ? "Permission removed"
                  : "Unchanged permission"
            }
          >
            {isAdded && (
              <CheckCircle2
                size={14}
                className="shrink-0 text-green-600"
              />
            )}

            {isRemoved && (
              <XCircle
                size={14}
                className="shrink-0 text-red-600"
              />
            )}

            {permission}
          </span>
        );
      })}
    </div>
  );
};

// ==========================================
// UPDATED RECORD COMPARISON
// ==========================================

const UpdatedRecord = ({ details }) => {
  const previousData = getPreviousData(details);
  const updatedData = getUpdatedData(details);

  if (!isObject(updatedData)) {
    return (
      <InformationMessage>
        Updated record information was not included in this activity log.
      </InformationMessage>
    );
  }

  const fields = Object.keys(updatedData).filter(
    (field) =>
      !COMPARISON_FIELDS.includes(field) &&
      !HIDDEN_FIELDS.includes(field)
  );

  // Include previous fields that were removed from the record.
  if (isObject(previousData)) {
    Object.keys(previousData).forEach((field) => {
      if (
        !fields.includes(field) &&
        !COMPARISON_FIELDS.includes(field) &&
        !HIDDEN_FIELDS.includes(field)
      ) {
        fields.push(field);
      }
    });
  }

  if (!fields.length) {
    return (
      <InformationMessage>
        No displayable updated fields were recorded.
      </InformationMessage>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <Pencil size={18} className="text-indigo-600" />

          <h3 className="font-semibold text-gray-900">
            Updated Information
          </h3>
        </div>

        <p className="mt-1 text-xs text-gray-500">
          Previous information is shown neutrally. Only changed values
          in Current Information are highlighted.
        </p>
      </div>

      {/* COLUMN HEADERS */}

      <div className="grid grid-cols-1 border-b border-gray-200 bg-gray-50 sm:grid-cols-2">
        <div className="border-b border-gray-200 px-5 py-3 sm:border-b-0 sm:border-r">
          <h4 className="text-sm font-semibold text-gray-700">
            Previous Information
          </h4>
        </div>

        <div className="px-5 py-3">
          <h4 className="text-sm font-semibold text-gray-700">
            Current Information
          </h4>
        </div>
      </div>

      {/* FIELD COMPARISON */}

      <div className="divide-y divide-gray-100">
        {fields.map((field) => {
          const existedBefore =
            isObject(previousData) &&
            Object.prototype.hasOwnProperty.call(
              previousData,
              field
            );

          const existsNow =
            Object.prototype.hasOwnProperty.call(
              updatedData,
              field
            );

          const oldValue = existedBefore
            ? previousData[field]
            : undefined;

          const newValue = existsNow
            ? updatedData[field]
            : undefined;

          const changed =
            existedBefore !== existsNow ||
            !valuesAreEqual(oldValue, newValue);

          const isPermissions = isPermissionField(field);

          return (
            <div
              key={field}
              className="grid grid-cols-1 sm:grid-cols-2"
            >
              {/* PREVIOUS DATA */}

              <div className="min-w-0 border-b border-gray-100 px-5 py-4 sm:border-b-0 sm:border-r">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {formatFieldName(field)}
                </p>

                {isPermissions ? (
                  <PermissionChips
                    previousPermissions={
                      existedBefore ? oldValue : []
                    }
                    currentPermissions={
                      existedBefore ? oldValue : []
                    }
                  />
                ) : (
                  <Value
                    field={field}
                    value={
                      existedBefore
                        ? oldValue
                        : "Not available"
                    }
                  />
                )}
              </div>

              {/* CURRENT DATA */}

              <div className="min-w-0 px-5 py-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {formatFieldName(field)}
                </p>

                {isPermissions ? (
                  <PermissionChips
                    previousPermissions={
                      existedBefore ? oldValue : []
                    }
                    currentPermissions={
                      existsNow ? newValue : []
                    }
                    showChanges
                  />
                ) : !existsNow ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                    <XCircle size={15} />
                    Removed
                  </span>
                ) : changed ? (
                  <div className="space-y-2">
                    {isImageField(field, newValue) ? (
                      <Value
                        field={field}
                        value={newValue}
                      />
                    ) : (
                      <span className="inline-block break-words rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
                        {formatValue(newValue)}
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                      <CheckCircle2 size={13} />
                      Updated
                    </span>
                  </div>
                ) : (
                  <Value
                    field={field}
                    value={newValue}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==========================================
// CREATE / DELETE DETAILS
// ==========================================

const RecordDetails = ({ details, action }) => {
  const record = getRecordSnapshot(details, action);

  const isDelete = action.startsWith("DELETE_");

  if (!isObject(record)) {
    return (
      <InformationMessage>
        {isDelete
          ? "Deleted record information was not included in this activity log."
          : "Created record information was not included in this activity log."}
      </InformationMessage>
    );
  }

  const fields = Object.entries(record).filter(
    ([field]) => !HIDDEN_FIELDS.includes(field)
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-4">
        {isDelete ? (
          <Trash2 size={18} className="text-red-600" />
        ) : (
          <PlusCircle size={18} className="text-green-600" />
        )}

        <h3 className="font-semibold text-gray-900">
          {isDelete ? "Deleted Information" : "Created Information"}
        </h3>
      </div>

      <div className="divide-y divide-gray-100">
        {fields.map(([field, value]) => (
          <div
            key={field}
            className="grid grid-cols-1 gap-2 px-5 py-4 sm:grid-cols-[180px_1fr] sm:items-center"
          >
            <p className="text-sm font-medium text-gray-500">
              {formatFieldName(field)}
            </p>

            <Value
              field={field}
              value={value}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// ACTIVATE / DEACTIVATE DETAILS
// ==========================================

const StatusDetails = ({ action, details }) => {
  const isActivated = action.startsWith("ACTIVATE_");

  const status =
    details.newStatus ||
    details.status ||
    details.updatedData?.status ||
    (details.isActive === true
      ? "ACTIVE"
      : details.isActive === false
        ? "DEACTIVATED"
        : isActivated
          ? "ACTIVE"
          : "DEACTIVATED");

  const displayStatus = String(status)
    .replaceAll("_", " ")
    .toUpperCase();

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <ShieldCheck
          size={19}
          className={
            isActivated ? "text-green-600" : "text-red-600"
          }
        />

        <h3 className="font-semibold text-gray-900">
          Status Information
        </h3>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          Resulting status
        </p>

        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
            isActivated
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isActivated ? "bg-green-500" : "bg-red-500"
            }`}
          />

          {displayStatus}
        </span>
      </div>
    </div>
  );
};

// ==========================================
// ADDITIONAL DETAILS
// ==========================================

const AdditionalDetails = ({ details }) => {
  const excludedFields = [
    ...SNAPSHOT_FIELDS,
    "createdData",
    "createdRecord",
    "createdAdmin",
    "createdShop",
    "createdCategory",
    "createdProduct",
    "deletedData",
    "deletedRecord",
    "deletedAdmin",
    "deletedShop",
    "deletedCategory",
    "deletedProduct",
    "actorSnapshot",
    "record",
    "admin",
    "shop",
    "category",
    "product",
  ];

  const entries = Object.entries(details).filter(
    ([field]) =>
      !excludedFields.includes(field) &&
      !HIDDEN_FIELDS.includes(field)
  );

  if (!entries.length) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 font-semibold text-gray-900">
        Additional Information
      </h3>

      <div className="space-y-4">
        {entries.map(([field, value]) => (
          <div
            key={field}
            className="grid grid-cols-1 gap-1 sm:grid-cols-[180px_1fr]"
          >
            <p className="text-sm font-medium text-gray-500">
              {formatFieldName(field)}
            </p>

            <Value
              field={field}
              value={value}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// MAIN PAGE
// ==========================================

const ActivityLogDetails = () => {
  const { logId } = useParams();
  const navigate = useNavigate();

  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchActivityLog = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const response =
          await adminService.getActivityLogById(logId);

        // Supports:
        // 1. Axios response: { data: { success, data: log } }
        // 2. Service response.data: { success, data: log }
        // 3. Direct activity log object.

        const activityLog =
          response?.data?.data ||
          response?.data?.log ||
          response?.data ||
          response?.log ||
          response;

        if (!activityLog?.id) {
          throw new Error("Activity log was not found.");
        }

        if (!cancelled) {
          setLog(activityLog);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error.response?.data?.message ||
              error.message ||
              "Failed to load activity details."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchActivityLog();

    return () => {
      cancelled = true;
    };
  }, [logId]);

  const details = useMemo(
    () => normalizeDetails(log?.details),
    [log]
  );

  const actor = useMemo(
    () => (log ? normalizeActor(log, details) : null),
    [log, details]
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (errorMessage || !log) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => navigate("/admin/activity-logs")}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600"
        >
          <ArrowLeft size={17} />
          Back to Activity Logs
        </button>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle size={20} />
            <p className="font-medium">
              {errorMessage || "Activity log not found."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const action = log.action || "";

  const isUpdate = action.startsWith("UPDATE_");
  const isCreate = action.startsWith("CREATE_");
  const isDelete = action.startsWith("DELETE_");
  const isActivate = action.startsWith("ACTIVATE_");
  const isDeactivate = action.startsWith("DEACTIVATE_");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* HEADER */}

      <div>
        <button
          type="button"
          onClick={() => navigate("/admin/activity-logs")}
          className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-indigo-600"
        >
          <ArrowLeft size={17} />
          Back to Activity Logs
        </button>

        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
            <Activity size={24} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Activity Log Details
            </h1>

            <p className="text-sm text-gray-500">
              View detailed information about this administrator activity.
            </p>
          </div>
        </div>
      </div>

      {/* ACTIVITY INFORMATION AND PERFORMER */}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <p className="text-sm font-medium text-gray-500">
                Action
              </p>

              <span className="w-fit rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                {action || "Unknown"}
              </span>
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <p className="text-sm font-medium text-gray-500">
                Target Type
              </p>

              <p className="text-sm font-medium text-gray-800">
                {log.targetType || "GENERAL"}
              </p>
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <p className="text-sm font-medium text-gray-500">
                Target ID
              </p>

              <p className="text-sm font-medium text-gray-800">
                {log.targetId ?? "—"}
              </p>
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <p className="text-sm font-medium text-gray-500">
                Date & Time
              </p>

              <p className="flex items-center gap-2 text-sm text-gray-800">
                <CalendarDays size={15} className="text-gray-400" />
                {formatDate(log.createdAt)}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5 md:border-l md:border-t-0 md:pl-6 md:pt-0">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <UserRound size={23} />
              </div>

              <div className="min-w-0">
                <p className="font-semibold text-gray-900">
                  Performed By
                </p>

                <p className="mt-1 font-medium text-gray-800">
                  {actor.name}
                </p>

                <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                  <Mail size={14} />
                  {actor.email}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  {actor.role}
                  {log.actorId
                    ? ` · Admin ID: ${log.actorId}`
                    : " · Historical account"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ACTION DETAILS */}

      {isUpdate && (
        <UpdatedRecord details={details} />
      )}

      {(isActivate || isDeactivate) && (
        <StatusDetails
          action={action}
          details={details}
        />
      )}

      {(isCreate || isDelete) && (
        <RecordDetails
          details={details}
          action={action}
        />
      )}

      {!isUpdate &&
        !isCreate &&
        !isDelete &&
        !isActivate &&
        !isDeactivate && (
          <InformationMessage>
            No specialized display is available for this activity type.
          </InformationMessage>
        )}

      {/* ADDITIONAL DETAILS */}

      <AdditionalDetails details={details} />

      {/* FOOTER */}

      <div className="border-t border-gray-200 pt-5">
        <button
          type="button"
          onClick={() => navigate("/admin/activity-logs")}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <ArrowLeft size={16} />
          Back to Activity Logs
        </button>
      </div>
    </div>
  );
};

export default ActivityLogDetails;
