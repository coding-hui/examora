import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import type { RunTimeLayoutConfig } from '@umijs/max';
import { history, Link } from '@umijs/max';
import { Avatar, Button, ConfigProvider, Result } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import React from 'react';
import type { AuthMeData } from '@/auth/token';
import {
  clearAuthStorage,
  getAccessToken,
  setLocalProfile,
} from '@/auth/token';
import {
  AvatarDropdown,
  AvatarName,
  Footer,
  Question,
  SelectLang,
} from '@/components';
import useShadcnTheme from '@/theme/shadcnTheme';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './request';

// Initialize dayjs plugins globally
dayjs.extend(relativeTime);

const isDev = process.env.NODE_ENV === 'development';
const loginPath = '/login';

// 生成随机颜色的函数
const getRandomColor = (name: string): string => {
  const colors = [
    '#18181b',
    '#262626',
    '#3f3f46',
    '#525252',
    '#16a34a',
    '#ea580c',
    '#dc2626',
    '#404040',
  ];
  // 基于名字生成一致性随机颜色
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// 获取名字首字母
const getInitials = (name: string): string => {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
};

const ShadcnThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const configProps = useShadcnTheme();

  return <ConfigProvider {...configProps}>{children}</ConfigProvider>;
};

export function rootContainer(container: React.ReactNode) {
  return <ShadcnThemeProvider>{container}</ShadcnThemeProvider>;
}

export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: AuthMeData | null;
  forbidden?: boolean;
  loading?: boolean;
  fetchUserInfo?: () => Promise<AuthMeData | undefined | null>;
}> {
  const fetchUserInfo = async (): Promise<AuthMeData | null> => {
    const token = getAccessToken();
    if (!token) return null;

    try {
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.code === 0 && data.data) {
        setLocalProfile(data.data);
        return data.data;
      }
      return null;
    } catch (_error: any) {
      const httpStatus = _error?.status;
      const errorCode = _error?.info?.errorCode;

      // 403 Forbidden - user lacks admin role
      if (httpStatus === 403 || errorCode === 40300) {
        console.warn('User does not have admin access (403)');
        return null;
      }

      // For 401 and all other errors, re-throw to let caller handle
      throw _error;
    }
  };

  const checkAuth = () => {
    const token = getAccessToken();
    return !!token;
  };

  const { location } = history;
  if (location.pathname !== loginPath) {
    const isAuthenticated = checkAuth();
    if (!isAuthenticated) {
      history.push(loginPath);
      return {};
    }

    let userProfile: AuthMeData | null = null;
    let isForbidden = false;

    try {
      userProfile = await fetchUserInfo();
      // If null, user lacks admin role (403)
      isForbidden = userProfile === null;
    } catch (_error: any) {
      console.error('Failed to fetch user info:', _error);
      isForbidden = false;
    }

    // User lacks admin role - show forbidden page
    if (isForbidden) {
      return {
        fetchUserInfo,
        currentUser: null,
        forbidden: true,
        settings: defaultSettings as Partial<LayoutSettings>,
      };
    }

    return {
      fetchUserInfo,
      currentUser: userProfile,
      forbidden: false,
      settings: defaultSettings as Partial<LayoutSettings>,
    };
  }

  return {
    settings: defaultSettings as Partial<LayoutSettings>,
  };
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({ initialState }) => {
  return {
    actionsRender: () => [
      <div
        key="actions"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 8px',
        }}
      >
        <Question key="doc" />
        <SelectLang key="SelectLang" />
      </div>,
    ],
    menuItemRender: (item, dom) => {
      if (item.path) {
        return (
          <Link to={item.path} prefetch>
            {dom}
          </Link>
        );
      }
      return dom;
    },
    avatarProps: {
      title: <AvatarName />,
      render: (_, avatarChildren) => {
        const userName =
          initialState?.currentUser?.display_name ||
          initialState?.currentUser?.username ||
          '';
        const initials = getInitials(userName);
        const bgColor = getRandomColor(userName);

        // 如果有用户名但没有头像，显示带随机颜色的首字母头像
        if (userName && !initialState?.currentUser?.display_name) {
          return (
            <AvatarDropdown>
              <Avatar style={{ backgroundColor: bgColor }} size={32}>
                {initials}
              </Avatar>
            </AvatarDropdown>
          );
        }
        return <AvatarDropdown>{avatarChildren}</AvatarDropdown>;
      },
    },
    footerRender: () => <Footer />,
    onPageChange: () => {
      const { location } = history;
      // 如果 forbidden 显示无权限页面，不重定向
      if (initialState?.forbidden) {
        return;
      }
      // 如果没有登录，重定向到登录页
      if (!initialState?.currentUser && location.pathname !== loginPath) {
        history.push(loginPath);
      }
    },
    bgLayoutImgList: [],
    menuHeaderRender: undefined,
    // 无权限页面
    unAccessible: <ForbiddenPage />,
    ...initialState?.settings,
  };
};

/**
 * @name request 配置，可以配置错误处理
 * 它基于 axios 提供了一套统一的网络请求和错误处理方案。
 * @doc https://umijs.org/docs/max/request#配置
 */
export const request: any = {
  baseURL: isDev ? '' : 'https://exam.micromoving.net',
  ...errorConfig,
};

// 无权限页面组件
const ForbiddenPage: React.FC = () => {
  const [loading, setLoading] = React.useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const token = getAccessToken();
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (_) {
      // ignore logout errors
    }
    clearAuthStorage();
    window.location.href = '/login';
  };

  return (
    <Result
      status="403"
      title="无权访问后台"
      subTitle="您的账户尚未激活或没有后台访问权限，请联系管理员开通权限。"
      extra={
        <Button type="primary" loading={loading} onClick={handleLogout}>
          重新登录
        </Button>
      }
    />
  );
};
