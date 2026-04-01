import router from './index'
import NProgress from 'nprogress'
import { getToken } from '@/utils/token'
import { ElMessage } from 'element-plus'
import { hasPermission } from '@/utils/hasPermission'

function checkRoutePermission(to) {
  // 从 to.matched 数组中收集所有需要校验的权限
  const permissions = to.matched
    .filter(record => record.meta && record.meta.permission)
    .map(record => record.meta.permission)
    .flatMap(raw => Array.isArray(raw) ? raw : [raw])

  // 如果当前路由及所有父级路由都没有配置 permission，默认放行
  if (permissions.length === 0) return true

  // 要求所有的 permission 都要满足（如果需要宽松策略可以改用 some）
  return permissions.every(code => hasPermission(code))
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
        
        // 使用 user 信息是否存在来判断是否已经加载过用户信息
        if (store.user && store.permissionsLoaded) {
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
        const userStore = await import('@/stores/user')
        userStore.useUserStore().logout()
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
