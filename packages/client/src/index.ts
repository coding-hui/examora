import type {
  ExamPaper,
  ExamSessionStatus,
  QuestionSnapshot,
  SubmissionStatus,
} from '@examora/types';

export interface ApiClientOptions {
  baseUrl: string;
  accessToken?: string;
}

export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const { baseUrl, accessToken } = this.options;

    const headers = new Headers(init.headers);
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
    headers.set('Content-Type', 'application/json');

    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        payload?.message || payload?.error || `HTTP ${response.status}`,
      );
    }

    if (
      payload &&
      typeof payload === 'object' &&
      'code' in payload &&
      'data' in payload
    ) {
      if (payload.code !== 0) {
        throw new Error(payload.message || `API error ${payload.code}`);
      }
      return payload.data as T;
    }

    return payload as T;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, {
      method: 'DELETE',
    });
  }

  setAccessToken(token: string) {
    this.options.accessToken = token;
  }

  clearAccessToken() {
    this.options.accessToken = undefined;
  }

  // Auth
  async authMe(): Promise<{
    user_id: number;
    external_subject: string;
    display_name: string | null;
    email?: string | null;
    role: string | null;
    role_code: string | null;
    status: string;
  }> {
    return this.get('/api/auth/me');
  }
}

// Re-export types for convenience
export type {
  ExamPaper,
  ExamSessionStatus,
  QuestionSnapshot,
  SubmissionStatus,
};
