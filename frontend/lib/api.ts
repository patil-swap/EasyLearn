const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface BookUploadResponse {
  book_id: string;
  title: string;
  status: string;
  cover_data?: string;
}

export interface SourceMetadata {
  chunk_id: string;
  page?: number;
  chapter?: string;
  excerpt: string;
}

export interface QueryResponse {
  answer: string;
  sources: SourceMetadata[];
}

export interface FeedbackPayload {
  book_id: string;
  tool_name: string;
  query_text: string | null;
  response_excerpt: string;
  rating: "up" | "down";
  reasons?: string[] | null;
  comment?: string | null;
  session_id: string;
  timestamp: string;
}

export const api = {
  uploadBook: async (file: File, bookType: string, fileFormat: string): Promise<BookUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("book_type", bookType);
    formData.append("file_format", fileFormat);

    const response = await fetch(`${API_BASE_URL}/books/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw { ...errorData, status: response.status };
    }

    return response.json();
  },

  getUploadStatus: async (book_id: string): Promise<{ book_id: string; status: string; code?: string; message?: string; cover_data?: string }> => {
    const response = await fetch(`${API_BASE_URL}/books/${book_id}/status`);
    if (!response.ok) {
      throw new Error("Failed to get status");
    }
    return response.json();
  },

  executeQuery: async (
    book_id: string,
    tool_name: string,
    query_text?: string,
    difficulty_level: string = "standard",
    scope?: string
  ): Promise<QueryResponse> => {
    const response = await fetch(`${API_BASE_URL}/query/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        book_id,
        tool_name,
        query_text,
        difficulty_level,
        scope,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to execute query");
    }

    return response.json();
  },

  clearMemory: async (bookId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/query/clear-memory`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ book_id: bookId }),
    });

    if (!response.ok) {
      throw new Error("Failed to clear conversation memory");
    }
  },

  submitFeedback: async (payload: FeedbackPayload): Promise<{ status: string }> => {
    const response = await fetch(`${API_BASE_URL}/feedback/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to submit feedback");
    }

    return response.json();
  },

  streamQuery: async (
    bookId: string,
    toolName: string,
    queryText: string,
    difficultyLevel: string,
    onToken: (token: string) => void,
    onSources: (sources: SourceMetadata[]) => void,
    onDone: () => void,
    onError: (error: string) => void,
    scope: string = "entire_book"
  ): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/query/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        book_id: bookId,
        tool_name: toolName,
        query_text: queryText,
        difficulty_level: difficultyLevel,
        scope,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      onError(error.detail || "Query failed");
      return;
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) return;

    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const part of parts) {
        const line = part.split("\n").find((l) => l.startsWith("data: "));
        if (line) {
          try {
            const data = JSON.parse(line.substring(6));
            if (data.type === "token") onToken(data.value);
            if (data.type === "sources") onSources(data.value);
            if (data.type === "done") onDone();
            if (data.type === "error") onError(data.value);
          } catch {
            // Malformed SSE line, skip
          }
        }
      }
    }

  }
}
