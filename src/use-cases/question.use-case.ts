import { OpenIAAdapter } from "../adapters/openia.adapter";
import { SupabaseAdapter } from "../adapters/supabase.adapter";

export class QuestionUseCase {
  constructor(
    private openIAAdapter: OpenIAAdapter,
    private supabaseAdapter: SupabaseAdapter
  ) {}

  async execute(question: string) {
    const { contextText, documents } = await this.supabaseAdapter.searchSimilar(
      question,
      {
        matchCount: 5,
        filter: {},
      }
    );

    if (!contextText) {
      return {
        answer:
          "Não encontrei informações relevantes na base de conhecimento para responder essa pergunta.",
        sources: [],
      };
    }

    const answer = await this.openIAAdapter.chat(contextText, question);

    return {
      answer,
      sources: documents,
    };
  }
}
