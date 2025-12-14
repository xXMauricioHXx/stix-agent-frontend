import { NextRequest, NextResponse } from "next/server";
import { SupabaseAdapter } from "@/adapters/supabase.adapter";
import { OpenIAAdapter } from "@/adapters/openia.adapter";
import { AdapterFactory } from "@/adapters/factory";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, contextPath, contextType } = body;

    if (!message || !contextPath) {
      return NextResponse.json(
        { error: "Missing message or contextPath" },
        { status: 400 }
      );
    }

    const supabaseAdapter = AdapterFactory.createAdapter(
      "supabase"
    ) as SupabaseAdapter;
    const openIAAdapter = AdapterFactory.createAdapter(
      "openia"
    ) as OpenIAAdapter;

    const filter = contextType === "page" ? { path: contextPath } : {};

    const { contextText, documents } = await supabaseAdapter.searchSimilar(
      message,
      {
        matchCount: 5,
        filter: filter,
      }
    );

    const response = await openIAAdapter.chat(contextText, message);

    return NextResponse.json({
      answer: response,
      sources: documents.map((d: any) => ({
        path: (d.metadata as any).path,
        similarity: d.similarity,
      })),
    });
  } catch (error: any) {
    console.error("Error in chat context API:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
