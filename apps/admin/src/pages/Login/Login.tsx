import {
  AuditOutlined,
  CloudServerOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { request, useIntl } from '@umijs/max';
import {
  Alert,
  App as AntdApp,
  Button,
  Divider,
  Form,
  Input,
  Typography,
} from 'antd';
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

const getRequestErrorMessage = (err: any): string | undefined => {
  return (
    err?.info?.errorMessage ||
    err?.response?.data?.message ||
    err?.data?.message ||
    err?.message
  );
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
  const intl = useIntl();
  const { message } = AntdApp.useApp();
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
      message.success(intl.formatMessage({ id: 'pages.login.ssoSuccess' }));
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
        skipErrorHandler: true,
      });
      const loginResult = unwrapData(response);

      if (loginResult.token) {
        setAccessToken(loginResult.token);
        if (loginResult.user) {
          setLocalProfile(loginResult.user);
        }
        message.success(intl.formatMessage({ id: 'pages.login.success' }));
        window.location.href = '/';
        return;
      }

      setError(intl.formatMessage({ id: 'pages.login.error.missingToken' }));
    } catch (err: any) {
      console.error('Login failed:', err);
      const errorMsg =
        getRequestErrorMessage(err) ||
        intl.formatMessage({ id: 'pages.login.error.failed' });
      setError(errorMsg);
      message.error(errorMsg);
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
          <Text className="examora-login__eyebrow">
            {intl.formatMessage({ id: 'pages.login.brand.eyebrow' })}
          </Text>
          <Title level={1}>
            {intl.formatMessage({ id: 'pages.login.brand.headline' })}
          </Title>
          <Text className="examora-login__lead">
            {intl.formatMessage({ id: 'pages.login.brand.description' })}
          </Text>
        </div>

        <ul className="examora-login__signals" aria-label="Platform signals">
          <li className="examora-login__signal">
            <div className="examora-login__signal-icon">
              <AuditOutlined />
            </div>
            <div>
              <span className="examora-login__signal-title">
                {intl.formatMessage({ id: 'pages.login.brand.signal1.title' })}
              </span>
              <span className="examora-login__signal-desc">
                {intl.formatMessage({ id: 'pages.login.brand.signal1.desc' })}
              </span>
            </div>
          </li>
          <li className="examora-login__signal">
            <div className="examora-login__signal-icon">
              <CloudServerOutlined />
            </div>
            <div>
              <span className="examora-login__signal-title">
                {intl.formatMessage({ id: 'pages.login.brand.signal2.title' })}
              </span>
              <span className="examora-login__signal-desc">
                {intl.formatMessage({ id: 'pages.login.brand.signal2.desc' })}
              </span>
            </div>
          </li>
          <li className="examora-login__signal">
            <div className="examora-login__signal-icon">
              <SafetyCertificateOutlined />
            </div>
            <div>
              <span className="examora-login__signal-title">
                {intl.formatMessage({ id: 'pages.login.brand.signal3.title' })}
              </span>
              <span className="examora-login__signal-desc">
                {intl.formatMessage({ id: 'pages.login.brand.signal3.desc' })}
              </span>
            </div>
          </li>
        </ul>
      </section>

      <section className="examora-login__panel" aria-label="Sign in">
        <div className="examora-login__card">
          <div className="examora-login__card-header">
            <Text className="examora-login__section-label">
              {intl.formatMessage({ id: 'pages.login.sectionLabel' })}
            </Text>
            <Title level={2}>
              {intl.formatMessage({ id: 'pages.login.title' })}
            </Title>
            <Text>{intl.formatMessage({ id: 'pages.login.subtitle' })}</Text>
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
              label={intl.formatMessage({ id: 'pages.login.username.label' })}
              name="username"
              rules={[
                {
                  required: true,
                  message: intl.formatMessage({
                    id: 'pages.login.username.required',
                  }),
                },
              ]}
            >
              <Input
                autoComplete="username"
                prefix={<UserOutlined />}
                placeholder={intl.formatMessage({
                  id: 'pages.login.username.placeholder',
                })}
              />
            </Form.Item>

            <Form.Item
              label={intl.formatMessage({ id: 'pages.login.password.label' })}
              name="password"
              rules={[
                {
                  required: true,
                  message: intl.formatMessage({
                    id: 'pages.login.password.required',
                  }),
                },
              ]}
            >
              <Input.Password
                autoComplete="current-password"
                prefix={<LockOutlined />}
                placeholder={intl.formatMessage({
                  id: 'pages.login.password.placeholder',
                })}
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={isLoading}
              className="examora-login__submit"
            >
              {isLoading
                ? intl.formatMessage({ id: 'pages.login.submitting' })
                : intl.formatMessage({ id: 'pages.login.submit' })}
            </Button>
          </Form>

          {authConfig?.logto_enabled && (
            <div className="examora-login__sso">
              <Divider plain>
                {intl.formatMessage({ id: 'pages.login.or' })}
              </Divider>
              <Button block size="large" onClick={handleLogtoLogin}>
                {intl.formatMessage({ id: 'pages.login.sso' })}
              </Button>
            </div>
          )}

          <Text className="examora-login__footnote">
            {intl.formatMessage({ id: 'pages.login.footnote' })}
          </Text>
        </div>
      </section>
    </main>
  );
};

export default Login;
