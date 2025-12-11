"use client";

import { useState } from "react";
import { Message } from "@/types/chat";
import { sendQuestion, ChatApiError } from "@/services/chatApi";
import ChatContainer from "@/components/ChatContainer";
import ChatInput from "@/components/ChatInput";
import LoadingIndicator from "@/components/LoadingIndicator";
import styles from "./page.module.css";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Olá! 👋 Sou o assistente virtual da Stix, sua empresa de pontos de fidelidade! Como posso ajudá-lo hoje?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
      const response = await sendQuestion(userMessage.text);

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

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.header}>
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
            <h1 className={styles.title}>
              Stix <span className="gradient-text">Chat</span>
            </h1>
            <p className={styles.subtitle}>
              Seu assistente especialista em pontos de fidelidade
            </p>
          </div>
        </header>

        <ChatContainer messages={messages}>
          {isLoading && <LoadingIndicator />}
        </ChatContainer>

        <footer className={styles.footer}>
          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSendMessage}
            disabled={isLoading}
          />
        </footer>
      </div>
    </main>
  );
}
