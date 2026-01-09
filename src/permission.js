import router from './router'
import { useUserStore } from './stores/user'
import { getToken } from './utils/token'

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  const hasToken = getToken()

  if (hasToken) {
    if (to.path === '/login') {
      // 已登录，跳转到首页
      next({
        path: '/',
        replace: true
      })
    } else {
      // 检查用户是否已登录
      if (userStore.isLoggedIn) {
        next()
      } else {
        try {
          await userStore.getUserInfo()
          next({ ...to, replace: true })
        } catch (error) {
          // 清除令牌并重定向到登录页
          userStore.resetState()
          next(`/login?redirect=${to.path}`)
        }
      }
    }
  } else {
    // 未登录
    if (to.path === '/login') {
      next()
    } else {
      // 跳转到登录页
      next(`/login?redirect=${to.path}`)
    }
  }
})
