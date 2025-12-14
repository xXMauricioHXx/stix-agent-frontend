import { NextRequest, NextResponse } from "next/server";
import { EmbeddingService } from "@/services/embedding.service";
import { AzureWikiAdapter, WikiPage } from "@/adapters/azure-wiki.adapter";
import { SupabaseAdapter } from "@/adapters/supabase.adapter";
import { AdapterFactory } from "@/adapters/factory";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { page, type } = body as { page: WikiPage; type: "page" | "tree" };

    if (!page || !type) {
      return NextResponse.json(
        { error: "Missing page or type" },
        { status: 400 }
      );
    }

    const azureWikiAdapter = AdapterFactory.createAdapter("azure-wiki");
    const supabaseAdapter = AdapterFactory.createAdapter("supabase");

    const embeddingService = new EmbeddingService(
      azureWikiAdapter as AzureWikiAdapter,
      supabaseAdapter as SupabaseAdapter
    );
    await embeddingService.processEmbedding(page, type);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in embed API:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
