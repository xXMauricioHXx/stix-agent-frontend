"use client";

import React, { useState } from "react";
import { WikiPage } from "@/adapters/azure-wiki.adapter";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Menu, MenuItem } from "@mui/material";
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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const hasChildren = page.subPages && page.subPages.length > 0;
  const isSelected = selectedPage?.path === page.path;
  const open = Boolean(anchorEl);

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

  const handleMenuClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnchorEl(null);
  };

  const handleEmbedPage = (e: React.MouseEvent) => {
    handleMenuClose(e);
    if (onEmbed) {
      onEmbed(page, "page");
    }
  };

  const handleEmbedTree = (e: React.MouseEvent) => {
    handleMenuClose(e);
    if (onEmbed) {
      onEmbed(page, "tree");
    }
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
            <button
              type="button"
              className={styles.menuButton}
              onClick={handleMenuClick}
            >
              <MoreVertIcon
                sx={{ fontSize: 16, color: "rgb(156, 163, 175)" }}
              />
            </button>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleMenuClose}
              onClick={(e) => e.stopPropagation()}
            >
              <MenuItem onClick={handleEmbedPage}>Inserir Página</MenuItem>
              {hasChildren && (
                <MenuItem onClick={handleEmbedTree}>Inserir Pasta</MenuItem>
              )}
            </Menu>
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
