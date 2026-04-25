import type { ExamPaper } from "@examora/types";

export interface ApiClientOptions {
  baseUrl: string;
  accessToken?: string;
}

export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}
}
