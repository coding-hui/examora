import { Spin } from 'antd';
import { useEffect, useState } from 'react';
import { getLogtoClient } from '@/auth/token';

const Login: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleAuth = async () => {
      const client = getLogtoClient();
      if (!client) {
        setError('Logto not configured');
        setIsLoading(false);
        return;
      }

      // Check if already authenticated — avoid infinite redirect loop
      const isAuth = await client.isAuthenticated();
      if (isAuth) {
        window.location.href = '/';
        return;
      }

      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const errorParam = url.searchParams.get('error');

      if (errorParam) {
        setError(
          `Authentication failed: ${url.searchParams.get('error_description')}`,
        );
        setIsLoading(false);
        return;
      }

      if (code) {
        try {
          await client.handleSignInCallback(window.location.href);
          // Token is fetched from LogtoClient directly by getAccessToken() — no localStorage needed
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
