import { QuestionRequest, QuestionResponse } from "@/types/chat";

const API_BASE_URL = "http://localhost:3001";
const API_TIMEOUT = 30000; // 30 seconds

export class ChatApiError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = "ChatApiError";
  }
}

export async function sendQuestion(question: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}/api/question`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question } as QuestionRequest),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        throw new ChatApiError(
          "Serviço temporariamente indisponível. Por favor, tente novamente.",
          404
        );
      }
      if (response.status >= 500) {
        throw new ChatApiError(
          "Erro no servidor. Por favor, tente novamente mais tarde.",
          response.status
        );
      }
      throw new ChatApiError(
        `Erro ao processar sua pergunta (${response.status})`,
        response.status
      );
    }

    const data: QuestionResponse = await response.json();
    return data.answer || "Desculpe, não consegui processar sua pergunta.";
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ChatApiError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new ChatApiError(
          "A requisição demorou muito. Por favor, tente novamente."
        );
      }
      if (error.message.includes("fetch")) {
        throw new ChatApiError(
          "Não foi possível conectar ao servidor. Verifique se o backend está rodando."
        );
      }
    }

    throw new ChatApiError("Erro inesperado. Por favor, tente novamente.");
  }
}
