import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export class SupabaseAdapter {
  private supabaseKey: string;
  private supabaseUrl: string;
  private supabase: SupabaseClient;
  private embeddings: OpenAIEmbeddings;

  constructor() {
    this.supabaseKey = String(process.env.SUPABASE_KEY || "");
    this.supabaseUrl = "https://vntetwmvkpauzrvjxuvr.supabase.co";
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);

    this.embeddings = new OpenAIEmbeddings({
      apiKey: process.env["OPENAI_API_KEY"],
      model: "text-embedding-3-small",
    });
  }

  async searchSimilar(
    query: string,
    options?: {
      matchCount?: number;
      filter?: Record<string, unknown>;
    }
  ) {
    const matchCount = options?.matchCount ?? 5;
    const filter = options?.filter ?? {};

    const queryEmbedding = await this.embeddings.embedQuery(query);

    const { data, error } = await this.supabase.rpc("match_documents", {
      query_embedding: queryEmbedding,
      match_count: matchCount,
      filter: filter,
    });

    if (error) {
      console.error("Erro ao buscar similaridade no Supabase:", error);
      throw error;
    }

    return data as {
      id: string;
      content: string;
      metadata: unknown;
      similarity: number;
    }[];
  }
}
