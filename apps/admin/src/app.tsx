import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import LogtoClient from '@logto/browser';
import { LogtoProvider } from '@logto/react';
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { history, Link } from '@umijs/max';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import React from 'react';
import { createLogtoConfig } from '@/auth/LogtoProvider';
import {
  AvatarDropdown,
  AvatarName,
  Footer,
  Question,
  SelectLang,
} from '@/components';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './request';

// Initialize dayjs plugins globally
dayjs.extend(relativeTime);

const isDev = process.env.NODE_ENV === 'development';
const isDevOrTest = isDev || process.env.CI;
const loginPath = '/login';

let logtoClient: LogtoClient | null = null;

const getLogtoClient = () => {
  const config = createLogtoConfig();
  if (!config) return null;
  if (!logtoClient) {
    logtoClient = new LogtoClient(config);
  }
  return logtoClient;
};

/**
 * @see https://umijs.org/docs/api/runtime-config#getinitialstate
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
  isAuthenticated?: boolean;
}> {
  const fetchUserInfo = async () => {
    const client = getLogtoClient();
    if (!client) return undefined;

    try {
      const claims = await client.getIdTokenClaims();
      if (claims) {
        return {
          name: claims.name || claims.username || claims.sub,
          avatar: claims.picture,
          email: claims.email,
          phone: claims.phone_number,
          userId: claims.sub,
        } as API.CurrentUser;
      }
    } catch (_error) {
      console.error('Failed to fetch user info from Logto:', _error);
    }
    return undefined;
  };

  const checkAuth = async () => {
    const client = getLogtoClient();
    if (!client) return false;
    return client.isAuthenticated();
  };

  // 如果不是登录页面，执行
  const { location } = history;
  if (![loginPath].includes(location.pathname)) {
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      history.push(loginPath);
      return {
        fetchUserInfo,
        settings: defaultSettings as Partial<LayoutSettings>,
      };
    }
    const currentUser = await fetchUserInfo();
    return {
      fetchUserInfo,
      currentUser,
      isAuthenticated,
      settings: defaultSettings as Partial<LayoutSettings>,
    };
  }
  return {
    fetchUserInfo,
    settings: defaultSettings as Partial<LayoutSettings>,
  };
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({
  initialState,
  setInitialState,
}) => {
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
      src: initialState?.currentUser?.avatar,
      title: <AvatarName />,
      render: (_, avatarChildren) => (
        <AvatarDropdown>{avatarChildren}</AvatarDropdown>
      ),
    },
    waterMarkProps: {
      content: initialState?.currentUser?.name,
    },
    footerRender: () => <Footer />,
    onPageChange: () => {
      const { location } = history;
      // 如果没有登录，重定向到登录页（会跳转到 Logto）
      if (
        !initialState?.isAuthenticated &&
        !initialState?.currentUser &&
        location.pathname !== loginPath
      ) {
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
    // 自定义 403 页面
    // unAccessible: <div>unAccessible</div>,
    // 增加一个 loading 的状态
    childrenRender: (children) => {
      // if (initialState?.loading) return <PageLoading />;
      const logtoConfig = createLogtoConfig();
      return (
        <LogtoProvider config={logtoConfig ?? { appId: '', endpoint: '' }}>
          {children}
        </LogtoProvider>
      );
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
