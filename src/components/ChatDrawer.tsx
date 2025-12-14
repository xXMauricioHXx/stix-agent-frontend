"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Message } from "@/types/chat";
import { sendQuestion, ChatApiError } from "@/services/chatApi";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import LoadingIndicator from "@/components/LoadingIndicator";
import styles from "./ChatDrawer.module.css";

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contextPath?: string;
  contextType?: "page" | "tree";
  initialMessage?: string;
}

export default function ChatDrawer({
  isOpen,
  onClose,
  contextPath,
  contextType,
  initialMessage,
}: ChatDrawerProps) {
  const getInitialMessages = useCallback((): Message[] => {
    const baseMessage: Message = {
      id: "1",
      text:
        initialMessage ||
        "Olá! 👋 Sou o assistente virtual da Stix, sua empresa de pontos de fidelidade! Como posso ajudá-lo hoje?",
      sender: "bot",
      timestamp: new Date(),
    };
    return [baseMessage];
  }, [initialMessage]);

  const [messages, setMessages] = useState<Message[]>(getInitialMessages());
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reset messages when context changes or initial message changes
  useEffect(() => {
    setMessages(getInitialMessages());
  }, [contextPath, contextType, initialMessage, getInitialMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      let response: string;

      // Use context API if contextPath is provided
      if (contextPath && contextType) {
        const apiResponse = await fetch("/api/chat/context", {
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

        if (!apiResponse.ok) {
          throw new Error("Failed to send message");
        }

        const data = await apiResponse.json();
        response = data.answer;
      } else {
        // Use global chat API
        response = await sendQuestion(userMessage.text);
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      let errorMessage = "Desculpe, ocorreu um erro inesperado.";

      if (error instanceof ChatApiError) {
        errorMessage = error.message;
      }

      const errorBotMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `❌ ${errorMessage}`,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorBotMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const isContextMode = !!contextPath && !!contextType;

  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className={styles.backdrop} onClick={onClose} />}

      {/* Drawer */}
      <div className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ""}`}>
        <div className={styles.drawerContent}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.logo}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2L2 7L12 12L22 7L12 2Z"
                    fill="currentColor"
                    opacity="0.3"
                  />
                  <path
                    d="M2 17L12 22L22 17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 12L12 17L22 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className={styles.headerContent}>
                <h2 className={styles.title}>
                  Stix Chat {isContextMode && "- Contexto"}
                </h2>
                <p className={styles.subtitle}>
                  {isContextMode
                    ? `Conversando sobre: ${contextPath}`
                    : "Seu assistente especialista em pontos de fidelidade"}
                </p>
              </div>
            </div>
            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Fechar chat"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Chat Container */}
          <div className={styles.chatWrapper}>
            <div className={styles.chatContainer}>
              <div className={styles.messagesWrapper}>
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isLoading && <LoadingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <ChatInput
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSendMessage}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
    </>
  );
}
