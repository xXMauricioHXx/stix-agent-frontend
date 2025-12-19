export interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export interface QuestionRequest {
  conversation_id: string;
  question: string;
}

export interface QuestionResponse {
  answer: string;
  conversation_id: string;
  sources?: any[];
}

export interface ChatHistoryMessage {
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}
