import { Message } from "@/types/chat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./ChatMessage.module.css";

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === "user";

  return (
    <div
      className={`${styles.messageWrapper} ${
        isUser ? styles.userWrapper : styles.botWrapper
      }`}
    >
      <div
        className={`${styles.message} ${
          isUser ? styles.userMessage : styles.botMessage
        }`}
      >
        {!isUser && (
          <div className={styles.avatar}>
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
        )}
        <div className={styles.content}>
          <div className={styles.text}>
            {isUser ? (
              <p className={styles.plainText}>{message.text}</p>
            ) : (
              <div className={styles.markdown}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.text}
                </ReactMarkdown>
              </div>
            )}
          </div>
          <span className={styles.timestamp}>
            {message.timestamp.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        {isUser && (
          <div className={`${styles.avatar} ${styles.userAvatar}`}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="8" r="4" fill="currentColor" />
              <path
                d="M6 21C6 17.134 8.686 14 12 14C15.314 14 18 21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
