import { OpenIAAdapter } from "../adapters/openia.adapter";
import { SupabaseAdapter } from "../adapters/supabase.adapter";

export class QuestionUseCase {
  constructor(
    private openIAAdapter: OpenIAAdapter,
    private supabaseAdapter: SupabaseAdapter
  ) {}

  async execute(question: string) {
    const matches = await this.supabaseAdapter.searchSimilar(question, {
      matchCount: 5,
      filter: {},
    });

    if (!matches || matches.length === 0) {
      return {
        answer:
          "Não encontrei informações relevantes na base de conhecimento para responder essa pergunta.",
        sources: [],
      };
    }

    // 2) Montar o contexto a partir dos chunks
    const context = matches
      .map(
        (m, idx) =>
          `Fonte ${idx + 1} (similaridade: ${m.similarity.toFixed(3)}):\n${
            m.content
          }`
      )
      .join("\n\n---\n\n");

    const { answer } = await this.openIAAdapter.chat(context, question);

    return {
      answer,
      sources: matches,
    };
  }
}
