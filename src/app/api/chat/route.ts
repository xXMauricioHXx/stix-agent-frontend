import { NextRequest, NextResponse } from "next/server";
import { OpenIAAdapter } from "@/adapters/openia.adapter";
import { SupabaseAdapter } from "@/adapters/supabase.adapter";
import { AdapterFactory } from "@/adapters/factory";

/**
 * POST /api/chat
 * Unified chat endpoint with conversation memory support
 *
 * Request body:
 * {
 *   "conversation_id": "string",
 *   "question": "string"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversation_id, question } = body;

    // Validate required fields
    if (!conversation_id || typeof conversation_id !== "string") {
      return NextResponse.json(
        { error: "conversation_id is required and must be a string" },
        { status: 400 }
      );
    }

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "question is required and must be a string" },
        { status: 400 }
      );
    }

    console.log(
      `[Chat API] Processing question for conversation: ${conversation_id}`
    );

    // Initialize adapters
    const openIAAdapter = AdapterFactory.createAdapter(
      "openia"
    ) as OpenIAAdapter;

    const supabaseAdapter = AdapterFactory.createAdapter(
      "supabase"
    ) as SupabaseAdapter;

    // Step 1: Save user message to database
    console.log(`[Chat API] Saving user message`);
    await supabaseAdapter.saveMessage(conversation_id, "user", question);

    // Step 2: Fetch conversation history (last 12 messages)
    console.log(`[Chat API] Fetching conversation history`);
    const historyMessages = await supabaseAdapter.getConversationHistory(
      conversation_id,
      12
    );

    // Step 3: Convert history to LangChain format
    const chatHistory =
      openIAAdapter.convertToLangChainMessages(historyMessages);
    console.log(
      `[Chat API] Converted ${chatHistory.length} messages to LangChain format`
    );

    // Step 4: Enrich question for better RAG retrieval
    console.log(`[Chat API] Enriching question`);
    const enrichedQuestion = await openIAAdapter.enrichQuestion(question);
    console.log(`[Chat API] Enriched question:`, enrichedQuestion);

    // Step 5: Search for similar documents (RAG)
    console.log(`[Chat API] Searching for similar documents`);
    const { contextText, documents } = await supabaseAdapter.searchSimilar(
      enrichedQuestion,
      {
        matchCount: 5,
        filter: {},
      }
    );

    // Step 6: Generate answer with chat history
    let answer: string;

    if (!contextText) {
      answer =
        "Não encontrei informações relevantes na base de conhecimento para responder essa pergunta.";
      console.log(`[Chat API] No context found, using default response`);
    } else {
      console.log(
        `[Chat API] Generating answer with ${documents.length} context documents`
      );
      answer = await openIAAdapter.chat(contextText, question, chatHistory);
    }

    // Step 7: Save assistant response to database
    console.log(`[Chat API] Saving assistant response`);
    await supabaseAdapter.saveMessage(conversation_id, "assistant", answer);

    // Step 8: Return response
    return NextResponse.json(
      {
        answer,
        conversation_id,
        sources: documents || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Chat API] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
