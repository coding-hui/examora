import { request } from '@umijs/max';
import { Button, Divider, Form, Input, message, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { fetchAuthConfig } from '@/auth/config';
import type { AuthConfig, LoginResponse } from '@/auth/token';
import { setAccessToken, setLocalProfile } from '@/auth/token';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await fetchAuthConfig();
        setAuthConfig(config);
      } catch (err) {
        console.error('Failed to fetch auth config:', err);
        setError('Failed to load authentication configuration');
      }
    };
    void loadConfig();

    // Handle Logto callback with token in URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setAccessToken(token);
      message.success('SSO login successful');
      window.location.href = '/';
    }
  }, []);

  const handleSubmit = async (values: {
    username: string;
    password: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await request<LoginResponse>('/api/auth/login', {
        method: 'POST',
        data: {
          username: values.username,
          password: values.password,
        },
      });

      if (response.token) {
        setAccessToken(response.token);
        if (response.user) {
          setLocalProfile(response.user);
        }
        message.success('Login successful');
        window.location.href = '/';
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      const errorMsg =
        err?.info?.errorMessage || err?.message || 'Login failed';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogtoLogin = () => {
    window.location.href = '/api/auth/logto/login';
  };

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
        <Text type="danger">{error}</Text>
        <Button onClick={() => setError(null)}>Retry</Button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f0f2f5',
      }}
    >
      <div
        style={{
          width: 400,
          padding: 32,
          background: 'white',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2}>Examora Admin</Title>
          <Text type="secondary">Sign in to your account</Text>
        </div>

        <Form
          name="login"
          onFinish={handleSubmit}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please enter your username' }]}
          >
            <Input placeholder="Username" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password placeholder="Password" size="large" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={isLoading}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        {authConfig?.logto_enabled && (
          <>
            <Divider plain>or</Divider>
            <Button size="large" block onClick={handleLogtoLogin}>
              Sign in with SSO
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
