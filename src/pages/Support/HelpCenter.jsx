
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ShoppingBag,
  CreditCard,
  Truck,
  RotateCcw,
  UserRound,
  Store,
  MessageCircle,
  ArrowRight,
  CircleHelp,
} from "lucide-react";

const topics = [
  {
    title: "Orders",
    description: "Track orders and manage your purchases.",
    icon: ShoppingBag,
    keywords: "order tracking purchase cancel order",
    link: "/my-orders",
  },
  {
    title: "Payments",
    description: "Learn about payment methods and payment issues.",
    icon: CreditCard,
    keywords: "payment cash delivery chapa transaction",
    link: "/faq",
  },
  {
    title: "Shipping",
    description: "Find information about delivery and shipping.",
    icon: Truck,
    keywords: "shipping delivery address package",
    link: "/faq",
  },
  {
    title: "Returns & Refunds",
    description: "Get help with returns and refund questions.",
    icon: RotateCcw,
    keywords: "return refund exchange damaged product",
    link: "/faq",
  },
  {
    title: "Account",
    description: "Manage your account and profile information.",
    icon: UserRound,
    keywords: "account login password profile",
    link: "/faq",
  },
  {
    title: "Shop Owners",
    description: "Get help managing your ShopEase store.",
    icon: Store,
    keywords: "shop owner store seller products",
    link: "/faq",
  },
];

const popularQuestions = [
  {
    question: "How can I track my order?",
    answer:
      "Sign in to your ShopEase account and open My Orders to view your order status.",
  },
  {
    question: "How do I contact a shop about my order?",
    answer:
      "Open your order details and use the available support options to report an issue related to the shop or product.",
  },
  {
    question: "How can I get help with a payment?",
    answer:
      "Create a support ticket under the Payment category and include your order number and relevant payment details. Never share your password or full card details.",
  },
];

const HelpCenter = () => {
  const [search, setSearch] = useState("");

  const filteredTopics = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return topics;

    return topics.filter((topic) => {
      return (
        topic.title.toLowerCase().includes(keyword) ||
        topic.description.toLowerCase().includes(keyword) ||
        topic.keywords.toLowerCase().includes(keyword)
      );
    });
  }, [search]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HERO */}
      <section className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 px-4 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <CircleHelp size={30} />
          </div>

          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-200">
            ShopEase Support
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            How can we help you?
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-indigo-100 sm:text-lg">
            Find answers, explore helpful topics, or contact our support
            team. We’re here to make your shopping experience easier.
          </p>

          <div className="mx-auto mt-8 max-w-2xl">
            <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl">
              <Search className="shrink-0 text-gray-400" size={22} />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search orders, payments, shipping..."
                aria-label="Search help topics"
                className="w-full border-0 bg-transparent text-gray-900 outline-none placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>
      </section>

      {/* TOPICS */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Browse help topics
          </h2>

          <p className="mt-2 text-gray-600">
            Select a topic to find the information you need.
          </p>
        </div>

        {filteredTopics.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <Search className="mx-auto mb-3 text-gray-400" size={32} />

            <h3 className="font-semibold text-gray-900">
              No matching topics found
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Try another search or contact our support team.
            </p>

            <Link
              to="/support/new"
              className="mt-5 inline-flex items-center gap-2 font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Contact Support
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTopics.map((topic) => {
              const Icon = topic.icon;

              return (
                <Link
                  key={topic.title}
                  to={topic.link}
                  className="group rounded-2xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                    <Icon size={24} />
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900">
                    {topic.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {topic.description}
                  </p>

                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                    Get help
                    <ArrowRight
                      size={16}
                      className="transition group-hover:translate-x-1"
                    />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* POPULAR QUESTIONS */}
      <section className="border-y border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Popular questions
              </h2>

              <p className="mt-2 text-gray-600">
                Quick answers to common questions.
              </p>
            </div>

            <Link
              to="/faq"
              className="inline-flex items-center gap-2 font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View all FAQs
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="space-y-4">
            {popularQuestions.map((item) => (
              <div
                key={item.question}
                className="rounded-xl border border-gray-200 p-5"
              >
                <h3 className="font-semibold text-gray-900">
                  {item.question}
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT SUPPORT CTA */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 rounded-3xl bg-gray-900 p-8 text-white sm:flex-row sm:items-center sm:p-10">
          <div>
            <div className="mb-3 flex items-center gap-2 text-indigo-300">
              <MessageCircle size={20} />

              <span className="text-sm font-semibold">
                Need more help?
              </span>
            </div>

            <h2 className="text-2xl font-bold">
              Our support team is ready to help.
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-400">
              Tell us what happened and we’ll help you find a solution.
            </p>
          </div>

          <Link
            to="/support/new"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            Contact Support
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HelpCenter;
