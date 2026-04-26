import type { RequestOptions } from '@@/plugin-request/request';
import type { RequestConfig } from '@umijs/max';
import { message, notification } from 'antd';
import { getAccessToken } from '@/auth/token';

// Error show types
enum ErrorShowType {
  SILENT = 0,
  WARN_MESSAGE = 1,
  ERROR_MESSAGE = 2,
  NOTIFICATION = 3,
  REDIRECT = 9,
}

// Backend response envelope: { code, message, data }
interface ResponseEnvelope {
  code: number;
  message: string;
  data?: unknown;
  details?: unknown;
}

/**
 * @name 错误处理
 * @doc https://umijs.org/docs/max/request#配置
 */
export const errorConfig: RequestConfig = {
  errorConfig: {
    // 错误抛出 - handle backend { code, message, data } format
    errorThrower: (res: unknown) => {
      const envelope = res as ResponseEnvelope;
      // code 0 = success, non-zero = error
      if (envelope.code !== 0) {
        const error: any = new Error(envelope.message || 'Request failed');
        error.name = 'BizError';
        error.info = {
          errorCode: envelope.code,
          errorMessage: envelope.message,
          showType: ErrorShowType.ERROR_MESSAGE,
          data: envelope.data,
        };
        throw error;
      }
    },
    // 错误接收及处理
    errorHandler: (error: any, opts: any) => {
      if (opts?.skipErrorHandler) throw error;
      // 业务错误
      if (error.name === 'BizError') {
        const errorInfo = error.info;
        if (errorInfo) {
          const { errorMessage, errorCode } = errorInfo;
          switch (errorInfo.showType) {
            case ErrorShowType.SILENT:
              break;
            case ErrorShowType.WARN_MESSAGE:
              message.warning(errorMessage);
              break;
            case ErrorShowType.ERROR_MESSAGE:
              message.error(errorMessage);
              break;
            case ErrorShowType.NOTIFICATION:
              notification.open({
                title: errorCode,
                description: errorMessage,
              });
              break;
            case ErrorShowType.REDIRECT:
              window.location.href = '/login';
              break;
            default:
              message.error(errorMessage);
          }
        }
      } else if (error.response) {
        // Axios error
        if (error.response?.status === 401) {
          window.location.href = '/login';
          return;
        }
        if (error.response?.status === 403) {
          message.error('Access denied');
          return;
        }
        message.error(`Response status: ${error.response?.status}`);
      } else if (error.request) {
        message.error('No response received. Please retry.');
      } else {
        message.error('Request error, please retry.');
      }
    },
  },

  // 请求拦截器
  requestInterceptors: [
    (config: RequestOptions) => {
      const token = getAccessToken();
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
      return config;
    },
  ],

  // 响应拦截器
  responseInterceptors: [],
};
