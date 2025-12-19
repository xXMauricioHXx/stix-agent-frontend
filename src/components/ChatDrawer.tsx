"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Message } from "@/types/chat";
import { sendQuestion, ChatApiError } from "@/services/chatApi";
import { useConversationId } from "@/hooks/useConversationId";
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
  pageContent?: string;
}

interface Conversation {
  conversation_id: string;
  first_message: string;
  created_at: string;
}

export default function ChatDrawer({
  isOpen,
  onClose,
  contextPath,
  contextType,
  initialMessage,
  pageContent,
}: ChatDrawerProps) {
  const { conversationId, resetConversation, loadConversation } =
    useConversationId();
  const [showConversationList, setShowConversationList] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);

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
    if (!inputValue.trim() || isLoading || !conversationId) return;

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
        const apiResponse = await fetch("/api/chat/contextual", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: userMessage.text,
            pageId: contextPath,
            path: contextPath,
            pageContent: pageContent || "",
          }),
        });

        if (!apiResponse.ok) {
          throw new Error("Failed to send message");
        }

        const data = await apiResponse.json();
        response = data.answer;
      } else {
        // Use global chat API with conversation memory
        response = await sendQuestion(userMessage.text, conversationId);
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

  // Fetch list of conversations
  const fetchConversations = async () => {
    setLoadingConversations(true);
    try {
      const response = await fetch("/api/chat/conversations");
      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }
      const data = await response.json();
      setConversations(data.conversations || []);
      setShowConversationList(true);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoadingConversations(false);
    }
  };

  // Load a specific conversation
  const handleLoadConversation = async (convId: string) => {
    loadConversation(convId);
    setShowConversationList(false);

    // Fetch conversation history
    try {
      const response = await fetch(
        `/api/chat/history?conversation_id=${convId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch conversation history");
      }

      const data = await response.json();
      const historyMessages: Message[] = data.messages.map(
        (msg: any, index: number) => ({
          id: `${index}`,
          text: msg.content,
          sender: msg.role === "user" ? "user" : "bot",
          timestamp: new Date(msg.created_at),
        })
      );

      setMessages(historyMessages);
    } catch (error) {
      console.error("Error loading conversation:", error);
      setMessages(getInitialMessages());
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
            <div style={{ display: "flex", gap: "8px" }}>
              {!isContextMode && (
                <>
                  <button
                    className={styles.historyButton}
                    onClick={fetchConversations}
                    aria-label="Histórico de conversas"
                    title="Ver conversas anteriores"
                    disabled={loadingConversations}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 3v5h5M3.05 13A9 9 0 1 0 6 5.3L3 8" />
                      <path d="M12 7v5l4 2" />
                    </svg>
                  </button>
                  <button
                    className={styles.newConversationButton}
                    onClick={() => {
                      resetConversation();
                      setMessages(getInitialMessages());
                    }}
                    aria-label="Nova conversa"
                    title="Iniciar nova conversa"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </>
              )}
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
          </div>

          {/* Conversation List Modal */}
          {showConversationList && (
            <div className={styles.conversationListOverlay}>
              <div className={styles.conversationListModal}>
                <div className={styles.conversationListHeader}>
                  <h3>Conversas Anteriores</h3>
                  <button
                    onClick={() => setShowConversationList(false)}
                    className={styles.modalCloseButton}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <div className={styles.conversationList}>
                  {conversations.length === 0 ? (
                    <div className={styles.emptyState}>
                      <p>Nenhuma conversa anterior encontrada</p>
                    </div>
                  ) : (
                    conversations.map((conv) => (
                      <div
                        key={conv.conversation_id}
                        className={`${styles.conversationItem} ${
                          conv.conversation_id === conversationId
                            ? styles.conversationItemActive
                            : ""
                        }`}
                        onClick={() =>
                          handleLoadConversation(conv.conversation_id)
                        }
                      >
                        <div className={styles.conversationPreview}>
                          {conv.first_message.substring(0, 80)}
                          {conv.first_message.length > 80 && "..."}
                        </div>
                        <div className={styles.conversationDate}>
                          {new Date(conv.created_at).toLocaleDateString(
                            "pt-BR",
                            {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

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
