import { ReactNode, useEffect, useRef } from "react";
import { Message } from "@/types/chat";
import ChatMessage from "./ChatMessage";
import styles from "./ChatContainer.module.css";

interface ChatContainerProps {
  messages: Message[];
  children?: ReactNode;
}

export default function ChatContainer({
  messages,
  children,
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className={styles.container}>
      <div className={styles.messagesWrapper}>
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {children}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
