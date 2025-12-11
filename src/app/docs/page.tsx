"use client";

import React, { useEffect, useState } from "react";
import { WikiPage } from "@/adapters/azure-wiki.adapter";
import { WikiContent } from "@/components/WikiContent";
import { DocsHeader } from "@/components/DocsHeader";
import { DocsSidebar } from "@/components/DocsSidebar";
import { TableOfContents } from "@/components/TableOfContents";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ThemeProvider } from "@/contexts/ThemeContext";
import styles from "./docs.module.css";

function DocsPageContent() {
  const [tree, setTree] = useState<WikiPage | null>(null);
  const [selectedPage, setSelectedPage] = useState<WikiPage | null>(null);
  const [content, setContent] = useState<string>("");
  const [isLoadingTree, setIsLoadingTree] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

    // Se já tiver conteúdo em cache no objeto:
    if (page.content) {
      setContent(page.content);
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

  if (isLoadingTree) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingContent}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Loading documentation...</p>
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
          <h2 className={styles.errorTitle}>Error Loading Documentation</h2>
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
