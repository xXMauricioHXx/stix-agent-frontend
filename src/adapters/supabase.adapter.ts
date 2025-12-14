import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { OpenIAAdapter } from "./openia.adapter";

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

      for (const embedding of embeddings) {
        const { error } = await this.supabase.from("documents").insert({
          content,
          metadata,
          embedding,
        });

        if (error) {
          console.error("Error saving document to Supabase:", error);
          throw error;
        }
      }
    } catch (error) {
      console.error("Error in saveDocument:", error);
      throw error;
    }
  }
}
