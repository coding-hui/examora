import { type LogtoConfig, LogtoProvider } from '@logto/react';
import type { ReactNode } from 'react';
import { logtoAppId, logtoEndpoint } from './consts';

export const createLogtoConfig = (): LogtoConfig | null => {
  if (!logtoAppId || !logtoEndpoint) {
    console.warn(
      'Logto configuration missing. Please set LOGTO_ENDPOINT and LOGTO_APP_ID environment variables.',
    );
    return null;
  }

  return {
    endpoint: logtoEndpoint,
    appId: logtoAppId,
  };
};

export interface LogtoAuthProviderProps {
  children: ReactNode;
}

export const LogtoAuthProvider = ({ children }: LogtoAuthProviderProps) => {
  const config = createLogtoConfig();

  if (!config) {
    // Return children without provider if not configured
    return <>{children}</>;
  }

  return <LogtoProvider config={config}>{children}</LogtoProvider>;
};
