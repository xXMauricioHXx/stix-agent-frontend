export interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export interface QuestionRequest {
  question: string;
}

export interface QuestionResponse {
  answer: string;
  sources: {
    id: string;
    content: string;
    metadata: unknown;
    similarity: number;
  }[];
}
