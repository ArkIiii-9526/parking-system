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
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '首页', icon: 'Odometer' }
      },
      {
        path: 'parking',
        name: 'Parking',
        component: () => import('@/views/parking/index.vue'),
        meta: { title: '停车场管理', icon: 'Van' }
      },
      {
        path: 'parking-space',
        name: 'ParkingSpace',
        component: () => import('@/views/parking-space/index.vue'),
        meta: { title: '停车位管理', icon: 'Grid' }
      },
      {
          path: 'vehicle',
          name: 'Vehicle',
          component: () => import('@/views/vehicle/index.vue'),
          meta: { title: '车辆进出管理', icon: 'Truck' }
        },
      {
        path: 'billing',
        name: 'Billing',
        component: () => import('@/views/billing/index.vue'),
        meta: { title: '收费记录管理', icon: 'Money' }
      },
      {
        path: 'billing-rule',
        name: 'BillingRule',
        component: () => import('@/views/billing-rule/index.vue'),
        meta: { title: '计费规则管理', icon: 'Setting' }
      },
      {
        path: 'system',
        name: 'System',
        redirect: '/system/user',
        meta: { title: '系统管理', icon: 'Setting' },
        children: [
          {
            path: 'user',
            name: 'SystemUser',
            component: () => import('@/views/system/user.vue'),
            meta: { title: '用户管理', icon: 'User' }
          },
          {
            path: 'role',
            name: 'SystemRole',
            component: () => import('@/views/system/role.vue'),
            meta: { title: '角色管理', icon: 'UserFilled' }
          },
          {
            path: 'permission',
            name: 'SystemPermission',
            component: () => import('@/views/system/permission.vue'),
            meta: { title: '权限管理', icon: 'Lock' }
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
  router.matcher = newRouter.matcher
}

export function filterAsyncRoutes(routes) {
  const res = []
  routes.forEach((route) => {
    const tmp = { ...route }
    if (tmp.children) {
      tmp.children = filterAsyncRoutes(tmp.children)
    }
    res.push(tmp)
  })
  return res
}

export default router
