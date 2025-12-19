import { NextRequest, NextResponse } from "next/server";
import { SupabaseAdapter } from "@/adapters/supabase.adapter";
import { OpenIAAdapter } from "@/adapters/openia.adapter";
import { AdapterFactory } from "@/adapters/factory";

/**
 * GET /api/chat/history
 * Retrieve conversation history for a given conversation_id
 *
 * Query parameters:
 * - conversation_id: string (required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversation_id");

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversation_id query parameter is required" },
        { status: 400 }
      );
    }

    console.log(
      `[Chat History API] Fetching history for conversation: ${conversationId}`
    );

    // Initialize adapter
    const openIAAdapter = AdapterFactory.createAdapter(
      "openia"
    ) as OpenIAAdapter;

    const supabaseAdapter = new SupabaseAdapter(openIAAdapter);

    // Fetch conversation history
    const messages = await supabaseAdapter.getConversationHistory(
      conversationId,
      50 // Fetch more messages for display purposes
    );

    console.log(`[Chat History API] Retrieved ${messages.length} messages`);

    return NextResponse.json(
      {
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          created_at: msg.created_at,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Chat History API] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
