import router from './index'
import NProgress from 'nprogress'
import { getToken } from '@/utils/token'
import { ElMessage } from 'element-plus'

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
        
        // 检查是否已经获取过用户信息，而不是依赖roles的长度
        // 因为API可能只返回菜单数据（数组格式），此时roles会是空数组
        if (store.menus && store.menus.length > 0) {
          next()
        } else {
          await store.getUserInfo()
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
