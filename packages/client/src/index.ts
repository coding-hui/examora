import type {
  ExamPaper,
  ExamSessionStatus,
  QuestionSnapshot,
  SubmissionStatus,
} from "@examora/types";

export interface ApiClientOptions {
  baseUrl: string;
  accessToken?: string;
}

export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  private async request<T>(
    path: string,
    init: RequestInit = {}
  ): Promise<T> {
    const { baseUrl, accessToken } = this.options;

    const headers = new Headers(init.headers);
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
    headers.set("Content-Type", "application/json");

    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, {
      method: "DELETE",
    });
  }

  setAccessToken(token: string) {
    this.options.accessToken = token;
  }

  clearAccessToken() {
    this.options.accessToken = undefined;
  }

  // Auth
  async authMe(): Promise<{ user_id: string; role: string }> {
    return this.get<{ user_id: string; role: string }>("/api/auth/me");
  }
}

// Re-export types for convenience
export type {
  ExamPaper,
  ExamSessionStatus,
  QuestionSnapshot,
  SubmissionStatus,
};
