declare module 'slash2';
declare module '*.css';
declare module '*.less';
declare module '*.scss';
declare module '*.sass';
declare module '*.svg';
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.bmp';
declare module '*.tiff';
declare module 'omit.js';
declare module 'mockjs';

declare const __APP_VERSION__: string;

interface CurrentUser {
  user_id: string;
  external_subject: string;
  display_name: string | null;
  role: string | null;
  role_code: string | null;
  status: string;
}

declare namespace API {
  type CurrentUser = CurrentUser;
}

declare module '@umijs/max' {
  import type { AxiosRequestConfig } from 'axios';
  import type { ProLayoutProps, HeaderProps } from '@ant-design/pro-components';
  import type { History } from 'history';

  // Re-export everything that @umijs/max provides at runtime
  // @ts-ignore - @umijs/max types are incomplete at package install time
  export * from '@umijs/max';

  // Add missing type exports
  export interface RequestConfig<T = any> extends AxiosRequestConfig {}

  export interface InitDataType {
    initialState: {
      currentUser?: API.CurrentUser | null;
      forbidden?: boolean;
      loading?: boolean;
      settings?: Record<string, unknown>;
    };
    setInitialState: (state: any) => void;
  }

  export type RunTimeLayoutConfig = (initData: InitDataType) => Omit<
    ProLayoutProps,
    'rightContentRender'
  > & {
    childrenRender?: (dom: React.ReactNode, props: any) => React.ReactNode;
    unAccessible?: React.ReactNode;
    logout?: (initialState: any) => Promise<void> | void;
    rightContentRender?:
      | ((
          headerProps: HeaderProps,
          dom: React.ReactNode,
          props: {
            userConfig: any;
            runtimeConfig: RunTimeLayoutConfig;
            loading: boolean;
            initialState: InitDataType['initialState'];
            setInitialState: InitDataType['setInitialState'];
          },
        ) => React.ReactNode)
      | false;
    rightRender?: (
      initialState: InitDataType['initialState'],
      setInitialState: InitDataType['setInitialState'],
      runtimeConfig: RunTimeLayoutConfig,
    ) => React.ReactNode;
  };

  // Umi plugin-provided exports not in @umijs/max type declarations
  // These are generated at build time by Umi plugins into .umi/
  export const history: History;
  export interface LinkProps {
    to: string;
    prefetch?: boolean;
    children?: React.ReactNode;
  }
  export const Link: React.FC<LinkProps>;
  export function useModel(model: '@@initialState'): {
    initialState?: {
      currentUser?: API.CurrentUser | null;
      forbidden?: boolean;
      loading?: boolean;
      settings?: Record<string, unknown>;
      fetchUserInfo?: () => Promise<API.CurrentUser | undefined | null>;
    };
    setInitialState: (state: any) => void;
  };
  export function useModel(model: string): unknown;
  export interface IntlShape {
    formatMessage: (
      id: { id: string; defaultMessage?: string },
      values?: Record<string, unknown>,
    ) => string;
  }
  export function useIntl(): IntlShape;
  export interface SelectLangProps {
    style?: React.CSSProperties;
  }
  export const SelectLang: React.FC<SelectLangProps>;
  export interface RequestFn {
    <T = any>(url: string, options?: any): Promise<T>;
    get: <T = any>(url: string, options?: any) => Promise<T>;
    post: <T = any>(url: string, options?: any) => Promise<T>;
    put: <T = any>(url: string, options?: any) => Promise<T>;
    delete: <T = any>(url: string, options?: any) => Promise<T>;
  }
  export const request: RequestFn;
}
