import type { ProLayoutProps } from '@ant-design/pro-components';

/**
 * @name Examora Pro Layout Settings
 * Focused workspace design for the exam management system
 */
const Settings: ProLayoutProps & {
  pwa?: boolean;
  logo?: string;
} = {
  navTheme: 'light',
  colorPrimary: '#262626',
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
  menu: {
    collapsedWidth: 64,
  },
};

export default Settings;
