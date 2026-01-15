"use client";

import { useCallback, KeyboardEvent } from "react";
import styles from "@/app/page.module.css";

export default function InputField({
  value,
  onChange,
  onSend,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
}) {
  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
    },
    [onSend]
  );

  return (
    <textarea
      className={styles.input}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder="Type your message... (Shift+Enter for new line)"
      disabled={disabled}
      id="chat-input"
    />
  );
}
