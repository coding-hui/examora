import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { history, Link } from '@umijs/max';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import React from 'react';
import { LogtoAuthProvider } from '@/auth/LogtoProvider';
import { getAccessToken, getLogtoClient } from '@/auth/token';
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

/**
 * @see https://umijs.org/docs/api/runtime-config#getinitialstate
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser | null;
  forbidden?: boolean;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined | null>;
}> {
  const fetchUserInfo = async () => {
    const client = getLogtoClient();
    if (!client) return null;

    try {
      const token = await getAccessToken();
      if (!token) return null;

      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        return null;
      }

      if (res.status === 403) {
        return undefined; // indicates forbidden
      }

      if (res.ok) {
        const userProfile = (await res.json()) as API.CurrentUser;
        localStorage.setItem(
          'examora_user_profile',
          JSON.stringify(userProfile),
        );
        return userProfile;
      }
    } catch (_error) {
      console.error('Failed to fetch user info:', _error);
    }
    return null;
  };

  const checkAuth = async () => {
    const client = getLogtoClient();
    if (!client) return false;
    return client.isAuthenticated();
  };

  const { location } = history;
  if (location.pathname !== loginPath) {
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      history.push(loginPath);
      return {};
    }

    const token = await getAccessToken();
    if (!token) {
      history.push(loginPath);
      return {};
    }

    const userProfile = await fetchUserInfo();

    if (userProfile === undefined) {
      // 403: 用户已登录但无后台权限或未激活，不重定向到登录页
      return {
        fetchUserInfo,
        currentUser: null,
        forbidden: true,
      };
    }

    return {
      fetchUserInfo,
      currentUser: userProfile,
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
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/D2LWSqNny4sAAAAAAAAAAAAAFl94AQBr',
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
    unAccessible: (
      <div style={{ padding: '100px 0', textAlign: 'center' }}>
        <h2>无权访问后台</h2>
        <p>您的账户尚未激活或没有后台访问权限。</p>
        <p>请联系管理员开通权限。</p>
      </div>
    ),
    childrenRender: (children) => {
      return <LogtoAuthProvider>{children}</LogtoAuthProvider>;
    },
    ...initialState?.settings,
  };
};

/**
 * @name request 配置，可以配置错误处理
 * 它基于 axios 提供了一套统一的网络请求和错误处理方案。
 * @doc https://umijs.org/docs/max/request#配置
 */
export const request: RequestConfig = {
  baseURL: isDev ? '' : 'https://exam.micromoving.net',
  ...errorConfig,
};
