"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./WikiContent.module.css";

interface WikiContentProps {
  content: string;
  isLoading: boolean;
  title?: string;
}

export const WikiContent: React.FC<WikiContentProps> = ({
  content,
  isLoading,
  title,
}) => {
  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingContent}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Loading content...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className={styles.emptyTitle}>Nenhuma página selecionada</h3>
        <p className={styles.emptyDescription}>
          Selecione uma página do menu lateral para visualizar seu conteúdo
        </p>
      </div>
    );
  }

  return (
    <article className={styles.article}>
      {/* Page Title */}
      {title && (
        <div className={styles.header}>
          <h1 className={styles.title}>
            {title.split("/").pop()?.replace(".md", "") || title}
          </h1>
          <p className={styles.subtitle}>{title}</p>
        </div>
      )}

      {/* Markdown Content */}
      <div className={`${styles.content} prose prose-slate dark:prose-invert`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children, ...props }) => (
              <h1
                id={children
                  ?.toString()
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/(^-|-$)/g, "")}
                {...props}
              >
                {children}
              </h1>
            ),
            h2: ({ children, ...props }) => (
              <h2
                id={children
                  ?.toString()
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/(^-|-$)/g, "")}
                {...props}
              >
                {children}
              </h2>
            ),
            h3: ({ children, ...props }) => (
              <h3
                id={children
                  ?.toString()
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/(^-|-$)/g, "")}
                {...props}
              >
                {children}
              </h3>
            ),
            a: ({ children, ...props }) => (
              <a {...props} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </article>
  );
};
