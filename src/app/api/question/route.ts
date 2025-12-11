import { NextRequest, NextResponse } from "next/server";
import { QuestionUseCase } from "@/use-cases/question.use-case";
import { OpenIAAdapter } from "@/adapters/openia.adapter";
import { SupabaseAdapter } from "@/adapters/supabase.adapter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Question is required and must be a string" },
        { status: 400 }
      );
    }

    const openIAAdapter = new OpenIAAdapter();
    const supabaseAdapter = new SupabaseAdapter();
    const questionUseCase = new QuestionUseCase(openIAAdapter, supabaseAdapter);

    const result = await questionUseCase.execute(question);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error processing question:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
