"use client";

import React from "react";
import { WikiPage } from "@/adapters/azure-wiki.adapter";
import { WikiTree } from "./WikiTree";
import styles from "./DocsSidebar.module.css";

interface DocsSidebarProps {
  tree: WikiPage | null;
  selectedPage: WikiPage | null;
  onSelectPage: (page: WikiPage) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const DocsSidebar: React.FC<DocsSidebarProps> = ({
  tree,
  selectedPage,
  onSelectPage,
  isOpen = true,
  onClose,
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className={`${styles.overlay} ${isOpen ? styles.open : ""}`}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        <div className={styles.header}>
          <h2>Documentation</h2>
          <p>Browse all topics</p>
        </div>

        {/* Navigation Tree */}
        <div className={styles.content}>
          {tree ? (
            <WikiTree
              page={tree}
              onSelectPage={(page) => {
                onSelectPage(page);
                onClose?.();
              }}
              selectedPage={selectedPage}
            />
          ) : (
            <div className={styles.loading}>Loading navigation...</div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className={styles.footer}>
          <p>Stix Documentation</p>
          <p>Version 1.0.0</p>
        </div>
      </aside>
    </>
  );
};
