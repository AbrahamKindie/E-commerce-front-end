import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, MessageCircle, Search } from "lucide-react";

const faqGroups = [
  {
    title: "Orders",
    questions: [
      {
        question: "How can I track my order?",
        answer:
          "Sign in to your ShopEase account and open My Orders. Select an order to view its current status and details.",
      },
      {
        question: "Can I cancel my order?",
        answer:
          "Cancellation depends on the current order status and ShopEase cancellation rules. Open your order details to check whether cancellation is available.",
      },
      {
        question: "Why is my order still pending?",
        answer:
          "An order may remain pending while the shop confirms it or while payment is pending. Check the order details for the latest status.",
      },
    ],
  },
  {
    title: "Payments",
    questions: [
      {
        question: "Which payment methods are available?",
        answer:
          "Available payment methods are shown during checkout. The options may depend on the current ShopEase payment configuration.",
      },
      {
        question: "What should I do if my payment fails?",
        answer:
          "Check your order payment status first. If the issue continues, create a support ticket under Payment and include your order number. Do not share your password or full card details.",
      },
    ],
  },
  {
    title: "Shipping & Returns",
    questions: [
      {
        question: "How long does delivery take?",
        answer:
          "Delivery time depends on the shop, delivery location, and shipping arrangements. Check your order details or contact support for assistance.",
      },
      {
        question: "How do I request a return or refund?",
        answer:
          "Review the Returns & Refunds information page and contact support with your order number and a description of the issue.",
      },
    ],
  },
  {
    title: "Account & Shop Owners",
    questions: [
      {
        question: "I forgot my password. What should I do?",
        answer:
          "Use the Forgot Password option on the login page and follow the instructions sent to your registered email address.",
      },
      {
        question: "How can I get help as a shop owner?",
        answer:
          "Sign in to your shop-owner account and visit the Shop Owner Help or Support section to create and manage support tickets.",
      },
    ],
  },
];

const FAQ = () => {
  const [search, setSearch] = useState("");
  const [openQuestion, setOpenQuestion] = useState(null);

  const keyword = search.trim().toLowerCase();

  const filteredGroups = faqGroups
    .map((group) => ({
      ...group,
      questions: group.questions.filter((item) => {
        return (
          item.question.toLowerCase().includes(keyword) ||
          item.answer.toLowerCase().includes(keyword)
        );
      }),
    }))
    .filter((group) => group.questions.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-indigo-700 px-4 py-14 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">
            Frequently Asked Questions
          </h1>

          <p className="mt-4 text-indigo-100">
            Find quick answers to common ShopEase questions.
          </p>

          <div className="mx-auto mt-7 flex max-w-2xl items-center gap-3 rounded-xl bg-white px-4 py-3">
            <Search className="shrink-0 text-gray-400" size={20} />

            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setOpenQuestion(null);
              }}
              placeholder="Search frequently asked questions..."
              className="w-full bg-transparent text-gray-900 outline-none placeholder:text-gray-400"
            />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        {filteredGroups.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <p className="font-semibold text-gray-900">
              No questions found
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Try another keyword or contact our support team.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {filteredGroups.map((group) => (
              <section key={group.title}>
                <h2 className="mb-4 text-xl font-bold text-gray-900">
                  {group.title}
                </h2>

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                  {group.questions.map((item, index) => {
                    const questionId = `${group.title}-${item.question}`;
                    const isOpen = openQuestion === questionId;

                    return (
                      <div
                        key={item.question}
                        className={
                          index !== group.questions.length - 1
                            ? "border-b border-gray-200"
                            : ""
                        }
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenQuestion(isOpen ? null : questionId)
                          }
                          className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
                        >
                          <span className="font-medium text-gray-900">
                            {item.question}
                          </span>

                          <ChevronDown
                            size={20}
                            className={`shrink-0 text-gray-500 transition ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {isOpen && (
                          <div className="px-5 pb-5 text-sm leading-7 text-gray-600">
                            {item.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        <div className="mt-12 rounded-2xl bg-indigo-50 p-6 text-center">
          <MessageCircle
            size={28}
            className="mx-auto text-indigo-600"
          />

          <h2 className="mt-3 text-xl font-bold text-gray-900">
            Still have questions?
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            Contact our support team and tell us how we can help.
          </p>

          <Link
            to="/support/new"
            className="mt-5 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            Contact Support
          </Link>
        </div>
      </main>
    </div>
  );
};

export default FAQ;