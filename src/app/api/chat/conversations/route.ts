import { NextResponse } from "next/server";
import { SupabaseAdapter } from "@/adapters/supabase.adapter";
import { OpenIAAdapter } from "@/adapters/openia.adapter";
import { AdapterFactory } from "@/adapters/factory";

/**
 * GET /api/chat/conversations
 * Retrieve list of distinct conversations (one per conversation_id)
 * Returns the first user message of each conversation
 */
export async function GET() {
  try {
    console.log("[Conversations API] Fetching conversation list");

    // Initialize adapter
    const openIAAdapter = AdapterFactory.createAdapter(
      "openia"
    ) as OpenIAAdapter;

    const supabaseAdapter = new SupabaseAdapter(openIAAdapter);

    // Get distinct conversations using the SQL query
    const { data, error } = await supabaseAdapter["supabase"]
      .rpc("get_distinct_conversations")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      // Fallback to manual query if RPC doesn't exist
      console.log("[Conversations API] RPC not found, using fallback query");

      const { data: fallbackData, error: fallbackError } =
        await supabaseAdapter["supabase"]
          .from("chat_messages")
          .select("conversation_id, content, created_at")
          .eq("role", "user")
          .order("created_at", { ascending: false })
          .limit(100);

      if (fallbackError) {
        throw fallbackError;
      }

      // Group by conversation_id and get the first message
      const conversationsMap = new Map();
      fallbackData?.forEach((msg: any) => {
        if (!conversationsMap.has(msg.conversation_id)) {
          conversationsMap.set(msg.conversation_id, {
            conversation_id: msg.conversation_id,
            first_message: msg.content,
            created_at: msg.created_at,
          });
        }
      });

      const conversations = Array.from(conversationsMap.values())
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 50);

      console.log(
        `[Conversations API] Retrieved ${conversations.length} conversations (fallback)`
      );

      return NextResponse.json(
        {
          conversations,
        },
        { status: 200 }
      );
    }

    console.log(
      `[Conversations API] Retrieved ${data?.length || 0} conversations`
    );

    return NextResponse.json(
      {
        conversations: data || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Conversations API] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
