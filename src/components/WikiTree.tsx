"use client";

import React, { useState } from "react";
import { WikiPage } from "@/adapters/azure-wiki.adapter";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import styles from "./WikiTree.module.css";

interface WikiTreeProps {
  page: WikiPage;
  onSelectPage: (page: WikiPage) => void;
  selectedPage?: WikiPage | null;
  level?: number;
  onEmbed?: (page: WikiPage, type: "page" | "tree") => void;
}

export const WikiTree: React.FC<WikiTreeProps> = ({
  page,
  onSelectPage,
  selectedPage,
  level = 0,
  onEmbed,
}) => {
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const hasChildren = page.subPages && page.subPages.length > 0;
  const isSelected = selectedPage?.path === page.path;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsExpanded((prev) => !prev);
    }
  };

  const handleSelectPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectPage(page);
  };

  const label = (
    page.gitItemPath?.split("/").pop()?.replace(".md", "") || page.path
  )
    .replace(/-/g, " ")
    .replace(/%/g, "");

  return (
    <div className={styles.item}>
      <div
        className={`${styles.row} ${isSelected ? styles.selected : ""}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {/* Expand/Collapse Icon */}
        <span onClick={handleToggle} className={styles.expandButton}>
          {hasChildren ? (
            isExpanded ? (
              <ExpandMoreIcon
                sx={{ fontSize: 16, color: "rgb(107, 114, 128)" }}
              />
            ) : (
              <ChevronRightIcon
                sx={{ fontSize: 16, color: "rgb(107, 114, 128)" }}
              />
            )
          ) : (
            <span className={styles.spacer} />
          )}
        </span>

        {/* Icon + Title */}
        <div onClick={handleSelectPage} className={styles.content}>
          {hasChildren ? (
            <FolderOutlinedIcon
              sx={{ fontSize: 16, color: "rgb(107, 114, 128)" }}
            />
          ) : (
            <InsertDriveFileOutlinedIcon
              sx={{ fontSize: 16, color: "rgb(107, 114, 128)" }}
            />
          )}

          <span
            className={`${styles.label} ${isSelected ? styles.selected : ""}`}
          >
            {label}
          </span>
        </div>

        {/* Menu (only when selected) */}
        {isSelected && (
          <>
            <button type="button" className={styles.menuButton}>
              <MoreVertIcon
                sx={{ fontSize: 16, color: "rgb(156, 163, 175)" }}
              />
            </button>
          </>
        )}
      </div>

      {isExpanded && hasChildren && (
        <div className={styles.children}>
          {page.subPages!.map((subPage) => (
            <WikiTree
              key={subPage.path}
              page={subPage}
              onSelectPage={onSelectPage}
              selectedPage={selectedPage}
              level={level + 1}
              onEmbed={onEmbed}
            />
          ))}
        </div>
      )}
    </div>
  );
};
