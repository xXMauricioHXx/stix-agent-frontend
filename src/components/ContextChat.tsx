import React, { useState, useRef, useEffect } from "react";
import styles from "./ContextChat.module.css";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { Message } from "@/types/chat";

interface ContextChatProps {
  contextPath: string;
  contextType: "page" | "tree";
  onClose: () => void;
  isMinimized?: boolean;
  onMinimize?: () => void;
}

export const ContextChat: React.FC<ContextChatProps> = ({
  contextPath,
  contextType,
  onClose,
  isMinimized = false,
  onMinimize,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!isMinimized) {
      scrollToBottom();
    }
  }, [messages, isMinimized]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat/context", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.text,
          contextPath,
          contextType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.answer,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I encountered an error while processing your request.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`${styles.container} ${isMinimized ? styles.minimized : ""}`}
    >
      <div className={styles.header}>
        <h3>Context Chat</h3>
        <div className={styles.headerActions}>
          <button
            onClick={onMinimize}
            className={styles.minimizeButton}
            title={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? "□" : "_"}
          </button>
          <button onClick={onClose} className={styles.closeButton}>
            &times;
          </button>
        </div>
      </div>
      {!isMinimized && (
        <>
          <div className={styles.subHeader}>
            Context: {contextPath} ({contextType})
          </div>
          <div className={styles.messages}>
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className={styles.loading}>
                <span>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className={styles.inputContainer}>
            <ChatInput
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSendMessage}
              disabled={isLoading}
            />
          </div>
        </>
      )}
    </div>
  );
};
