import { request } from '@umijs/max';
import type { AuthConfig } from './token';

export const fetchAuthConfig = async (): Promise<AuthConfig> => {
  const response = await request<AuthConfig>('/api/auth/config', {
    method: 'GET',
  });
  return response;
};
