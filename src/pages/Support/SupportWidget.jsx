
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  MessageCircle,
  X,
  Send,
  ArrowLeft,
  Headset,
  Package,
  CreditCard,
  RefreshCcw,
  UserRound,
  ShoppingBag,
  Store,
  Truck,
  HelpCircle,
  Loader2,
  CheckCircle2,
  Bot,
  Sparkles,
  RotateCcw,
  Clock,
  ShieldCheck,
  ChevronRight,
  LifeBuoy,
  AlertCircle,
} from "lucide-react";

import {
  createSupportTicket,
  getSupportTicket,
  replyToSupportTicket,
  createAiSupportConversation,
  getAiSupportConversation,
  sendAiSupportMessage,
} from "../../services/supportApi";

const supportCategories = [
  {
    id: "ORDER",
    title: "Orders",
    description: "Order status, missing or incorrect orders",
    icon: Package,
    issues: [
      "Where is my order?",
      "My order is delayed",
      "I received the wrong item",
      "My order is missing",
      "Other order issue",
    ],
  },
  {
    id: "PAYMENT",
    title: "Payments",
    description: "Payment problems and transactions",
    icon: CreditCard,
    issues: [
      "Payment failed",
      "I was charged twice",
      "Payment confirmation issue",
      "I need help with a payment",
    ],
  },
  {
    id: "RETURN_REFUND",
    title: "Returns & Refunds",
    description: "Return requests and refund problems",
    icon: RefreshCcw,
    issues: [
      "I want to return an item",
      "My refund is delayed",
      "Refund amount is incorrect",
      "Other return or refund issue",
    ],
  },
  {
    id: "ACCOUNT",
    title: "My Account",
    description: "Login, profile and account problems",
    icon: UserRound,
    issues: [
      "I cannot log in",
      "I forgot my password",
      "I want to update my account",
      "My account has a problem",
    ],
  },
  {
    id: "PRODUCT",
    title: "Products",
    description: "Product information and product issues",
    icon: ShoppingBag,
    issues: [
      "Product information is incorrect",
      "Product is unavailable",
      "I received a damaged product",
      "Other product issue",
    ],
  },
  {
    id: "SHOP",
    title: "Shop Issues",
    description: "Problems related to marketplace shops",
    icon: Store,
    issues: [
      "I have a problem with a shop",
      "Shop is not responding",
      "Shop information is incorrect",
      "Other shop issue",
    ],
  },
  {
    id: "SHIPPING",
    title: "Shipping",
    description: "Delivery and shipping problems",
    icon: Truck,
    issues: [
      "Delivery is delayed",
      "Delivery address problem",
      "I cannot track my delivery",
      "Other shipping issue",
    ],
  },
  {
    id: "TECHNICAL",
    title: "Technical Support",
    description: "Website errors and technical problems",
    icon: HelpCircle,
    issues: [
      "Website is not working",
      "I encountered an error",
      "Something is not loading",
      "Other technical issue",
    ],
  },
];

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const extractTicket = (response) => {
  const data = response?.data;
  const ticket = data?.ticket || data || null;

  if (!ticket?.id) {
    return {
      ticket: null,
      guestAccessToken: null,
    };
  }

  return {
    ticket,
    guestAccessToken:
      data?.guestAccessToken ||
      ticket?.guestAccessToken ||
      null,
  };
};

const extractTicketData = (response) => {
  let result = response;

  for (let i = 0; i < 5; i += 1) {
    if (!result || typeof result !== "object") {
      return null;
    }

    if (result.ticket) {
      return result.ticket;
    }

    if (result.data) {
      result = result.data;
      continue;
    }

    return result;
  }

  return null;
};

const getMessageText = (message) =>
  message?.message || message?.content || "";

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.message ||
  fallback;

const formatTime = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getAiStorageKey = (userId) =>
  userId
    ? `shopease_ai_conversation_user_${userId}`
    : "shopease_ai_guest_conversation";

const getAiTokenKey = (conversationId) =>
  `shopease_ai_guest_token_${conversationId}`;

const getTicketTokenKey = (ticketId) =>
  `support_guest_token_${ticketId}`;

