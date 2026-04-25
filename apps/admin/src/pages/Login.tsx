import LogtoClient from '@logto/browser';
import { Spin } from 'antd';
import { useEffect, useState } from 'react';
import { createLogtoConfig } from '@/auth/LogtoProvider';

const Login: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleAuth = async () => {
      const config = createLogtoConfig();
      if (!config) {
        setError('Logto not configured');
        setIsLoading(false);
        return;
      }

      const client = new LogtoClient(config);
      const url = new URL(window.location.href);

      // Check if this is a callback (has code or error in URL)
      const code = url.searchParams.get('code');
      const errorParam = url.searchParams.get('error');

      if (errorParam) {
        setError(
          `Authentication·failed:·${url.searchParams.get('error_description')}`,
        );
        setIsLoading(false);
        return;
      }

      if (code) {
        // This is the callback - handle sign in
        try {
          await client.handleSignInCallback(window.location.href);
          // Redirect to home after successful sign in
          window.location.href = '/';
        } catch (err) {
          console.error('Sign in callback error:', err);
          setError('Sign in failed');
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      client.signIn(`${window.location.origin}/login`);
    };

    void handleAuth();
  }, []);

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <p style={{ color: 'red' }}>{error}</p>
        <a href="/login">Retry</a>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Spin description="Login..." />
      </div>
    );
  }

  return null;
};

export default Login;
