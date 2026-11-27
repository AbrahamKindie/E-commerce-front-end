
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, ShieldCheck } from "lucide-react";
import { createSupportTicket } from "../../services/supportApi";

const categories = [
  "ACCOUNT",
  "ORDER",
  "PAYMENT",
  "PRODUCT",
  "SHOP",
  "SHIPPING",
  "RETURN_REFUND",
  "TECHNICAL",
  "OTHER",
];

const priorities = ["LOW", "NORMAL", "HIGH", "URGENT"];

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

// Handles Axios responses, direct API responses,
// nested ticket objects, and guest access tokens.
const extractTicketResponse = (response) => {
  let result = response;
  let guestAccessToken = null;

  for (let i = 0; i < 8; i += 1) {
    if (!result || typeof result !== "object") {
      break;
    }

    if (result.guestAccessToken) {
      guestAccessToken = result.guestAccessToken;
    }

    if (
      result.ticket &&
      typeof result.ticket === "object"
    ) {
      result = result.ticket;
      continue;
    }

    const ticketId = Number(result.id);

    if (
      Number.isSafeInteger(ticketId) &&
      ticketId > 0
    ) {
      return {
        ticket: {
          ...result,
          id: ticketId,
        },
        guestAccessToken:
          guestAccessToken ||
          result.guestAccessToken ||
          null,
      };
    }

    if (
      result.data &&
      typeof result.data === "object"
    ) {
      result = result.data;
      continue;
    }

    break;
  }

  return {
    ticket: null,
    guestAccessToken,
  };
};

export default function CreateSupportTicket() {
  const navigate = useNavigate();

  const accessToken = localStorage.getItem("accessToken");
  const user = getStoredUser();

  const isLoggedIn = Boolean(accessToken && user);

  const [form, setForm] = useState({
    guestName: "",
    guestEmail: "",
    subject: "",
    category: "OTHER",
    priority: "NORMAL",
    description: "",
    productName: "",
    shopName: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    try {
      setLoading(true);
      setError("");

      if (!isLoggedIn) {
        if (
          !form.guestName.trim() ||
          !form.guestEmail.trim()
        ) {
          setError(
            "Please provide your name and email address."
          );
          return;
        }
      }

      if (form.subject.trim().length < 5) {
        setError(
          "Subject must be at least 5 characters."
        );
        return;
      }

      if (form.description.trim().length < 10) {
        setError(
          "Description must be at least 10 characters."
        );
        return;
      }

      const payload = {
        subject: form.subject.trim(),
        category: form.category,
        priority: form.priority,
        description: form.description.trim(),
      };

      // Guest identity
      if (!isLoggedIn) {
        payload.guestName = form.guestName.trim();
        payload.guestEmail = form.guestEmail
          .trim()
          .toLowerCase();
      }

      // Optional product and shop names
      if (form.productName.trim()) {
        payload.productName = form.productName.trim();
      }

      if (form.shopName.trim()) {
        payload.shopName = form.shopName.trim();
      }

      const response = await createSupportTicket(payload);

      console.log(
        "Support ticket API response:",
        response
      );

      const {
        ticket,
        guestAccessToken,
      } = extractTicketResponse(response);

      if (!ticket?.id) {
        console.error(
          "Invalid support ticket response:",
          response
        );

        throw new Error(
          "The server did not return a valid support ticket. Please contact support if your ticket was created."
        );
      }

      // Registered customer
      if (isLoggedIn) {
        navigate(
          `/my-account/support/${ticket.id}`,
          {
            state: {
              success:
                "Your support ticket has been created.",
            },
          }
        );

        return;
      }

      // Guest customer must receive a secure token
      if (!guestAccessToken) {
        throw new Error(
          "Your ticket was created, but the secure guest access token was not returned. Please contact support."
        );
      }

      // Store guest access token for ticket details/replies
      sessionStorage.setItem(
        `support_guest_token_${ticket.id}`,
        guestAccessToken
      );

      navigate(
        `/support/ticket/${ticket.id}`,
        {
          state: {
            success:
              "Your support ticket has been created.",
          },
        }
      );
    } catch (err) {
      console.error(
        "Support ticket creation error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to create your support ticket. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        to={
          isLoggedIn
            ? "/my-account/support"
            : "/help-center"
        }
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
      >
        <ArrowLeft size={17} />

        {isLoggedIn
          ? "Back to support tickets"
          : "Back to Help Center"}
      </Link>

      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">
          Create Support Ticket
        </h1>

        <p className="mt-2 text-gray-600">
          Tell us what happened, and our support team will help you.
        </p>
      </div>

      {!isLoggedIn && (
        <div className="mb-5 flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <ShieldCheck
            className="mt-0.5 shrink-0 text-blue-600"
            size={20}
          />

          <div>
            <p className="font-medium text-blue-900">
              Guest support request
            </p>

            <p className="mt-1 text-sm text-blue-800">
              Enter your contact details. After submitting,
              you'll receive secure access to view and reply
              to your ticket.
            </p>
          </div>
        </div>
      )}

      {isLoggedIn && (
        <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="font-medium text-green-800">
            Submitting as{" "}
            {user?.name ||
              user?.fullName ||
              user?.email}
          </p>

          <p className="mt-1 text-sm text-green-700">
            Your ticket will be associated with your account.
          </p>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 sm:p-7"
      >
        {/* GUEST CONTACT INFORMATION */}

        {!isLoggedIn && (
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Full Name *
              </label>

              <input
                name="guestName"
                value={form.guestName}
                onChange={handleChange}
                required
                maxLength={100}
                autoComplete="name"
                placeholder="Enter your full name"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email Address *
              </label>

              <input
                name="guestEmail"
                type="email"
                value={form.guestEmail}
                onChange={handleChange}
                required
                maxLength={254}
                autoComplete="email"
                placeholder="Enter your email address"
                className={inputClass}
              />
            </div>
          </div>
        )}

        {/* SUBJECT */}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Subject *
          </label>

          <input
            name="subject"
            value={form.subject}
            onChange={handleChange}
            required
            minLength={5}
            maxLength={150}
            placeholder="Briefly describe your issue"
            className={inputClass}
          />
        </div>

        {/* CATEGORY AND PRIORITY */}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Category *
            </label>

            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              className={inputClass}
            >
              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Priority
            </label>

            <select
              name="priority"
              value={form.priority}
              onChange={handleChange}
              className={inputClass}
            >
              {priorities.map((priority) => (
                <option
                  key={priority}
                  value={priority}
                >
                  {priority}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* DESCRIPTION */}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Description *
          </label>

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            minLength={10}
            maxLength={5000}
            rows={6}
            placeholder="Explain your issue in detail..."
            className={inputClass}
          />
        </div>

        {/* RELATED INFORMATION */}

        <div className="border-t border-gray-200 pt-5">
          <h2 className="mb-1 font-semibold text-gray-800">
            Related Information
          </h2>

          <p className="mb-4 text-sm text-gray-500">
            Optional. Provide the product or shop name related
            to your issue.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Product Name
              </label>

              <input
                name="productName"
                type="text"
                value={form.productName}
                onChange={handleChange}
                maxLength={150}
                placeholder="Enter product name"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Shop Name
              </label>

              <input
                name="shopName"
                type="text"
                value={form.shopName}
                onChange={handleChange}
                maxLength={150}
                placeholder="Enter shop name"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* SUBMIT */}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send size={18} />

          {loading
            ? "Submitting..."
            : "Submit Ticket"}
        </button>
      </form>
    </div>
  );
}
