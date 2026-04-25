import type { CandidateExamPaperDto } from "@examora/shared-types";

export interface ApiClientOptions {
  baseUrl: string;
  accessToken?: string;
}

export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  async getHealth(): Promise<unknown> {
    return this.request("/api/health");
  }

  async getCandidatePaper(sessionId: number): Promise<CandidateExamPaperDto> {
    return this.request(`/api/client/exam-sessions/${sessionId}/paper`);
  }

  private async request(path: string): Promise<unknown> {
    const response = await fetch(`${this.options.baseUrl}${path}`, {
      headers: this.options.accessToken
        ? { Authorization: `Bearer ${this.options.accessToken}` }
        : undefined,
    });

    if (!response.ok) {
      throw new Error(`request failed: ${response.status}`);
    }

    return response.json();
  }
}
