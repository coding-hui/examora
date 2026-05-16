import { API_PATHS } from '@examora/types';
import { request } from '@umijs/max';
import type { AuthConfig } from './token';

export const fetchAuthConfig = async (): Promise<AuthConfig> => {
  const response = await request<AuthConfig>(API_PATHS.auth.config, {
    method: 'GET',
  });
  return response;
};
