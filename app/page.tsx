"use client";

import styles from "./page.module.css";
import { useState } from "react";
import { useChat } from "./context/ChatContext";
import ChatBubble from "./components/ChatBubble";
import InputField from "./components/InputField";

export default function Home() {
  const { messages, sendMessage, loading } = useChat();
  const [message, setMessage] = useState("");

  const handleChat = async () => {
    const text = message.trim();
    if (!text) return;
    setMessage("");
    await sendMessage(text);
  };

  // 🎤 Voice Input (Speech-to-Text)
  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setMessage(transcript); // put spoken text into input box
    };

    recognition.start();
  };

  // 🔊 Voice Output (Text-to-Speech)
  const speak = (text: string) => {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className={styles.page}>
      <div className={styles.mainContent}>
        {/* Header */}
        <div className={styles.headerAnimation}>
          <h1 className={styles.animatedTitle}>
            <span className={styles.titlePart}>Ai chat model </span>
            <span className={styles.titleAccent}>NeXtGenXsAi</span>
          </h1>
          <p className={styles.subtitle}>
            New era of AI chat model with openrouter
          </p>
        </div>

        {/* Chat container */}
        <div className={styles.chatContainer}>
          <div className={styles.responseSection}>
            {messages.length > 0 ? (
              <div className={styles.response}>
                <h2>Conversation:</h2>
                <div className={styles.responseContent}>
                  <div className={styles.bubbles}>
                    {messages.map((m, i) => (
                      <ChatBubble
                        key={i}
                        sender={m.sender}
                        message={m.text}
                        timestamp={m.timestamp}
                      />
                    ))}
                    {loading && (
                      <ChatBubble
                        sender="assistant"
                        message="Thinking..."
                        timestamp={new Date().toISOString()}
                        isLoading
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.responsePlaceholder}>
                <p>Ask a question to get started...</p>
              </div>
            )}

            {/* Input section directly below */}
            <div className={styles.inputSection}>
              <InputField
                value={message}
                onChange={setMessage}
                onSend={handleChat}
                disabled={loading}
              />
              <div className={styles.inputActions}>
                <button
                  className={styles.micButton}
                  onClick={startListening}
                  disabled={loading}
                >
                  🎙️
                </button>
                <button
                  className={styles.speakerButton}
                  onClick={() => speak(messages[messages.length - 1]?.text)}
                  disabled={loading || messages.length === 0}
                >
                  🔊
                </button>
                <button
                  className={styles.button}
                  onClick={handleChat}
                  disabled={loading || !message.trim()}
                >
                  {loading ? "Loading..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>Powered by NextGenXsAI's Organization</p>
      </footer>
    </div>
  );
}
