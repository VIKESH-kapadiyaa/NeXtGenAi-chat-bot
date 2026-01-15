"use client";

import { motion } from "framer-motion";

export default function ChatBubble({
  sender,
  message,
  timestamp,
  isLoading = false,
}: {
  sender: "user" | "assistant";
  message: string;
  timestamp?: string;
  isLoading?: boolean;
}) {
  const isUser = sender === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "80%",
      }}
      className={`bubble ${isUser ? "bubble-user" : "bubble-assistant"}`}
    >
      <div style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>
        {isLoading ? "..." : message}
      </div>
      {timestamp && (
        <div
          style={{
            marginTop: "0.25rem",
            fontSize: "0.75rem",
            opacity: 0.7,
            textAlign: isUser ? "right" : "left",
          }}
        >
          {new Date(timestamp).toLocaleTimeString()}
        </div>
      )}
      <style jsx>{`
        .bubble {
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          box-shadow: var(--shadow-sm);
          background: var(--gray-100);
          border: 1px solid var(--gray-200);
        }
        .bubble-user {
          background: var(--primary);
          color: white;
          border-color: transparent;
        }
        .bubble-assistant {
          background: white;
          color: var(--foreground);
        }
        @media (prefers-color-scheme: dark) {
          .bubble-assistant {
            background: #1e1e1e;
            color: var(--foreground);
            border-color: var(--gray-700);
          }
        }
      `}</style>
    </motion.div>
  );
}
