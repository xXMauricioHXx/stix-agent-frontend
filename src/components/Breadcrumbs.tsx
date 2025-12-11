"use client";

import React from "react";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import HomeIcon from "@mui/icons-material/Home";
import styles from "./Breadcrumbs.module.css";

interface BreadcrumbsProps {
  path: string;
  onNavigate?: (path: string) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  path,
  onNavigate,
}) => {
  if (!path) return null;

  const segments = path.split("/").filter(Boolean);

  return (
    <nav className={styles.nav}>
      <button onClick={() => onNavigate?.("/")} className={styles.button}>
        <HomeIcon sx={{ fontSize: 16 }} />
        <span className={styles.homeButton}>Docs</span>
      </button>

      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        const segmentPath = "/" + segments.slice(0, index + 1).join("/");

        return (
          <React.Fragment key={segmentPath}>
            <ChevronRightIcon
              sx={{ fontSize: 16 }}
              className={styles.separator}
            />
            {isLast ? (
              <span className={styles.current}>{segment}</span>
            ) : (
              <button
                onClick={() => onNavigate?.(segmentPath)}
                className={styles.button}
              >
                {segment}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
