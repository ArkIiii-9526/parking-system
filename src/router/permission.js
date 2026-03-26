import router from './index'
import NProgress from 'nprogress'
import { getToken } from '@/utils/token'
import { ElMessage } from 'element-plus'
import { hasPermission } from '@/utils/hasPermission'

function checkRoutePermission(to) {
  const raw = to.meta?.permission
  if (!raw) return true
  const codes = Array.isArray(raw) ? raw : [raw]
  return codes.some((code) => hasPermission(code))
}

const whiteList = ['/login']

NProgress.configure({ showSpinner: false })

router.beforeEach(async (to, from, next) => {
  NProgress.start()
  
  document.title = to.meta.title ? `${to.meta.title} - 智慧停车引导系统` : '智慧停车引导系统'
  
  const hasToken = getToken()
  
  if (hasToken) {
    if (to.path === '/login') {
      next({ path: '/dashboard' })
      NProgress.done()
    } else {
      try {
        const userStore = await import('@/stores/user')
        const { useUserStore } = userStore
        const store = useUserStore()
        
        // 仅有菜单缓存不够，按钮权限需要显式加载完成后才能安全跳过初始化
        if (store.menus && store.menus.length > 0 && store.permissionsLoaded) {
          if (!checkRoutePermission(to)) {
            ElMessage.warning('无权限访问该页面')
            next({ path: '/404' })
            NProgress.done()
            return
          }
          next()
        } else {
          await store.getUserInfo()
          if (!checkRoutePermission(to)) {
            ElMessage.warning('无权限访问该页面')
            next({ path: '/404' })
            NProgress.done()
            return
          }
          next()
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        next(`/login?redirect=${to.path}`)
      }
    }
  } else {
    if (whiteList.includes(to.path)) {
      next()
    } else {
      // 如果是根路径，直接重定向到登录页，避免先跳转到dashboard再跳转到登录页
      if (to.path === '/') {
        next('/login')
      } else {
        next(`/login?redirect=${to.path}`)
      }
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  NProgress.done()
})

router.onError((error) => {
  NProgress.done()
  console.error('路由错误:', error)
  ElMessage.error('页面加载失败')
})
