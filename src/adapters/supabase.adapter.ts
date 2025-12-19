import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { OpenIAAdapter } from "./openia.adapter";
import { WikiPageRecord } from "@/types/wiki-pages.types";

export class SupabaseAdapter {
  private supabaseKey: string;
  private supabaseUrl: string;
  private supabase: SupabaseClient;

  constructor(private readonly openIAAdapter: OpenIAAdapter) {
    this.supabaseKey = String(process.env.SUPABASE_KEY || "");
    this.supabaseUrl = "https://vntetwmvkpauzrvjxuvr.supabase.co";
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  async searchSimilar(
    query: string,
    options?: {
      matchCount?: number;
      filter?: Record<string, unknown>;
    }
  ) {
    const matchCount = options?.matchCount ?? 5;
    const queryEmbedding = await this.openIAAdapter.embedding(query);

    const rpc = this.supabase.rpc("match_documents", {
      query_embedding: queryEmbedding,
      match_count: matchCount,
    });

    const { data, error } = await rpc;

    if (error) {
      console.error("Erro ao buscar similaridade no Supabase:", error);
      throw error;
    }

    const contextText = data
      .map(
        (doc: any) =>
          `[${doc.metadata && (doc.metadata as any).path}]: ${doc.content}`
      )
      .join("\n\n");

    return {
      contextText,
      documents: data,
    };
  }

  async saveDocument(content: string, metadata: Record<string, unknown>) {
    try {
      const embeddings = await this.openIAAdapter.chunkEmbedding(
        content,
        metadata
      );

      for (const item of embeddings) {
        const { content, metadata, embedding } = item;

        const { error, data, status } = await this.supabase
          .from("documents")
          .insert({
            content,
            metadata,
            embedding,
          });

        if (error) {
          console.error("Error saving document to Supabase:", error);
          throw error;
        }

        console.log("Document saved to Supabase:", data, "Status:", status);
      }
    } catch (error) {
      console.error("Error in saveDocument:", error);
      throw error;
    }
  }

  // Wiki Pages Management

  async getWikiPage(pageId: string): Promise<WikiPageRecord | null> {
    const { data, error } = await this.supabase
      .from("wiki_pages")
      .select("*")
      .eq("page_id", pageId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return null;
      }
      console.error("Error fetching wiki page:", error);
      throw error;
    }

    return data as WikiPageRecord;
  }

  async upsertWikiPage(record: Partial<WikiPageRecord>): Promise<void> {
    const now = new Date().toISOString();
    const dataToUpsert = {
      ...record,
      updated_at: now,
      created_at: record.created_at || now,
    };

    const { error } = await this.supabase
      .from("wiki_pages")
      .upsert(dataToUpsert, { onConflict: "page_id" });

    if (error) {
      console.error("Error upserting wiki page:", error);
      throw error;
    }
  }

  async deleteDocumentsByPageId(pageId: string): Promise<void> {
    const { error } = await this.supabase
      .from("documents")
      .delete()
      .eq("metadata->>kind", "azure_wiki")
      .eq("metadata->>page_id", pageId);

    if (error) {
      console.error("Error deleting documents by page_id:", error);
      throw error;
    }
  }

  async insertDocument(
    content: string,
    embedding: number[],
    metadata: Record<string, any>
  ): Promise<void> {
    const { error } = await this.supabase.from("documents").insert({
      content,
      metadata,
      embedding,
    });

    if (error) {
      console.error("Error inserting document:", error);
      throw error;
    }
  }

  async searchSimilarByPageId(
    query: string,
    pageId: string,
    matchCount: number = 5
  ) {
    const queryEmbedding = await this.openIAAdapter.embedding(query);

    const { data, error } = await this.supabase.rpc("match_documents", {
      query_embedding: queryEmbedding,
      match_count: matchCount,
      filter: { page_id: pageId },
    });

    if (error) {
      console.error("Erro ao buscar similaridade no Supabase:", error);
      throw error;
    }

    const contextText = data
      .map(
        (doc: any) =>
          `[${doc.metadata && (doc.metadata as any).path}]: ${doc.content}`
      )
      .join("\n\n");

    return {
      contextText,
      documents: data,
    };
  }

  async saveMessage(
    conversationId: string,
    role: "user" | "assistant" | "system",
    content: string
  ): Promise<void> {
    const { error } = await this.supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      role,
      content,
    });

    if (error) {
      console.error("Error saving chat message:", error);
      throw error;
    }

    console.log(
      `[SupabaseAdapter] Saved ${role} message to conversation ${conversationId}`
    );
  }

  async getConversationHistory(
    conversationId: string,
    limit: number = 12
  ): Promise<Array<{ role: string; content: string; created_at: string }>> {
    const { data, error } = await this.supabase
      .from("chat_messages")
      .select("role, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching conversation history:", error);
      throw error;
    }

    // Reverse to get chronological order (oldest first)
    const messages = (data || []).reverse();

    console.log(
      `[SupabaseAdapter] Retrieved ${messages.length} messages for conversation ${conversationId}`
    );

    return messages;
  }
}
