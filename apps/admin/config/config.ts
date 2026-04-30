// https://umijs.org/config/
// @ts-nocheck

import { join } from 'node:path';
import { defineConfig } from '@umijs/max';
import defaultSettings from './defaultSettings';
import proxy from './proxy';

import routes from './routes';

const { UMI_ENV = 'dev' } = process.env;

/**
 * @name 使用公共路径
 * @description 部署时的路径，如果部署在非根目录下，需要配置这个变量
 * @doc https://umijs.org/docs/api/config#publicpath
 */
const PUBLIC_PATH: string = '/';

export default defineConfig({
  alias: {
    '@root': join(__dirname, '..'),
  },
  /**
   * @name 开启 hash 模式
   * @description 让 build 之后的产物包含 hash 后缀。通常用于增量发布和避免浏览器加载缓存。
   * @doc https://umijs.org/docs/api/config#hash
   */
  hash: true,

  publicPath: PUBLIC_PATH,

  /**
   * @name 兼容性设置
   * @description 设置 ie11 不一定完美兼容，需要检查自己使用的所有依赖
   * @doc https://umijs.org/docs/api/config#targets
   */
  // targets: {
  //   ie: 11,
  // },
  /**
   * @name 路由的配置，不在路由中引入的文件不会编译
   * @description 只支持 path，component，routes，redirect，wrappers，title 的配置
   * @doc https://umijs.org/docs/guides/routes
   */
  // umi routes: https://umijs.org/docs/routing
  routes,
  /**
   * @name 主题的配置
   * @description 虽然叫主题，但是其实只是 less 的变量设置
   * @doc antd的主题设置 https://ant.design/docs/react/customize-theme-cn
   * @doc umi 的 theme 配置 https://umijs.org/docs/api/config#theme
   */
  // theme: { '@primary-color': '#1DA57A' }
  /**
   * @name moment 的国际化配置
   * @description 如果对国际化没有要求，打开之后能减少js的包大小
   * @doc https://umijs.org/docs/api/config#ignoremomentlocale
   */
  ignoreMomentLocale: true,
  /**
   * @name 代理配置
   * @description 可以让你的本地服务器代理到你的服务器上，这样你就可以访问服务器的数据了
   * @see 要注意以下 代理只能在本地开发时使用，build 之后就无法使用了。
   * @doc 代理介绍 https://umijs.org/docs/guides/proxy
   * @doc 代理配置 https://umijs.org/docs/api/config#proxy
   */
  proxy: proxy[UMI_ENV as keyof typeof proxy],
  /**
   * @name 快速热更新配置
   * @description 一个不错的热更新组件，更新时可以保留 state
   */
  fastRefresh: true,
  /**
   * @name 路由预加载
   * @description 预加载路由资源，提升页面切换速度
   * @doc https://umijs.org/docs/api/config#routePrefetch
   */
  routePrefetch: {},
  /**
   * @name manifest 配置
   * @description 生成资源清单，配合 routePrefetch 使用
   */
  manifest: {},
  //============== 以下都是max的插件配置 ===============
  /**
   * @name 数据流插件
   * @@doc https://umijs.org/docs/max/data-flow
   */
  model: {},
  /**
   * 一个全局的初始数据流，可以用它在插件之间共享数据
   * @description 可以用来存放一些全局的数据，比如用户信息，或者一些全局的状态，全局初始状态在整个 Umi 项目的最开始创建。
   * @doc https://umijs.org/docs/max/data-flow#%E5%85%A8%E5%B1%80%E5%88%9D%E5%A7%8B%E7%8A%B6%E6%80%81
   */
  initialState: {},
  /**
   * @name layout 插件
   * @doc https://umijs.org/docs/max/layout-menu
   */
  title: 'Examora',
  layout: {
    locale: true,
    ...defaultSettings,
  },
  /**
   * @name moment2dayjs 插件
   * @description 将项目中的 moment 替换为 dayjs
   * @doc https://umijs.org/docs/max/moment2dayjs
   */
  moment2dayjs: {
    preset: 'antd',
    plugins: ['duration', 'relativeTime'],
  },
  /**
   * @name 国际化插件
   * @doc https://umijs.org/docs/max/i18n
   */
  locale: {
    // default zh-CN
    default: 'zh-CN',
    antd: true,
    // default true, when it is true, will use `navigator.language` overwrite default
    baseNavigator: true,
  },
  /**
   * @name antd 插件
   * @description 内置了 babel import 插件
   * @doc https://umijs.org/docs/max/antd#antd
   */
  antd: {
    appConfig: {},
    configProvider: {
      theme: {
        token: {
          fontFamily:
            "AlibabaSans, Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          colorPrimary: '#262626',
          colorSuccess: '#22c55e',
          colorWarning: '#f97316',
          colorError: '#ef4444',
          colorInfo: '#262626',
          colorTextBase: '#262626',
          colorBgBase: '#ffffff',
          colorPrimaryBg: '#f5f5f5',
          colorPrimaryBgHover: '#e5e5e5',
          colorPrimaryBorder: '#d4d4d4',
          colorPrimaryBorderHover: '#a3a3a3',
          colorPrimaryHover: '#404040',
          colorPrimaryActive: '#171717',
          colorPrimaryText: '#262626',
          colorPrimaryTextHover: '#404040',
          colorPrimaryTextActive: '#171717',
          colorSuccessBg: '#f0fdf4',
          colorSuccessBgHover: '#dcfce7',
          colorSuccessBorder: '#bbf7d0',
          colorSuccessBorderHover: '#86efac',
          colorSuccessHover: '#16a34a',
          colorSuccessActive: '#15803d',
          colorSuccessText: '#16a34a',
          colorSuccessTextHover: '#16a34a',
          colorSuccessTextActive: '#15803d',
          colorWarningBg: '#fff7ed',
          colorWarningBgHover: '#fed7aa',
          colorWarningBorder: '#fdba74',
          colorWarningBorderHover: '#fb923c',
          colorWarningHover: '#ea580c',
          colorWarningActive: '#c2410c',
          colorWarningText: '#ea580c',
          colorWarningTextHover: '#ea580c',
          colorWarningTextActive: '#c2410c',
          colorErrorBg: '#fef2f2',
          colorErrorBgHover: '#fecaca',
          colorErrorBorder: '#fca5a5',
          colorErrorBorderHover: '#f87171',
          colorErrorHover: '#dc2626',
          colorErrorActive: '#b91c1c',
          colorErrorText: '#dc2626',
          colorErrorTextHover: '#dc2626',
          colorErrorTextActive: '#b91c1c',
          colorInfoBg: '#f5f5f5',
          colorInfoBgHover: '#e5e5e5',
          colorInfoBorder: '#d4d4d4',
          colorInfoBorderHover: '#a3a3a3',
          colorInfoHover: '#404040',
          colorInfoActive: '#171717',
          colorInfoText: '#262626',
          colorInfoTextHover: '#404040',
          colorInfoTextActive: '#171717',
          colorText: '#262626',
          colorTextSecondary: '#525252',
          colorTextTertiary: '#737373',
          colorTextQuaternary: '#a3a3a3',
          colorTextDisabled: '#a3a3a3',
          colorBgContainer: '#ffffff',
          colorBgElevated: '#ffffff',
          colorBgLayout: '#fafafa',
          colorBgSpotlight: 'rgba(38, 38, 38, 0.85)',
          colorBgMask: 'rgba(38, 38, 38, 0.45)',
          colorBorder: '#e5e5e5',
          colorBorderSecondary: '#f5f5f5',
          borderRadius: 10,
          borderRadiusXS: 2,
          borderRadiusSM: 6,
          borderRadiusLG: 14,
          padding: 16,
          paddingSM: 12,
          paddingLG: 24,
          margin: 16,
          marginSM: 12,
          marginLG: 24,
          controlHeight: 36,
          controlHeightLG: 40,
          fontSize: 14,
          wireframe: false,
          boxShadow:
            '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
          boxShadowSecondary:
            '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        },
        components: {
          Button: {
            primaryShadow: 'none',
            defaultShadow: 'none',
            dangerShadow: 'none',
            defaultBorderColor: '#e4e4e7',
            defaultColor: '#18181b',
            defaultBg: '#ffffff',
            defaultHoverBg: '#f4f4f5',
            defaultHoverBorderColor: '#d4d4d8',
            defaultHoverColor: '#18181b',
            defaultActiveBg: '#e4e4e7',
            defaultActiveBorderColor: '#d4d4d8',
            borderRadius: 6,
          },
          Input: {
            activeShadow: 'none',
            hoverBorderColor: '#a1a1aa',
            activeBorderColor: '#18181b',
            borderRadius: 6,
          },
          Select: {
            optionSelectedBg: '#f4f4f5',
            optionActiveBg: '#fafafa',
            optionSelectedFontWeight: 500,
            borderRadius: 6,
          },
          Alert: {
            borderRadiusLG: 8,
          },
          Modal: {
            borderRadiusLG: 12,
          },
          Card: {
            headerBg: '#FFFFFF',
            headerFontSize: 15,
            headerHeight: 48,
            bodyPadding: 20,
          },
          Layout: {
            bodyBg: '#FAFAFA',
            headerBg: '#FFFFFF',
            lightSiderBg: '#FFFFFF',
            lightTriggerBg: '#FFFFFF',
          },
          Menu: {
            itemBorderRadius: 6,
            itemHeight: 40,
            itemHoverBg: '#F4F4F5',
            itemHoverColor: '#18181B',
            itemSelectedBg: '#F4F4F5',
            itemSelectedColor: '#18181B',
            groupTitleColor: '#737373',
          },
          Table: {
            borderColor: '#E5E5E5',
            headerBg: '#FAFAFA',
            headerColor: '#525252',
            rowHoverBg: '#FAFAFA',
            cellPaddingBlock: 13,
            cellPaddingInline: 16,
          },
          Progress: {
            defaultColor: '#18181b',
            remainingColor: '#f4f4f5',
          },
          Steps: {
            iconSize: 32,
          },
          Switch: {
            trackHeight: 24,
            trackMinWidth: 44,
            innerMinMargin: 4,
            innerMaxMargin: 24,
          },
          Checkbox: {
            borderRadiusSM: 4,
          },
          Slider: {
            trackBg: '#f4f4f5',
            trackHoverBg: '#e4e4e7',
            handleSize: 18,
            handleSizeHover: 20,
            railSize: 6,
          },
          ColorPicker: {
            borderRadius: 6,
          },
          Tag: {
            borderRadiusSM: 6,
          },
        },
      },
    },
  },
  /**
   * @name React Query 插件
   * @description 使用 react-query 管理服务端状态
   * @doc https://umijs.org/docs/max/react-query
   */
  reactQuery: {},
  /**
   * @name 权限插件
   * @description 基于 initialState 的权限插件，必须先打开 initialState
   * @doc https://umijs.org/docs/max/access
   */
  access: {},
  /**
   * @name <head> 中额外的 script
   * @description 配置 <head> 中额外的 script
   */
  headScripts: [
    // 解决首次加载时白屏的问题
    { src: join(PUBLIC_PATH, 'scripts/loading.js'), async: true },
  ],

  //================ pro 插件配置 =================
  exportStatic: {},
  /**
   * @name 网络请求配置
   * @description 它基于 axios 和 ahooks 的 useRequest 提供了一套统一的网络请求和错误处理方案。
   * @doc https://umijs.org/docs/max/request
   */
  request: {},
  esbuildMinifyIIFE: true,
  define: {
    'process.env.CI': process.env.CI,
    'process.env.COMMIT_HASH': process.env.COMMIT_HASH || '',
    'process.env.CF_PAGES_COMMIT_SHA': process.env.CF_PAGES_COMMIT_SHA || '',
    __APP_VERSION__: JSON.stringify(require('./../package.json').version),
  },
});
