import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import AppLayout from "../components/layout/AppLayout";
import BlueBoxHeader from "../components/common/BlueBoxHeader";
import apiClient from "../api/axios";

export default function Chatbot() {
  const [messages, setMessages] = useState(() => {
    const savedMessages = sessionStorage.getItem("chatMessages");
    return savedMessages
      ? JSON.parse(savedMessages)
      : [
        {
          id: 1,
          role: "assistant",
          content:
            "Hi! I'm your InsightEdge assistant. Ask me anything to get started.",
        },
      ];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    sessionStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages, loading]);

  useEffect(() => {
    async function syncUserData() {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      try {
        // console.log("Hii")
        await apiClient.post("/sync-user-data", { userId });

        console.log("User data synced successfully");
      } catch (err) {
        console.error("Sync failed", err);
      }
    }

    syncUserData();
  }, []);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage = { id: Date.now(), role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    const userId = localStorage.getItem("userId");
    // Generate a simple session ID or use a fixed one for now
    const sessionId = localStorage.getItem("sessionId") || `sess_${Date.now()}`;
    localStorage.setItem("sessionId", sessionId);

    try {
      const { data } = await apiClient.post("/chatbot", {
        user_id: userId,
        session_id: sessionId,
        message: trimmed,
      });

      const reply =
        data?.reply ||
        data?.content ||
        "I’m having trouble understanding the response.";

      // console.log(data);

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", content: reply },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          role: "assistant",
          content:
            error?.response?.data?.message ||
            "Oops! Something went wrong. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <AppLayout>
      <BlueBoxHeader
        heading="Chatbot Assistant"
        subtext="Powered by Hugging Face Gemma model. Ask general finance or productivity questions."
      />

      <div className="mt-6 flex flex-col h-[calc(100vh-220px)] rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"
                }`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === "user"
                  ? "bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-br-sm"
                  : "bg-gray-100 text-gray-900 rounded-bl-sm"
                  }`}
              >
                {message.role === "assistant" ? (
                  <ReactMarkdown className="message-content whitespace-pre-wrap space-y-2">
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <span className="message-content whitespace-pre-wrap">
                    {message.content}
                  </span>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm bg-gray-100 px-4 py-3 text-sm text-gray-700">
                Assistant is typing…
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-100 bg-white px-6 py-4">
          <div className="flex gap-4">
            <textarea
              className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="Send a message..."
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="h-12 rounded-2xl bg-indigo-600 px-8 text-white font-semibold shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send"}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Requests flow through your InsightEdge backend at http://localhost:5000/api, which proxies to the ML service.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

