import type { ProLayoutProps } from '@ant-design/pro-components';

/**
 * @name Examora Pro Layout Settings
 * Vibrant & Professional exam management system design
 */
const Settings: ProLayoutProps & {
  pwa?: boolean;
  logo?: string;
} = {
  navTheme: 'light',
  colorPrimary: '#1890ff',
  layout: 'mix',
  contentWidth: 'Fluid',
  fixedHeader: true,
  fixSiderbar: true,
  splitMenus: false,
  siderMenuType: 'group',
  colorWeak: false,
  title: 'Examora',
  pwa: false,
  logo: '/logo.svg',
  iconfontUrl: '',
};

export default Settings;
