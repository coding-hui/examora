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
    redirect: '/overview/dashboard',
  },
  // Overview section
  {
    path: '/overview',
    name: 'overview',
    access: 'canAdmin',
    routes: [
      {
        path: '/overview',
        redirect: '/overview/dashboard',
      },
      {
        path: '/overview/dashboard',
        name: 'dashboard',
        icon: 'DashboardOutlined',
        component: './Welcome',
        access: 'canAdmin',
      },
    ],
  },
  // Content section
  {
    path: '/content',
    name: 'content',
    access: 'canAdmin',
    routes: [
      {
        path: '/content',
        redirect: '/content/library/questions',
      },
      {
        path: '/content/library',
        redirect: '/content/library/questions',
      },
      {
        path: '/content/library/questions',
        name: 'questions',
        icon: 'DatabaseOutlined',
        component: './ComingSoon',
        access: 'canAdmin',
      },
      {
        path: '/content/library/programming',
        name: 'programming',
        icon: 'CodeOutlined',
        component: './ComingSoon',
        access: 'canAdmin',
      },
      {
        path: '/content/papers',
        name: 'papers',
        icon: 'FileTextOutlined',
        component: './ComingSoon',
        access: 'canAdmin',
      },
    ],
  },
  // Examination section
  {
    path: '/examination',
    name: 'examination',
    access: 'canAdmin',
    routes: [
      {
        path: '/examination',
        redirect: '/examination/exams',
      },
      {
        path: '/examination/exams',
        name: 'exams',
        icon: 'ScheduleOutlined',
        component: './ExamList',
        access: 'canAdmin',
      },
      {
        path: '/examination/candidates',
        name: 'candidates',
        icon: 'TeamOutlined',
        component: './ComingSoon',
        access: 'canAdmin',
      },
    ],
  },
  // Exam actions
  {
    path: '/examination/exams/create',
    name: 'examCreate',
    hideInMenu: true,
    component: './ComingSoon',
    access: 'canAdmin',
  },
  {
    path: '/examination/exams/:id/publish',
    name: 'examPublish',
    hideInMenu: true,
    component: './ExamPublish',
    access: 'canAdmin',
  },
  // Monitoring section
  {
    path: '/monitoring',
    name: 'monitoring',
    access: 'canAdmin',
    routes: [
      {
        path: '/monitoring',
        redirect: '/monitoring/proctoring/events',
      },
      {
        path: '/monitoring/proctoring',
        redirect: '/monitoring/proctoring/events',
      },
      {
        path: '/monitoring/proctoring/events',
        name: 'events',
        icon: 'SafetyOutlined',
        component: './ComingSoon',
        access: 'canAdmin',
      },
    ],
  },
  // Assessment section
  {
    path: '/assessment',
    name: 'assessment',
    access: 'canAdmin',
    routes: [
      {
        path: '/assessment',
        redirect: '/assessment/results/submissions',
      },
      {
        path: '/assessment/results',
        redirect: '/assessment/results/submissions',
      },
      {
        path: '/assessment/results/submissions',
        name: 'submissions',
        icon: 'TrophyOutlined',
        component: './ComingSoon',
        access: 'canAdmin',
      },
      {
        path: '/assessment/results/judge-tasks',
        name: 'judgeTasks',
        icon: 'ThunderboltOutlined',
        component: './ComingSoon',
        access: 'canAdmin',
      },
    ],
  },
  // System section
  {
    path: '/system',
    name: 'system',
    access: 'canAdmin',
    routes: [
      {
        path: '/system',
        redirect: '/system/settings/users',
      },
      {
        path: '/system/settings',
        redirect: '/system/settings/users',
      },
      {
        path: '/system/settings/users',
        name: 'users',
        icon: 'SettingOutlined',
        component: './Admin',
        access: 'canAdmin',
      },
    ],
  },
  // Legacy redirects
  {
    path: '/admin/exams',
    redirect: '/examination/exams',
  },
  {
    path: '/admin/exam/:id/publish',
    redirect: '/examination/exams/:id/publish',
  },
  {
    path: '/admin/exam/create',
    redirect: '/examination/exams/create',
  },
  {
    path: '/admin',
    redirect: '/system/settings/users',
  },
  {
    path: '/welcome',
    redirect: '/overview/dashboard',
  },
  {
    path: '/exams',
    redirect: '/examination/exams',
  },
  {
    path: '/exams/create',
    redirect: '/examination/exams/create',
  },
  {
    path: '/exams/:id/publish',
    redirect: '/examination/exams/:id/publish',
  },
  {
    component: '404',
    layout: false,
    path: './*',
  },
];
