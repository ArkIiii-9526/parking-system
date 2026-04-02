import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', hidden: true }
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '页面不存在', hidden: true }
  },
  {
    path: '/redirect/:path(.*)',
    name: 'Redirect',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '重定向', hidden: true }
  },
  {
    path: '/',
    component: () => import('@/layout/MainLayout.vue'),
    redirect: '/dashboard',
    name: 'Layout',
    meta: { title: '', hidden: true },
    children: [
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/profile/index.vue'),
        meta: { title: '个人中心', hidden: true }
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '首页', icon: 'Odometer' }
      },
      {
        path: 'parking',
        name: 'Parking',
        component: () => import('@/views/parking/index.vue'),
        meta: { title: '停车场管理', icon: 'Van', permission: 'parking:list' }
      },
      {
        path: 'parking-space',
        name: 'ParkingSpace',
        component: () => import('@/views/parking-space/index.vue'),
        meta: { title: '停车位管理', icon: 'Grid', permission: 'space:view' }
      },
      {
          path: 'vehicle',
          name: 'Vehicle',
          component: () => import('@/views/vehicle/index.vue'),
          meta: { title: '车辆进出管理', icon: 'Truck', permission: 'vehicle:view' }
        },
      {
        path: 'billing',
        name: 'Billing',
        component: () => import('@/views/billing/index.vue'),
        meta: { title: '收费记录管理', icon: 'Money', permission: 'billing:view' }
      },
      {
        path: 'billing-rule',
        name: 'BillingRule',
        component: () => import('@/views/billing-rule/index.vue'),
        meta: { title: '计费规则管理', icon: 'Setting', permission: 'billing:rule:view' }
      },
      {
        path: 'parking-section',
        name: 'ParkingSection',
        component: () => import('@/views/parking-section/index.vue'),
        meta: { title: '停车场分区', icon: 'MapLocation', permission: 'section:list' }
      },
      {
        path: 'analytics',
        name: 'Analytics',
        redirect: '/analytics/summary',
        meta: { title: '数据分析', icon: 'TrendCharts' },
        children: [
          {
            path: 'summary',
            name: 'AnalyticsSummary',
            component: () => import('@/views/analytics/summary.vue'),
            meta: { title: '运营汇总', icon: 'DataLine', permission: 'analytics:summary:view' }
          },
          {
            path: 'utilization',
            name: 'AnalyticsUtilization',
            component: () => import('@/views/analytics/utilization.vue'),
            meta: { title: '利用率分析', icon: 'PieChart', permission: 'analytics:utilization:view' }
          },
          {
            path: 'income',
            name: 'AnalyticsIncome',
            component: () => import('@/views/analytics/income.vue'),
            meta: { title: '收入分析', icon: 'Money', permission: 'analytics:income:view' }
          },
          {
            path: 'turnover',
            name: 'AnalyticsTurnover',
            component: () => import('@/views/analytics/turnover.vue'),
            meta: { title: '周转率分析', icon: 'Refresh', permission: 'analytics:turnover:view' }
          },
          {
            path: 'trend',
            name: 'AnalyticsTrend',
            component: () => import('@/views/analytics/trend.vue'),
            meta: { title: '趋势分析', icon: 'TrendCharts', permission: 'analytics:trend:view' }
          }
        ]
      },
      {
        path: 'simulation',
        name: 'Simulation',
        component: () => import('@/views/simulation/index.vue'),
        meta: { title: '模拟数据', icon: 'Cpu', permission: ['simulation:view', 'simulation:manage', 'simulation:generate'] }
      },
      {
        path: 'guidance',
        name: 'Guidance',
        component: () => import('@/views/guidance/index.vue'),
        meta: { title: '停车引导', icon: 'Guide' }
      },
      {
        path: 'reservation',
        name: 'Reservation',
        component: () => import('@/views/reservation/index.vue'),
        meta: { title: '预约管理', icon: 'Calendar', permission: 'reservation:view' }
      },
      {
        path: 'system',
        name: 'System',
        redirect: '/system/user',
        meta: { title: '系统管理', icon: 'Setting', permission: 'system:manage' },
        children: [
          {
            path: 'user',
            name: 'SystemUser',
            component: () => import('@/views/system/user-manage.vue'),
            meta: { title: '用户管理', icon: 'User', permission: 'user:list' }
          },
          {
            path: 'role',
            name: 'SystemRole',
            component: () => import('@/views/system/role-manage.vue'),
            meta: { title: '角色管理', icon: 'UserFilled', permission: 'role:list' }
          },
          {
            path: 'permission',
            name: 'SystemPermission',
            component: () => import('@/views/system/permission-manage.vue'),
            meta: { title: '权限管理', icon: 'Lock', permission: 'menu:list' }
          },
          {
            path: 'config',
            name: 'SystemConfig',
            component: () => import('@/views/system/config-manage.vue'),
            meta: { title: '系统配置', icon: 'Tools', permission: 'config:list' }
          },
          {
            path: 'audit-log',
            name: 'SystemAuditLog',
            component: () => import('@/views/system/audit-log.vue'),
            meta: { title: '审计日志', icon: 'Document', permission: 'sys:audit:query' }
          },
          {
            path: 'cache',
            name: 'SystemCache',
            component: () => import('@/views/system/cache.vue'),
            meta: { title: '缓存监控', icon: 'Monitor', permission: 'sys:cache:metrics' }
          }
        ]
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

export function resetRouter() {
  const newRouter = createRouter({
    history: createWebHashHistory(),
    routes
  })
  
  // Vue 3 (Vue Router 4) 中应使用 removeRoute 和 addRoute 重置路由
  const currentRoutes = router.getRoutes()
  currentRoutes.forEach(route => {
    if (route.name) {
      router.removeRoute(route.name)
    }
  })
  
  routes.forEach(route => {
    router.addRoute(route)
  })
}

export function filterAsyncRoutes(asyncRoutes, menus) {
  const res = []

  asyncRoutes.forEach(route => {
    const tmp = { ...route }
    // 检查当前路由是否在菜单列表中
    const menuItem = menus.find(item => item.path === tmp.path)
    if (menuItem) {
      // 如果有children，递归过滤
      if (tmp.children && tmp.children.length) {
        tmp.children = filterAsyncRoutes(tmp.children, menuItem.children || [])
      }
      // 合并菜单数据和路由数据
      tmp.meta = { ...tmp.meta, ...menuItem.meta }
      tmp.hidden = menuItem.hidden || tmp.hidden
      res.push(tmp)
    }
  })

  // 检查是否有菜单数据未匹配到本地路由
  const unmatchedMenus = []
  const checkUnmatchedMenus = (menuList, parentPath = '') => {
    menuList.forEach(menu => {
      const fullPath = parentPath === '' ? menu.path : `${parentPath}/${menu.path}`
      const isMatched = asyncRoutes.some(route => route.path === fullPath)
      if (!isMatched) {
        unmatchedMenus.push(fullPath)
      }
      if (menu.children && menu.children.length) {
        checkUnmatchedMenus(menu.children, fullPath)
      }
    })
  }

  checkUnmatchedMenus(menus)
  if (unmatchedMenus.length) {
    console.warn('以下菜单路径未匹配到本地路由配置:', unmatchedMenus)
  }

  return res
}

export default router
