export type WikiPageStatus = "processing" | "ready" | "failed";

export interface WikiPageRecord {
  page_id: string;
  path: string;
  title: string;
  content_hash: string;
  status: WikiPageStatus;
  chunk_count: number;
  last_indexed_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface IndexResult {
  indexed: boolean;
  changed: boolean;
  status: WikiPageStatus;
  chunk_count?: number;
  error?: string;
}

export interface ChunkResult {
  chunk_index: number;
  heading: string | null;
  content: string;
}
