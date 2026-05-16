/**
 * @name 路由配置
 * @description 按功能分组，页面组件组织在 pages/ 下
 */
export default [
  {
    path: '/login',
    layout: false,
    component: './Login/Login',
  },
  {
    path: '/',
    redirect: '/overview/dashboard',
  },
  {
    path: '/account',
    hideInMenu: true,
    access: 'canAdmin',
    routes: [
      {
        path: '/account',
        redirect: '/account/settings',
      },
      {
        path: '/account/settings',
        name: 'accountSettings',
        component: './Account/Settings',
        access: 'canAdmin',
      },
    ],
  },
  // Dashboard
  {
    path: '/overview',
    hideInMenu: true,
    redirect: '/overview/dashboard',
  },
  {
    path: '/overview/dashboard',
    name: 'dashboard',
    icon: 'DashboardOutlined',
    component: './Welcome',
    access: 'canAdmin',
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
        component: './Content/Library/Questions',
        access: 'canAdmin',
      },
      {
        path: '/content/library/questions/:id',
        name: 'questionDetail',
        hideInMenu: true,
        component: './Content/Library/Questions/Detail',
        access: 'canAdmin',
      },
      {
        path: '/content/library/programming',
        name: 'programming',
        icon: 'CodeOutlined',
        component: './Content/Library/Programming',
        access: 'canAdmin',
      },
      {
        path: '/content/papers',
        name: 'papers',
        icon: 'FileTextOutlined',
        component: './Content/Papers',
        access: 'canAdmin',
      },
      {
        path: '/content/papers/new',
        name: 'paperCreate',
        hideInMenu: true,
        component: './Content/Papers/Detail',
        access: 'canAdmin',
      },
      {
        path: '/content/papers/:id',
        name: 'paperDetail',
        hideInMenu: true,
        component: './Content/Papers/Detail',
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
        component: './Examination/ExamList',
        access: 'canAdmin',
      },
      {
        path: '/examination/exams/:id',
        name: 'examDetail',
        hideInMenu: true,
        component: './Examination/ExamDetail',
        access: 'canAdmin',
      },
      {
        path: '/examination/submissions',
        name: 'submissions',
        icon: 'TrophyOutlined',
        component: './Assessment/Results/Submissions',
        access: 'canAdmin',
      },
      {
        path: '/examination/judge-tasks',
        name: 'judgeTasks',
        icon: 'ThunderboltOutlined',
        component: './Assessment/Results/JudgeTasks',
        access: 'canAdmin',
      },
      {
        path: '/examination/events',
        name: 'events',
        icon: 'SafetyOutlined',
        component: './Monitoring/Proctoring/Events',
        access: 'canAdmin',
      },
    ],
  },
  // Exam actions
  {
    path: '/examination/exams/create',
    name: 'examCreate',
    hideInMenu: true,
    redirect: '/examination/exams',
  },
  {
    path: '/examination/exams/:id/edit',
    name: 'examEdit',
    hideInMenu: true,
    component: './Examination/ExamForm',
    access: 'canAdmin',
  },
  {
    path: '/examination/exams/:id/publish',
    name: 'examPublish',
    hideInMenu: true,
    component: './Examination/ExamPublish',
    access: 'canAdmin',
  },
  // Legacy monitoring redirects
  {
    path: '/monitoring',
    hideInMenu: true,
    redirect: '/examination/events',
  },
  {
    path: '/monitoring/proctoring',
    hideInMenu: true,
    redirect: '/examination/events',
  },
  {
    path: '/monitoring/proctoring/events',
    hideInMenu: true,
    redirect: '/examination/events',
  },
  // Legacy assessment redirects
  {
    path: '/assessment',
    hideInMenu: true,
    redirect: '/examination/submissions',
  },
  {
    path: '/assessment/results',
    hideInMenu: true,
    redirect: '/examination/submissions',
  },
  {
    path: '/assessment/results/submissions',
    hideInMenu: true,
    redirect: '/examination/submissions',
  },
  {
    path: '/assessment/results/judge-tasks',
    hideInMenu: true,
    redirect: '/examination/judge-tasks',
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
        icon: 'UserOutlined',
        component: './System/Settings/Users',
        access: 'canAdmin',
      },
      {
        path: '/system/settings/user-groups',
        name: 'userGroups',
        icon: 'TeamOutlined',
        component: './System/Settings/UserGroups',
        access: 'canAdmin',
      },
      {
        path: '/system/settings/user-groups/:id',
        name: 'userGroupDetail',
        hideInMenu: true,
        component: './System/Settings/UserGroups/Detail',
        access: 'canAdmin',
      },
    ],
  },
  // Legacy redirects
  {
    path: '/examination/candidates',
    redirect: '/system/settings/user-groups',
  },
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
    component: './404',
    layout: false,
    path: './*',
  },
];
