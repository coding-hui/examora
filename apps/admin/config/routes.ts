/**
 * @name 简单版路由配置
 * @description 此配置用于 npm run simple 命令执行后使用
 */
export default [
  {
    path: '/login',
    layout: false,
    component: './Login',
  },
  {
    path: '/',
    redirect: '/welcome',
  },
  {
    path: '/welcome',
    name: 'welcome',
    icon: 'smile',
    component: './Welcome',
    access: 'canAdmin',
  },
  {
    path: '/admin',
    name: 'admin',
    icon: 'user',
    component: './Admin',
    access: 'canAdmin',
  },
  {
    component: '404',
    layout: false,
    path: './*',
  },
];
