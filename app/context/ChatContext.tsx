"use client";

import { createContext, useContext, useState, useCallback } from "react";

type Sender = "user" | "assistant";

interface ChatMessage {
  sender: Sender;
  text: string;
  timestamp: string;
}

interface ChatContextValue {
  messages: ChatMessage[];
  loading: boolean;
  error?: string;
  sendMessage: (text: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: ChatMessage = {
      sender: "user",
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setError(undefined);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Request failed");
      }

      const assistantText =
        typeof data?.response === "string" ? data.response : JSON.stringify(data);

      const botMsg: ChatMessage = {
        sender: "assistant",
        text: assistantText,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const msg = (err as Error)?.message || "Error processing request";
      setError(msg);
      const botMsg: ChatMessage = {
        sender: "assistant",
        text: msg,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <ChatContext.Provider value={{ messages, loading, error, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
