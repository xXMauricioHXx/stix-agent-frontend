"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { WikiPage } from "@/adapters/azure-wiki.adapter";
import { WikiContent } from "@/components/WikiContent";
import { DocsHeader } from "@/components/DocsHeader";
import { DocsSidebar } from "@/components/DocsSidebar";
import { TableOfContents } from "@/components/TableOfContents";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import ChatDrawer from "@/components/ChatDrawer";
import FloatingChatButton from "@/components/FloatingChatButton";
import { ThemeProvider } from "@/contexts/ThemeContext";
import styles from "./page.module.css";

function DocsPageContent() {
  const [tree, setTree] = useState<WikiPage | null>(null);
  const [selectedPage, setSelectedPage] = useState<WikiPage | null>(null);
  const [content, setContent] = useState<string>("");
  const [isLoadingTree, setIsLoadingTree] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGlobalChatOpen, setIsGlobalChatOpen] = useState(false);
  const [drawerContext, setDrawerContext] = useState<{
    path: string;
    type: "page" | "tree";
  } | null>(null);
  const [drawerInitialMessage, setDrawerInitialMessage] = useState<
    string | undefined
  >(undefined);
  const [indexingStatus, setIndexingStatus] = useState<{
    isIndexing: boolean;
    path: string | null;
  }>({ isIndexing: false, path: null });

  useEffect(() => {
    async function fetchTree() {
      try {
        const response = await fetch("/api/wiki?type=tree");
        if (!response.ok) {
          throw new Error("Failed to fetch wiki tree");
        }

        const data = await response.json();
        setTree(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoadingTree(false);
      }
    }

    fetchTree();
  }, []);

  const handleSelectPage = async (page: WikiPage) => {
    setSelectedPage(page);
    setIsMobileMenuOpen(false);

    if (page.content) {
      setContent(page.content);
      // Trigger lazy indexing in background
      triggerLazyIndexing(page.path);
      return;
    }

    if (page.url) {
      setIsLoadingContent(true);

      try {
        const response = await fetch(
          `/api/wiki?type=content&url=${encodeURIComponent(page.url)}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch content");
        }
        const data = await response.json();
        setContent(data.content);

        // Trigger lazy indexing in background
        triggerLazyIndexing(page.path);
      } catch (err) {
        console.error(err);
        setContent("Error loading content.");
      } finally {
        setIsLoadingContent(false);
      }
    } else {
      setContent("");
    }
  };

  // Trigger lazy indexing in background (non-blocking)
  const triggerLazyIndexing = async (path: string) => {
    try {
      console.log(`[Lazy Index] Triggering indexing for: ${path}`);

      // Set indexing status
      setIndexingStatus({ isIndexing: true, path });

      // Show toast notification
      const toastId = toast.loading("Adicionando a base de conhecimento...", {
        position: "bottom-right",
      });

      const response = await fetch("/api/wiki/index", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`[Lazy Index] Result:`, result);

        if (result.changed) {
          console.log(
            `[Lazy Index] Page reindexed with ${result.chunk_count} chunks`
          );
          toast.update(toastId, {
            render: `Página adicionada à base de conhecimento`,
            type: "success",
            isLoading: false,
            autoClose: 3000,
          });
        } else {
          console.log(`[Lazy Index] Page already indexed, skipped`);
          toast.update(toastId, {
            render: "Página já adicionada à base de conhecimento",
            type: "info",
            isLoading: false,
            autoClose: 2000,
          });
        }
      } else {
        console.error(
          `[Lazy Index] Failed to index page:`,
          await response.text()
        );
        toast.update(toastId, {
          render: "Erro ao adicionar página à base de conhecimento",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error(`[Lazy Index] Error triggering indexing:`, error);
      toast.error("Erro ao adicionar página à base de conhecimento");
      // Don't block UI on indexing errors
    } finally {
      // Clear indexing status
      setIndexingStatus({ isIndexing: false, path: null });
    }
  };

  const handleEmbed = async (page: WikiPage, type: "page" | "tree") => {
    const toastId = toast.loading("Processando embedding...");

    try {
      console.log(`Embedding ${type}:`, page.path);
      const response = await fetch("/api/embed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ page, type }),
      });

      if (!response.ok) {
        throw new Error("Failed to embed content");
      }

      toast.update(toastId, {
        render: "Embedding concluído!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      // Extract page name from path
      const pageName =
        page.path.split("/").pop()?.replace(".md", "").replace(/-/g, " ") ||
        page.path;

      // Set context and initial message for drawer
      setDrawerContext({ path: page.path, type });
      setDrawerInitialMessage(
        `Olá! 👋 Agora podemos falar sobre **${pageName}**. Como posso ajudá-lo?`
      );
      setIsGlobalChatOpen(true);
    } catch (error) {
      console.error("Error embedding content:", error);
      toast.update(toastId, {
        render: "Erro ao processar embedding",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  if (isLoadingTree) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingContent}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Carregando documentação...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <div className={styles.errorContent}>
          <div className={styles.errorIcon}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className={styles.errorTitle}>Erro ao carregar documentação</h2>
          <p className={styles.errorMessage}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      {/* Header */}
      <DocsHeader
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Main Layout */}
      <div className={styles.main}>
        {/* Sidebar */}
        <DocsSidebar
          tree={tree}
          selectedPage={selectedPage}
          onSelectPage={handleSelectPage}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          onEmbed={handleEmbed}
        />

        {/* Main Content Area */}
        <main className={styles.contentWrapper}>
          <div className={styles.contentContainer}>
            {/* Content */}
            <div className={styles.content}>
              <Breadcrumbs path={selectedPage?.path || ""} />
              <WikiContent
                content={content}
                isLoading={isLoadingContent}
                title={selectedPage?.path}
              />
            </div>

            {/* Table of Contents */}
            <TableOfContents content={content} />
          </div>
        </main>
      </div>

      {/* Chat Drawer */}
      <ChatDrawer
        isOpen={isGlobalChatOpen}
        onClose={() => {
          setIsGlobalChatOpen(false);
          // Reset context when closing
          setDrawerContext(null);
          setDrawerInitialMessage(undefined);
        }}
        contextPath={drawerContext?.path}
        contextType={drawerContext?.type}
        initialMessage={drawerInitialMessage}
        pageContent={content}
      />

      {/* Floating Chat Button */}
      {!isGlobalChatOpen && (
        <FloatingChatButton onClick={() => setIsGlobalChatOpen(true)} />
      )}
    </div>
  );
}

export default function DocsPage() {
  return (
    <ThemeProvider>
      <DocsPageContent />
    </ThemeProvider>
  );
}
