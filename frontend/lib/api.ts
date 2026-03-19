const API_BASE_URL = "http://localhost:8000/api/v1";

export interface BookUploadResponse {
  book_id: string;
  title: string;
  status: string;
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

  getUploadStatus: async (book_id: string): Promise<{ book_id: string; status: string; code?: string; message?: string }> => {
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
    difficulty_level: string = "standard"
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
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to execute query");
    }

    return response.json();
  },
};
