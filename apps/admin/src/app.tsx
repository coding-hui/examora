import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { history, Link, request } from '@umijs/max';
import { Button, Result } from 'antd';
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
import { errorConfig } from './request';

// Initialize dayjs plugins globally
dayjs.extend(relativeTime);

const isDev = process.env.NODE_ENV === 'development';
const loginPath = '/login';

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
      const response = await request<AuthMeData>('/api/auth/me', {
        method: 'GET',
      });
      if (response) {
        setLocalProfile(response);
      }
      return response;
    } catch (_error: any) {
      const httpStatus = _error?.response?.status;
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
      };
    }

    return {
      fetchUserInfo,
      currentUser: userProfile,
      forbidden: false,
    };
  }

  return {};
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({ initialState }) => {
  return {
    actionsRender: () => [
      <Question key="doc" />,
      <SelectLang key="SelectLang" />,
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
      render: (_, avatarChildren) => (
        <AvatarDropdown>{avatarChildren}</AvatarDropdown>
      ),
    },
    waterMarkProps: {
      content: initialState?.currentUser?.display_name,
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
    bgLayoutImgList: [
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/D2LWSqNky4sAAAAAAAAAAAAAFl94AQBr',
        left: 85,
        bottom: 100,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/C2TWRpJpiC0AAAAAAAAAAAAAFl94AQBr',
        bottom: -68,
        right: -45,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/F6vSTbj8KpYAAAAAAAAAAAAAFl94AQBr',
        bottom: 0,
        left: 0,
        width: '331px',
      },
    ],
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
export const requestConfig: RequestConfig = {
  baseURL: isDev ? '' : 'https://exam.micromoving.net',
  ...errorConfig,
};

// 无权限页面组件
const ForbiddenPage: React.FC = () => {
  const [loading, setLoading] = React.useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await request('/api/auth/logout', { method: 'POST' });
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
