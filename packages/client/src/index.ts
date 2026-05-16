import type {
  AuthConfig,
  AuthMeData,
  CandidateExamList,
  CandidatePaper,
  CandidateQuestion,
  CreateSubmissionPayload,
  CreatedSubmission,
  ExamSession,
  ExamSessionStatus,
  LoginPayload,
  LoginResponse,
  SaveAnswersPayload,
  SubmissionStatus,
} from '@examora/types';
import { API_PATHS } from '@examora/types';

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

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
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
  async authConfig(): Promise<AuthConfig> {
    return this.get(API_PATHS.auth.config);
  }

  async authLogin(payload: LoginPayload): Promise<LoginResponse> {
    const response = await this.post<LoginResponse>(API_PATHS.auth.login, payload);
    this.setAccessToken(response.token);
    return response;
  }

  async authLogout(): Promise<void> {
    await this.post<void>(API_PATHS.auth.logout);
    this.clearAccessToken();
  }

  async authMe(): Promise<AuthMeData> {
    return this.get(API_PATHS.auth.me);
  }

  async listAvailableExams(): Promise<CandidateExamList> {
    return this.get(API_PATHS.candidate.availableExams);
  }

  async startExamSession(
    examID: number | string,
    payload: { device_id?: string } = {},
  ): Promise<ExamSession> {
    return this.post(API_PATHS.candidate.startSession(examID), payload);
  }

  async getCandidatePaper(examID: number | string): Promise<CandidatePaper> {
    return this.get(API_PATHS.candidate.paper(examID));
  }

  async saveAnswers(
    examID: number | string,
    payload: SaveAnswersPayload,
  ): Promise<void> {
    await this.post(API_PATHS.candidate.answers(examID), payload);
  }

  async submitExam(examID: number | string): Promise<void> {
    await this.post(API_PATHS.candidate.submit(examID));
  }

  async createSubmission(
    payload: CreateSubmissionPayload,
  ): Promise<CreatedSubmission> {
    return this.post(API_PATHS.candidate.submissions, payload);
  }
}

// Re-export types for convenience
export type {
  AuthConfig,
  AuthMeData,
  CandidateExamList,
  CandidatePaper,
  CandidateQuestion,
  CreateSubmissionPayload,
  CreatedSubmission,
  ExamSession,
  ExamSessionStatus,
  LoginPayload,
  LoginResponse,
  SaveAnswersPayload,
  SubmissionStatus,
};
export { API_PATHS };
