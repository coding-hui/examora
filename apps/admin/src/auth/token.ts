const TOKEN_KEY = 'examora_access_token';

export interface AuthConfig {
  auth_mode: string;
  logto_enabled: boolean;
  has_local_users: boolean;
}

export interface LoginResponse {
  token: string;
  expires_at: number;
  user?: AuthMeData;
}

export interface AuthMeData {
  id: number;
  username: string;
  display_name?: string;
  roles?: string[];
  permissions?: Record<string, string[]>;
  external_subject?: string;
}

let cachedToken: string | null = null;

export const getAccessToken = (): string | null => {
  if (cachedToken) return cachedToken;
  cachedToken = localStorage.getItem(TOKEN_KEY);
  return cachedToken;
};

export const setAccessToken = (token: string): void => {
  cachedToken = token;
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearAuthStorage = (): void => {
  cachedToken = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('examora_user_profile');
};

export const getLocalProfile = (): AuthMeData | null => {
  const profile = localStorage.getItem('examora_user_profile');
  if (!profile) return null;
  try {
    return JSON.parse(profile) as AuthMeData;
  } catch {
    return null;
  }
};

export const setLocalProfile = (profile: AuthMeData): void => {
  localStorage.setItem('examora_user_profile', JSON.stringify(profile));
};
