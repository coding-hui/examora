import LogtoClient from '@logto/browser';
import { createLogtoConfig } from './LogtoProvider';

let logtoClient: LogtoClient | null = null;

export const getLogtoClient = (): LogtoClient | null => {
  const config = createLogtoConfig();
  if (!config) return null;
  if (!logtoClient) {
    logtoClient = new LogtoClient(config);
  }
  return logtoClient;
};

export const getAccessToken = async (): Promise<string | null> => {
  const client = getLogtoClient();
  if (!client) return null;
  return client.getAccessToken();
};

export const clearAuthStorage = () => {
  localStorage.removeItem('examora_access_token');
  localStorage.removeItem('examora_user_profile');
  logtoClient = null;
};
