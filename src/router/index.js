import { createRouter, createWebHistory } from 'vue-router'

const routes = [
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
  // 添加更多路由路径，与后端返回的菜单数据匹配
  {
    path: '/sys/user',
    name: 'sysUser',
    component: () => import('../views/system/user/UserList.vue'),
    meta: {
      requiresAuth: true,
      title: '用户管理'
    }
  },
  {
    path: '/sys/role',
    name: 'sysRole',
    component: () => import('../views/system/role/RoleList.vue'),
    meta: {
      requiresAuth: true,
      title: '角色管理'
    }
  },
  {
    path: '/sys/menu',
    name: 'sysMenu',
    component: () => import('../views/system/menu/MenuList.vue'),
    meta: {
      requiresAuth: true,
      title: '菜单管理'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
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