import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: {
        requiresAuth: false
      }
    },
    {
      path: '/',
      name: 'layout',
      component: () => import('../views/layout/Layout.vue'),
      meta: {
        requiresAuth: true
      },
      children: [
        {
          path: 'user',
          name: 'user',
          component: () => import('../views/system/user/UserList.vue'),
          meta: {
            requiresAuth: true,
            title: '用户管理'
          }
        },
        {
          path: 'role',
          name: 'role',
          component: () => import('../views/system/role/RoleList.vue'),
          meta: {
            requiresAuth: true,
            title: '角色管理'
          }
        },
        {
          path: 'menu',
          name: 'menu',
          component: () => import('../views/system/menu/MenuList.vue'),
          meta: {
            requiresAuth: true,
            title: '菜单管理'
          }
        },
        {
          path: 'personal',
          name: 'personal',
          component: () => import('../views/personal/PersonalCenter.vue'),
          meta: {
            requiresAuth: true,
            title: '个人中心'
          }
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  if (to.meta.requiresAuth === true) {
    if (!token) {
      next({ name: 'login' })
    } else {
      next()
    }
  } else if (to.name === 'login' || to.name === 'register') {
    if (token) {
      next({ path: '/' })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
