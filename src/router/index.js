import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      // 懒加载首页组件
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/parking',
      name: 'parking',
      // 懒加载停车管理组件
      component: () => import('../views/ParkingView.vue'),
      meta: {
        requiresAuth: true, // 标记此路由需要认证
      },
    },
    {
      path: '/login',
      name: 'login',
      // 懒加载登录组件
      component: () => import('../views/LoginView.vue'),
      meta: {
        requiresAuth: false, // 登录页不需要认证
      },
    },
    {
      path: '/register',
      name: 'register',
      // 懒加载注册组件
      component: () => import('../views/RegisterView.vue'),
      meta: {
        requiresAuth: false, // 注册页不需要认证
      },
    },
    // 捕获所有未匹配的路由，重定向到首页
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

// 路由守卫，处理需要认证的路由
router.beforeEach((to, from, next) => {
  // 直接从localStorage获取token，避免在路由守卫中使用composable
  const token = localStorage.getItem('token')

  // 检查路由是否需要认证
  if (to.meta.requiresAuth === true) {
    // 如果需要认证且没有token，重定向到登录页
    if (!token) {
      next({ name: 'login' })
    } else {
      // 有token，允许访问
      next()
    }
  } else if (to.name === 'login' || to.name === 'register') {
    // 如果是登录或注册页且已有token，重定向到首页
    if (token) {
      next({ name: 'home' })
    } else {
      next()
    }
  } else {
    // 其他路由直接允许访问
    next()
  }
})

export default router
