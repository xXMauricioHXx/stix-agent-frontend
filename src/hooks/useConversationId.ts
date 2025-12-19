"use client";

import { useState } from "react";

/**
 * Custom hook to manage conversation ID for chat memory
 * Persists conversation ID in localStorage to maintain context across page refreshes
 *
 * @returns {Object} Object containing conversationId, resetConversation, and loadConversation functions
 */
export function useConversationId() {
  const STORAGE_KEY = "stix_conversation_id";

  // Lazy initialization - only runs once on mount
  const [conversationId, setConversationId] = useState<string>(() => {
    // Only run on client side
    if (typeof window === "undefined") return "";

    // Try to get existing conversation ID from localStorage
    const existingId = localStorage.getItem(STORAGE_KEY);

    if (existingId) {
      console.log(
        "[useConversationId] Loaded existing conversation:",
        existingId
      );
      return existingId;
    } else {
      // Generate new conversation ID
      const newId = crypto.randomUUID();
      console.log("[useConversationId] Created new conversation:", newId);
      localStorage.setItem(STORAGE_KEY, newId);
      return newId;
    }
  });

  /**
   * Reset the conversation by generating a new ID
   * Useful for starting a fresh conversation
   */
  const resetConversation = () => {
    if (typeof window === "undefined") return;

    const newId = crypto.randomUUID();

    console.log("[useConversationId] Reset conversation. New ID:", newId);
    localStorage.setItem(STORAGE_KEY, newId);
    setConversationId(newId);
  };

  /**
   * Load an existing conversation by ID
   * @param id - The conversation ID to load
   */
  const loadConversation = (id: string) => {
    if (typeof window === "undefined") return;

    console.log("[useConversationId] Loading conversation:", id);
    localStorage.setItem(STORAGE_KEY, id);
    setConversationId(id);
  };

  return {
    conversationId,
    resetConversation,
    loadConversation,
  };
}