export default function SupportWidget() {
  const messagesEndRef = useRef(null);
  const aiMessagesEndRef = useRef(null);
  const pollingRef = useRef(null);

  const user = getUser();

  const isLoggedIn = Boolean(
    localStorage.getItem("accessToken") && user
  );

  const userId = isLoggedIn
    ? user?.id ?? user?.userId
    : null;

  // Widget and support mode
  const [isOpen, setIsOpen] = useState(false);
  const [supportMode, setSupportMode] = useState("ai");

  // Human Support workflow
  const [step, setStep] = useState("categories");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState("");
  const [description, setDescription] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [message, setMessage] = useState("");

  const [ticket, setTicket] = useState(null);
  const [guestAccessToken, setGuestAccessToken] = useState("");
  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // AI Assistant workflow
  const [aiConversationId, setAiConversationId] = useState("");
  const [aiGuestToken, setAiGuestToken] = useState("");
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState("");

  const [aiLoading, setAiLoading] = useState(false);
  const [aiSending, setAiSending] = useState(false);
  const [aiError, setAiError] = useState("");

  const selectedCategoryData = supportCategories.find(
    (category) => category.id === selectedCategory
  );

  const closeWidget = () => {
    setIsOpen(false);
  };

  // ----------------------------------------
  // AI CONVERSATION
  // ----------------------------------------

  const initializeAiConversation = useCallback(
    async (forceNew = false) => {
      if (aiLoading) return;

      try {
        setAiLoading(true);
        setAiError("");

        const storageKey = getAiStorageKey(userId);

        if (!forceNew) {
          const savedConversationId =
            sessionStorage.getItem(storageKey);

          if (savedConversationId) {
            const savedToken = userId
              ? null
              : sessionStorage.getItem(
                  getAiTokenKey(savedConversationId)
                );

            try {
              const response =
                await getAiSupportConversation(
                  savedConversationId,
                  savedToken
                );

              const conversation =
                response?.data?.conversation;

              if (conversation) {
                setAiConversationId(conversation.id);
                setAiGuestToken(savedToken || "");
                setAiMessages(conversation.messages || []);
                return;
              }
            } catch {
              sessionStorage.removeItem(storageKey);

              sessionStorage.removeItem(
                getAiTokenKey(savedConversationId)
              );
            }
          }
        }

        const response =
          await createAiSupportConversation();

        const conversation =
          response?.data?.conversation;

        const token =
          response?.data?.guestAccessToken || "";

        if (!conversation?.id) {
          throw new Error(
            "The AI conversation could not be created."
          );
        }

        setAiConversationId(conversation.id);
        setAiGuestToken(token);
        setAiMessages([]);

        sessionStorage.setItem(
          storageKey,
          conversation.id
        );

        if (token) {
          sessionStorage.setItem(
            getAiTokenKey(conversation.id),
            token
          );
        }
      } catch (err) {
        setAiError(
          getErrorMessage(
            err,
            "Unable to start AI Support. Please try again."
          )
        );
      } finally {
        setAiLoading(false);
      }
    },
    [userId, aiLoading]
  );

  useEffect(() => {
    if (
      isOpen &&
      supportMode === "ai" &&
      !aiConversationId &&
      !aiLoading &&
      !aiError
    ) {
      initializeAiConversation();
    }
  }, [
    isOpen,
    supportMode,
    aiConversationId,
    aiLoading,
    aiError,
    initializeAiConversation,
  ]);

  const openAiSupport = () => {
    setSupportMode("ai");
    setError("");
    setSuccess("");
  };

  const sendAiMessage = async (event) => {
    event.preventDefault();

    const currentMessage = aiInput.trim();

    if (
      !currentMessage ||
      !aiConversationId ||
      aiSending
    ) {
      return;
    }

    setAiInput("");
    setAiError("");
    setAiSending(true);

    const temporaryMessage = {
      id: `temp-${Date.now()}`,
      role: "USER",
      content: currentMessage,
      createdAt: new Date().toISOString(),
    };

    setAiMessages((current) => [
      ...current,
      temporaryMessage,
    ]);

    try {
      const response = await sendAiSupportMessage(
        aiConversationId,
        currentMessage,
        aiGuestToken || null
      );

      const userMessage =
        response?.data?.userMessage;

      const assistantMessage =
        response?.data?.assistantMessage;

      setAiMessages((current) => {
        const withoutTemporary = current.filter(
          (item) => item.id !== temporaryMessage.id
        );

        return [
          ...withoutTemporary,
          userMessage || temporaryMessage,
          assistantMessage,
        ].filter(Boolean);
      });
    } catch (err) {
      setAiMessages((current) =>
        current.filter(
          (item) => item.id !== temporaryMessage.id
        )
      );

      setAiInput(currentMessage);

      setAiError(
        getErrorMessage(
          err,
          "Unable to get an AI response. Please try again."
        )
      );
    } finally {
      setAiSending(false);
    }
  };

  const startNewAiConversation = async () => {
    if (aiSending || aiLoading) return;

    const storageKey = getAiStorageKey(userId);

    if (aiConversationId) {
      sessionStorage.removeItem(
        getAiTokenKey(aiConversationId)
      );
    }

    sessionStorage.removeItem(storageKey);

    setAiConversationId("");
    setAiGuestToken("");
    setAiMessages([]);
    setAiInput("");
    setAiError("");

    await initializeAiConversation(true);
  };

  // ----------------------------------------
  // HUMAN SUPPORT
  // ----------------------------------------

  const resetHumanSupport = () => {
    setStep("categories");
    setSelectedCategory(null);
    setSelectedIssue("");
    setDescription("");
    setMessage("");
    setTicket(null);
    setGuestAccessToken("");
    setMessages([]);
    setError("");
    setSuccess("");
  };

  const selectCategory = (category) => {
    setSelectedCategory(category.id);
    setSelectedIssue("");
    setError("");
    setSuccess("");
    setStep("issues");
  };

  const selectIssue = (issue) => {
    setSelectedIssue(issue);
    setDescription("");
    setError("");
    setSuccess("");
    setStep("details");
  };

  const startConversation = async (event) => {
    event.preventDefault();

    if (!selectedCategory || !selectedIssue) {
      setError("Please select a support issue.");
      return;
    }

    if (
      !description.trim() ||
      description.trim().length < 10
    ) {
      setError(
        "Please explain your problem in at least 10 characters."
      );
      return;
    }

    if (
      !isLoggedIn &&
      (!guestName.trim() || !guestEmail.trim())
    ) {
      setError("Please enter your name and email address.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const payload = {
        category: selectedCategory,
        priority: "NORMAL",
        subject: selectedIssue,
        description: description.trim(),
      };

      if (!isLoggedIn) {
        payload.guestName = guestName.trim();
        payload.guestEmail = guestEmail.trim();
      }

      const response = await createSupportTicket(payload);
      const result = extractTicket(response);
      const newTicket = result.ticket;

      if (!newTicket?.id) {
        throw new Error(
          "The server did not return a valid ticket. Please try again."
        );
      }

      if (!isLoggedIn && !result.guestAccessToken) {
        throw new Error(
          "The secure guest access token was not returned."
        );
      }

      if (result.guestAccessToken) {
        sessionStorage.setItem(
          getTicketTokenKey(newTicket.id),
          result.guestAccessToken
        );

        setGuestAccessToken(result.guestAccessToken);
      }

      setTicket(newTicket);

      setMessages([
        {
          id: `initial-${newTicket.id}`,
          message: description.trim(),
          senderId: isLoggedIn ? user?.id : null,
          isCustomer: true,
          createdAt: new Date().toISOString(),
        },
      ]);

      setStep("chat");
      setSuccess("Your support request has been submitted.");
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to start your support conversation."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const loadTicketMessages = useCallback(async () => {
    if (!ticket?.id) return;

    try {
      const token =
        guestAccessToken ||
        sessionStorage.getItem(
          getTicketTokenKey(ticket.id)
        );

      const response = await getSupportTicket(
        ticket.id,
        token
      );

      const latestTicket = extractTicketData(response);

      if (!latestTicket) return;

      setTicket(latestTicket);

      const serverMessages = latestTicket.messages || [];

      setMessages((current) => {
        if (
          current.length > 0 &&
          serverMessages.length === 0
        ) {
          return current;
        }

        return serverMessages;
      });
    } catch (err) {
      console.error(
        "Unable to refresh support conversation:",
        err
      );
    }
  }, [ticket?.id, guestAccessToken]);

  useEffect(() => {
    if (
      !isOpen ||
      supportMode !== "human" ||
      step !== "chat" ||
      !ticket?.id
    ) {
      return;
    }

    loadTicketMessages();

    pollingRef.current = window.setInterval(
      loadTicketMessages,
      5000
    );

    return () => {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [
    isOpen,
    supportMode,
    step,
    ticket?.id,
    loadTicketMessages,
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  useEffect(() => {
    aiMessagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [aiMessages, aiSending]);

  const sendHumanMessage = async (event) => {
    event.preventDefault();

    if (!message.trim() || !ticket?.id) return;

    try {
      setSending(true);
      setError("");

      const currentMessage = message.trim();

      const token =
        guestAccessToken ||
        sessionStorage.getItem(
          getTicketTokenKey(ticket.id)
        );

      await replyToSupportTicket(
        ticket.id,
        { message: currentMessage },
        token
      );

      setMessage("");

      await loadTicketMessages();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to send your message. Please try again."
        )
      );
    } finally {
      setSending(false);
    }
  };

  // ----------------------------------------
  // WIDGET UI
  // ----------------------------------------

  return (
    <div className="fixed bottom-5 right-5 z-[100]">
      {isOpen && (
        <section className="mb-4 flex h-[min(760px,calc(100dvh-105px))] w-[min(460px,calc(100vw-28px))] flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">

          {/* Main header */}
          <header className="flex shrink-0 items-center gap-3 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 px-5 py-5 text-white">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Headset size={25} />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold">
                ShopEase Support
              </h2>

              <p className="mt-1 text-sm text-blue-100">
                How can we help you today?
              </p>
            </div>

            <button
              type="button"
              onClick={closeWidget}
              aria-label="Close support"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white/90 transition hover:bg-white/15 hover:text-white"
            >
              <X size={23} />
            </button>
          </header>

          {/* Mode tabs */}
          <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-gray-100 bg-white p-3">
            <button
              type="button"
              onClick={openAiSupport}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                supportMode === "ai"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Sparkles size={18} />
              AI Assistant
            </button>

            <button
              type="button"
              onClick={() => {
                setSupportMode("human");
                setError("");
                setSuccess("");
              }}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                supportMode === "human"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Headset size={18} />
              Human Support
            </button>
          </div>

          {/* =====================================
              AI ASSISTANT
          ===================================== */}
          {supportMode === "ai" && (
            <div className="flex min-h-0 flex-1 flex-col bg-white">

              {/* AI title row */}
              <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <Bot size={23} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900">
                      ShopEase Assistant
                    </h3>

                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-green-500" />

                      <p className="text-xs text-gray-500">
                        AI-powered support
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={startNewAiConversation}
                  disabled={aiLoading || aiSending}
                  title="Start a new conversation"
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 disabled:opacity-50"
                >
                  <RotateCcw size={18} />
                </button>
              </div>

              {/* AI message area */}
              <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-5 py-5">
                {aiLoading && (
                  <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                      <Loader2
                        size={27}
                        className="animate-spin"
                      />
                    </div>

                    <div>
                      <p className="font-semibold text-gray-800">
                        Getting things ready
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Starting your AI conversation...
                      </p>
                    </div>
                  </div>
                )}

                {!aiLoading && aiMessages.length === 0 && (
                  <div className="flex flex-col items-center py-6 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700">
                      <Sparkles size={30} />
                    </div>

                    <h3 className="text-xl font-bold text-gray-900">
                      Hello! How can I help?
                    </h3>

                    <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
                      Ask me about ShopEase, products, shops,
                      orders, delivery, or how to use our marketplace.
                    </p>

                    <div className="mt-7 w-full text-left">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Try asking
                      </p>

                      <div className="space-y-2.5">
                        {[
                          {
                            title: "How does ShopEase work?",
                            description:
                              "Learn about shopping on ShopEase",
                          },
                          {
                            title: "How can I track my order?",
                            description:
                              "Find out where to check your order",
                          },
                          {
                            title: "How do I contact a shop?",
                            description:
                              "Get help contacting a seller",
                          },
                        ].map((suggestion) => (
                          <button
                            key={suggestion.title}
                            type="button"
                            onClick={() =>
                              setAiInput(suggestion.title)
                            }
                            className="group flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition group-hover:bg-blue-100 group-hover:text-blue-700">
                              <MessageCircle size={19} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-800">
                                {suggestion.title}
                              </p>

                              <p className="mt-1 text-xs leading-5 text-gray-500">
                                {suggestion.description}
                              </p>
                            </div>

                            <ChevronRight
                              size={18}
                              className="shrink-0 text-gray-400 group-hover:text-blue-600"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {!aiLoading && aiMessages.length > 0 && (
                  <div className="space-y-5">
                    {aiMessages.map((item) => {
                      const isUser = item.role === "USER";

                      return (
                        <div
                          key={item.id}
                          className={`flex items-end gap-2.5 ${
                            isUser ? "justify-end" : "justify-start"
                          }`}
                        >
                          {!isUser && (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                              <Bot size={18} />
                            </div>
                          )}

                          <div
                            className={`max-w-[82%] rounded-2xl px-4 py-3.5 ${
                              isUser
                                ? "rounded-br-md bg-blue-600 text-white"
                                : "rounded-bl-md border border-gray-100 bg-white text-gray-800 shadow-sm"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words text-sm leading-6">
                              {item.content}
                            </p>

                            {item.createdAt && (
                              <p
                                className={`mt-2 text-[11px] ${
                                  isUser
                                    ? "text-blue-100"
                                    : "text-gray-400"
                                }`}
                              >
                                {formatTime(item.createdAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {aiSending && (
                      <div className="flex items-end gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                          <Bot size={18} />
                        </div>

                        <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-gray-100 bg-white px-4 py-3.5 text-sm text-gray-500 shadow-sm">
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />
                          ShopEase Assistant is thinking...
                        </div>
                      </div>
                    )}

                    <div ref={aiMessagesEndRef} />
                  </div>
                )}

                {aiError && (
                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                    <AlertCircle
                      size={18}
                      className="mt-0.5 shrink-0"
                    />

                    <div className="flex-1">
                      <p>{aiError}</p>

                      <button
                        type="button"
                        onClick={() =>
                          initializeAiConversation()
                        }
                        className="mt-2 font-semibold underline"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* AI input */}
              <form
                onSubmit={sendAiMessage}
                className="shrink-0 border-t border-gray-100 bg-white p-4"
              >
                <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-white p-2.5 transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50">
                  <textarea
                    value={aiInput}
                    onChange={(event) =>
                      setAiInput(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.shiftKey
                      ) {
                        event.preventDefault();
                        sendAiMessage(event);
                      }
                    }}
                    rows={1}
                    maxLength={2000}
                    placeholder="Type your question here..."
                    disabled={
                      aiLoading ||
                      aiSending ||
                      !aiConversationId
                    }
                    className="max-h-28 min-h-[44px] flex-1 resize-none border-0 bg-transparent px-2 py-3 text-sm leading-5 text-gray-800 outline-none placeholder:text-gray-400"
                  />

                  <button
                    type="submit"
                    disabled={
                      !aiInput.trim() ||
                      aiLoading ||
                      aiSending ||
                      !aiConversationId
                    }
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                    aria-label="Send message"
                  >
                    {aiSending ? (
                      <Loader2
                        size={19}
                        className="animate-spin"
                      />
                    ) : (
                      <Send size={19} />
                    )}
                  </button>
                </div>

                <div className="mt-3 flex items-start justify-center gap-1.5 text-center">
                  <ShieldCheck
                    size={13}
                    className="mt-0.5 shrink-0 text-gray-400"
                  />

                  <p className="text-[11px] leading-4 text-gray-400">
                    Never share your password, OTP, or payment
                    card details with the assistant.
                  </p>
                </div>
              </form>

              {/* Human support shortcut */}
              <div className="shrink-0 border-t border-gray-100 bg-gray-50 px-4 py-3 text-center">
                <p className="text-xs text-gray-500">
                  Need personal assistance?
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSupportMode("human");
                    setStep("categories");
                    setError("");
                    setSuccess("");
                  }}
                  className="mt-1 text-sm font-semibold text-blue-600 hover:underline"
                >
                  Talk to Human Support
                </button>
              </div>
            </div>
          )}

          {/* =====================================
              HUMAN SUPPORT
          ===================================== */}
          {supportMode === "human" && (
            <div className="flex min-h-0 flex-1 flex-col bg-white">

              {/* Human support introduction */}
              {step !== "chat" && (
                <div className="shrink-0 border-b border-gray-100 px-5 py-4">
                  <div className="flex items-center gap-3">
                    {step !== "categories" && (
                      <button
                        type="button"
                        onClick={() => {
                          setError("");

                          if (step === "issues") {
                            setStep("categories");
                          } else if (step === "details") {
                            setStep("issues");
                          }
                        }}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:bg-gray-100"
                        aria-label="Go back"
                      >
                        <ArrowLeft size={19} />
                      </button>
                    )}

                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {step === "categories"
                          ? "How can we help?"
                          : step === "issues"
                            ? "Choose an issue"
                            : "Tell us more"}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {step === "categories"
                          ? "Select a topic to get started."
                          : step === "issues"
                            ? "Choose the option that best matches your problem."
                            : "Our support team will help you resolve it."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Categories */}
              {step === "categories" && (
                <div className="min-h-0 flex-1 overflow-y-auto p-5">
                  <div className="mb-5 rounded-2xl bg-blue-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                        <LifeBuoy size={21} />
                      </div>

                      <div>
                        <p className="font-semibold text-blue-900">
                          We're here to help
                        </p>

                        <p className="mt-1 text-sm leading-5 text-blue-800">
                          Choose a support category below and
                          tell us what happened.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {supportCategories.map((category) => {
                      const Icon = category.icon;

                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() =>
                            selectCategory(category)
                          }
                          className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition group-hover:bg-blue-100 group-hover:text-blue-700">
                            <Icon size={23} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900">
                              {category.title}
                            </p>

                            <p className="mt-1 text-sm leading-5 text-gray-500">
                              {category.description}
                            </p>
                          </div>

                          <ChevronRight
                            size={19}
                            className="shrink-0 text-gray-400 transition group-hover:text-blue-600"
                          />
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-5 rounded-2xl border border-gray-200 p-4 text-center">
                    <p className="text-sm text-gray-600">
                      Already submitted a request?
                    </p>

                    <a
                      href="/my-account/support"
                      className="mt-2 inline-block text-sm font-semibold text-blue-600 hover:underline"
                    >
                      View my support tickets
                    </a>
                  </div>
                </div>
              )}

              {/* Issue selection */}
              {step === "issues" && (
                <div className="min-h-0 flex-1 overflow-y-auto p-5">
                  <div className="mb-5 rounded-2xl bg-blue-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                      {selectedCategoryData?.title}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-blue-900">
                      Select the issue that most closely
                      describes your situation.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {selectedCategoryData?.issues.map(
                      (issue) => (
                        <button
                          key={issue}
                          type="button"
                          onClick={() => selectIssue(issue)}
                          className="group flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
                        >
                          <span className="text-sm font-medium leading-5 text-gray-700">
                            {issue}
                          </span>

                          <ChevronRight
                            size={18}
                            className="shrink-0 text-gray-400 group-hover:text-blue-600"
                          />
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Problem details */}
              {step === "details" && (
                <form
                  onSubmit={startConversation}
                  className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5"
                >
                  <div className="rounded-2xl bg-blue-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                      {selectedCategoryData?.title}
                    </p>

                    <p className="mt-2 font-semibold text-blue-900">
                      {selectedIssue}
                    </p>

                    <p className="mt-2 text-sm leading-5 text-blue-800">
                      Please provide details so our support
                      team can understand and assist you.
                    </p>
                  </div>

                  {!isLoggedIn && (
                    <div className="space-y-4 rounded-2xl border border-gray-200 p-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          Your contact information
                        </h4>

                        <p className="mt-1 text-sm text-gray-500">
                          We'll use this to respond to your request.
                        </p>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Full name
                        </label>

                        <input
                          value={guestName}
                          onChange={(event) =>
                            setGuestName(event.target.value)
                          }
                          required
                          maxLength={100}
                          placeholder="Enter your full name"
                          autoComplete="name"
                          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Email address
                        </label>

                        <input
                          type="email"
                          value={guestEmail}
                          onChange={(event) =>
                            setGuestEmail(event.target.value)
                          }
                          required
                          maxLength={254}
                          placeholder="you@example.com"
                          autoComplete="email"
                          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800">
                      Describe your problem
                    </label>

                    <textarea
                      value={description}
                      onChange={(event) =>
                        setDescription(event.target.value)
                      }
                      required
                      minLength={10}
                      maxLength={5000}
                      rows={6}
                      placeholder="Tell us what happened, what you expected, and any details that may help..."
                      className="w-full resize-y rounded-xl border border-gray-300 p-4 text-sm leading-6 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />

                    <p className="mt-2 text-right text-xs text-gray-400">
                      {description.length}/5000 characters
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      <AlertCircle
                        size={18}
                        className="mt-0.5 shrink-0"
                      />
                      <p>{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2
                          size={19}
                          className="animate-spin"
                        />
                        Submitting your request...
                      </>
                    ) : (
                      <>
                        <MessageCircle size={19} />
                        Submit Support Request
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs leading-5 text-gray-400">
                    Please don't include passwords, OTPs, or
                    payment card details.
                  </p>
                </form>
              )}

              {/* Human support chat */}
              {step === "chat" && (
                <>
                  <div className="flex shrink-0 items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                      <Headset size={22} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900">
                        {ticket?.ticketNumber ||
                          "Support conversation"}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {ticket?.assignedAdmin
                          ? "Support agent assigned"
                          : "Waiting for a support agent"}
                      </p>
                    </div>

                    <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800">
                      {ticket?.status?.replaceAll("_", " ") ||
                        "OPEN"}
                    </span>
                  </div>

                  <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-slate-50 p-5">
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2
                          size={20}
                          className="mt-0.5 shrink-0 text-blue-600"
                        />

                        <div>
                          <p className="font-semibold text-blue-900">
                            Your request has been submitted
                          </p>

                          <p className="mt-1 text-sm leading-5 text-blue-800">
                            Our support team will respond here.
                            You can send additional messages below.
                          </p>
                        </div>
                      </div>
                    </div>

                    {messages.map((item, index) => {
                      const isCustomer =
                        item.isCustomer ||
                        (item.senderId &&
                          String(item.senderId) ===
                            String(user?.id ?? user?.userId));

                      const senderName = isCustomer
                        ? "You"
                        : item.sender?.name || "Support Agent";

                      return (
                        <div
                          key={
                            item.id ||
                            `${index}-${item.createdAt}`
                          }
                          className={`flex ${
                            isCustomer
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                              isCustomer
                                ? "rounded-br-md bg-blue-600 text-white"
                                : "rounded-bl-md border border-gray-100 bg-white text-gray-800 shadow-sm"
                            }`}
                          >
                            <p
                              className={`mb-2 text-xs font-semibold ${
                                isCustomer
                                  ? "text-blue-100"
                                  : "text-blue-600"
                              }`}
                            >
                              {senderName}
                            </p>

                            <p className="whitespace-pre-wrap break-words text-sm leading-6">
                              {getMessageText(item)}
                            </p>

                            {item.createdAt && (
                              <p
                                className={`mt-2 text-right text-[11px] ${
                                  isCustomer
                                    ? "text-blue-100"
                                    : "text-gray-400"
                                }`}
                              >
                                {formatTime(item.createdAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    <div ref={messagesEndRef} />
                  </div>

                  {error && (
                    <div className="shrink-0 border-t border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <form
                    onSubmit={sendHumanMessage}
                    className="flex shrink-0 items-end gap-2 border-t border-gray-100 bg-white p-4"
                  >
                    <textarea
                      value={message}
                      onChange={(event) =>
                        setMessage(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" &&
                          !event.shiftKey
                        ) {
                          event.preventDefault();
                          sendHumanMessage(event);
                        }
                      }}
                      rows={1}
                      maxLength={5000}
                      placeholder="Write your message..."
                      className="max-h-28 min-h-[46px] flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />

                    <button
                      type="submit"
                      disabled={sending || !message.trim()}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                      aria-label="Send message"
                    >
                      {sending ? (
                        <Loader2
                          size={19}
                          className="animate-spin"
                        />
                      ) : (
                        <Send size={19} />
                      )}
                    </button>
                  </form>

                  <div className="shrink-0 border-t border-gray-100 bg-gray-50 px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={resetHumanSupport}
                      className="text-sm font-semibold text-blue-600 hover:underline"
                    >
                      Start a new support request
                    </button>
                  </div>
                </>
              )}

              {/* Human support feedback */}
              {success && step !== "chat" && (
                <div className="flex shrink-0 items-center gap-2 border-t border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                  <CheckCircle2 size={18} />
                  {success}
                </div>
              )}

              {error && step !== "details" && (
                <div className="flex shrink-0 items-start gap-2 border-t border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Floating support button */}
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={
          isOpen ? "Close support" : "Open ShopEase support"
        }
        className="group relative ml-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl transition duration-200 hover:-translate-y-1 hover:shadow-2xl"
      >
        {isOpen ? (
          <X size={27} />
        ) : (
          <>
            <MessageCircle size={27} />

            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-green-500">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </span>
          </>
        )}
      </button>
    </div>
  );
}
