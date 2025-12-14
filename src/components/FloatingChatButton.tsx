"use client";

import styles from "./FloatingChatButton.module.css";

interface FloatingChatButtonProps {
  onClick: () => void;
}

export default function FloatingChatButton({
  onClick,
}: FloatingChatButtonProps) {
  return (
    <button
      className={styles.floatingButton}
      onClick={onClick}
      aria-label="Abrir chat"
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
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      <span className={styles.pulse} />
    </button>
  );
}
