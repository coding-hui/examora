import {
  AuditOutlined,
  CloudServerOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { request } from '@umijs/max';
import { Alert, Button, Divider, Form, Input, message, Typography } from 'antd';
import { useEffect, useState } from 'react';
import type { AuthConfig, LoginResponse } from '@/auth/token';
import { setAccessToken, setLocalProfile } from '@/auth/token';
import './Login.less';

const { Text, Title } = Typography;

const fallbackAuthConfig: AuthConfig = {
  auth_mode: 'local',
  logto_enabled: false,
  has_local_users: true,
};

type ApiEnvelope<T> = {
  code?: number;
  message?: string;
  data?: T;
};

const unwrapData = <T,>(response: T | ApiEnvelope<T>): T => {
  if (
    response &&
    typeof response === 'object' &&
    'data' in response &&
    (response as ApiEnvelope<T>).data
  ) {
    return (response as ApiEnvelope<T>).data as T;
  }
  return response as T;
};

const Login: React.FC = () => {
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await request<AuthConfig | ApiEnvelope<AuthConfig>>(
          '/api/auth/config',
          {
            method: 'GET',
          },
        );
        setAuthConfig(unwrapData(response));
      } catch (err) {
        console.error('Failed to fetch auth config:', err);
        setAuthConfig(fallbackAuthConfig);
      }
    };
    void loadConfig();

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
      const response = await request<
        LoginResponse | ApiEnvelope<LoginResponse>
      >('/api/auth/login', {
        method: 'POST',
        data: values,
      });
      const loginResult = unwrapData(response);

      if (loginResult.token) {
        setAccessToken(loginResult.token);
        if (loginResult.user) {
          setLocalProfile(loginResult.user);
        }
        message.success('登录成功');
        window.location.href = '/';
        return;
      }

      setError('登录响应缺少访问令牌，请联系管理员。');
    } catch (err: any) {
      console.error('Login failed:', err);
      const errorMsg =
        err?.info?.errorMessage || err?.message || '登录失败，请检查用户名密码';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogtoLogin = () => {
    window.location.href = '/api/auth/logto/login';
  };

  return (
    <main className="examora-login">
      <section className="examora-login__brand" aria-label="Examora overview">
        <div className="examora-login__brand-top">
          <img src="/logo.svg" alt="Examora" className="examora-login__logo" />
          <span className="examora-login__brand-name">Examora</span>
        </div>

        <div className="examora-login__brand-copy">
          <Text className="examora-login__eyebrow">Admin Console</Text>
          <Title level={1}>考试运营与评测管理后台</Title>
          <Text className="examora-login__lead">
            集中管理题库、试卷、考试发布、考生记录与评测结果，面向严肃考试场景构建。
          </Text>
        </div>

        <div className="examora-login__signals" aria-label="Platform signals">
          <div className="examora-login__signal">
            <div className="examora-login__signal-icon">
              <AuditOutlined />
            </div>
            <div>
              <span className="examora-login__signal-title">
                Exam Lifecycle
              </span>
              <span className="examora-login__signal-desc">
                Publish, schedule, and track exam operations.
              </span>
            </div>
          </div>
          <div className="examora-login__signal">
            <div className="examora-login__signal-icon">
              <CloudServerOutlined />
            </div>
            <div>
              <span className="examora-login__signal-title">
                Judge Pipeline
              </span>
              <span className="examora-login__signal-desc">
                Review submissions and monitor execution status.
              </span>
            </div>
          </div>
          <div className="examora-login__signal">
            <div className="examora-login__signal-icon">
              <SafetyCertificateOutlined />
            </div>
            <div>
              <span className="examora-login__signal-title">
                Access Control
              </span>
              <span className="examora-login__signal-desc">
                Manage admin roles and protected workflows.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="examora-login__panel" aria-label="Sign in">
        <div className="examora-login__card">
          <div className="examora-login__card-header">
            <Text className="examora-login__section-label">Secure access</Text>
            <Title level={2}>登录后台</Title>
            <Text>使用管理员账号进入 Examora 控制台。</Text>
          </div>

          {error && (
            <Alert
              className="examora-login__alert"
              type="error"
              showIcon
              message={error}
            />
          )}

          <Form
            name="login"
            onFinish={handleSubmit}
            layout="vertical"
            requiredMark={false}
            size="large"
          >
            <Form.Item
              label="用户名"
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                autoComplete="username"
                prefix={<UserOutlined />}
                placeholder="admin@example.com"
              />
            </Form.Item>

            <Form.Item
              label="密码"
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                autoComplete="current-password"
                prefix={<LockOutlined />}
                placeholder="请输入密码"
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={isLoading}
              className="examora-login__submit"
            >
              {isLoading ? '登录中' : '登录'}
            </Button>
          </Form>

          {authConfig?.logto_enabled && (
            <div className="examora-login__sso">
              <Divider plain>或</Divider>
              <Button block size="large" onClick={handleLogtoLogin}>
                使用企业 SSO 登录
              </Button>
            </div>
          )}

          <Text className="examora-login__footnote">
            访问权限由系统角色与账号状态控制。
          </Text>
        </div>
      </section>
    </main>
  );
};

export default Login;
