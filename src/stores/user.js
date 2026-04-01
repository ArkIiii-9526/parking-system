import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUserInfo as getLocalUserInfo, setUserInfo, clearAll } from '@/utils/token'
import { login, getUserInfo, logout } from '@/api/login'
import { getUserPermissions } from '@/api/user'
import router, { resetRouter } from '@/router'
import { resetAnalyticsExportFormatsCache } from '@/utils/analyticsExportFormats'

// 将后端菜单数据转换为前端路由格式
function convertMenusToRouteFormat(menuList) {
  if (!Array.isArray(menuList)) return []

  return menuList.map(menu => {
    const route = {
      path: menu.url || '',
      name: menu.permissionCode || menu.permissionName,
      meta: {
        title: menu.permissionName,
        icon: menu.icon || 'Menu',
        hidden: menu.status !== 1
      }
    }

    // 如果有子菜单，递归转换
    if (menu.children && menu.children.length > 0) {
      // 过滤掉不可见的子菜单
      const visibleChildren = menu.children.filter(child => child.status === 1)
      if (visibleChildren.length > 0) {
        route.children = convertMenusToRouteFormat(visibleChildren)
      }
    }

    return route
  })
}

function extractPermissionCodes(items) {
  if (!Array.isArray(items)) return []

  const permissions = []
  items.forEach((item) => {
    if (item.permissionCode) {
      permissions.push(item.permissionCode)
    }
    if (item.children?.length) {
      permissions.push(...extractPermissionCodes(item.children))
    }
  })

  return permissions
}

function parseTokenPayload(token) {
  if (!token) return null

  try {
    const payload = token.split('.')[1]
    if (!payload) return null

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(normalized.padEnd(normalized.length + (4 - normalized.length % 4) % 4, '='))
    return JSON.parse(decoded)
  } catch (error) {
    console.warn('解析 token 失败:', error)
    return null
  }
}

export const useUserStore = defineStore('user', () => {
  const cachedUserInfo = getLocalUserInfo()
  const user = ref(cachedUserInfo?.user || cachedUserInfo || null)
  const token = ref(localStorage.getItem('parking_token') || '')
  const roles = ref(cachedUserInfo?.roles || [])
  const permissions = ref(cachedUserInfo?.permissions || [])
  const menus = ref(cachedUserInfo?.menus || [])
  const permissionsLoaded = ref(Boolean(cachedUserInfo?.permissionsLoaded))

  const isLoggedIn = computed(() => !!token.value)
  const userName = computed(() => user.value?.username || '')
  const avatar = computed(() => user.value?.avatar || '')

  function getCurrentUserId() {
    if (user.value?.userId != null || user.value?.id != null) {
      return user.value?.userId ?? user.value?.id
    }

    const payload = parseTokenPayload(token.value)
    if (payload?.userId != null) {
      user.value = {
        ...(user.value || {}),
        userId: payload.userId,
        username: payload.username || user.value?.username || '',
        nickname: payload.nickname || user.value?.nickname || ''
      }
      return payload.userId
    }

    return null
  }

  function persistUserState() {
    setUserInfo({
      user: user.value,
      roles: roles.value,
      permissions: permissions.value,
      menus: menus.value,
      permissionsLoaded: permissionsLoaded.value
    })
  }

  async function getUserInfoAction() {
    try {
      const res = await getUserInfo()
      if (res.code === 200) {
        permissionsLoaded.value = false
        let permissionsFromApi = []

        if (getCurrentUserId() != null) {
          try {
            const permissionRes = await getUserPermissions(getCurrentUserId())
            if (permissionRes.code === 200 && Array.isArray(permissionRes.data)) {
              permissionsFromApi = permissionRes.data
              permissionsLoaded.value = true
            }
          } catch (permissionError) {
            console.warn('加载用户权限列表失败，将回退到菜单权限:', permissionError)
          }
        }

        // 检查res.data是否是数组（菜单数据直接返回数组的情况）
        if (Array.isArray(res.data)) {
          // 如果是数组，说明直接返回了菜单数据，需要转换格式
          menus.value = convertMenusToRouteFormat(res.data) || []
          const permissionsFromMenus = extractPermissionCodes(res.data)
          permissions.value = [...new Set([...permissionsFromApi, ...permissionsFromMenus])]
          roles.value = [] // 确保没有混入角色
        } else {
          // 否则按正常格式处理
          user.value = res.data.user || user.value
          roles.value = res.data.roles || []
          const fromMenus = extractPermissionCodes(res.data.menus || [])
          const fromApi = res.data.permissions || []
          permissions.value = [...new Set([...permissionsFromApi, ...fromApi, ...fromMenus])]
          if (Array.isArray(res.data.permissions)) {
            permissionsLoaded.value = true
          }
          menus.value = convertMenusToRouteFormat(res.data.menus) || []
        }
        
        // 【关键修复】如果是普通用户或没有权限，强制清空超级管理员缓存影响，保证不越权
        if (user.value?.userType !== 'ADMIN' && (!roles.value.includes('SUPER_ADMIN') && !roles.value.includes('admin') && !roles.value.includes('ADMIN'))) {
          // 确保 permissions 数组里不含超级权限
          permissions.value = permissions.value.filter(p => p !== '*:*:*')
        }

        persistUserState()
        return res.data
      }
      throw new Error(res.msg || '获取用户信息失败')
    } catch (error) {
      console.error('获取用户信息失败:', error)
      throw error
    }
  }

  async function loginAction(loginData) {
    try {
      const res = await login(loginData)
      if (res.code === 200) {
        token.value = res.data.token
        user.value = res.data.user || null
        roles.value = []
        permissions.value = []
        menus.value = []
        permissionsLoaded.value = false
        localStorage.setItem('parking_token', res.data.token)
        if (res.data.refreshToken) {
          localStorage.setItem('parking_refresh_token', res.data.refreshToken)
        }
        persistUserState()
        return res.data
      }
      throw new Error(res.msg || '登录失败')
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  }

  async function logoutAction() {
    try {
      await logout()
    } catch (error) {
      console.error('登出请求失败:', error)
    } finally {
      resetState()
      resetRouter()
      router.push('/login')
    }
  }

  function resetState() {
    token.value = ''
    user.value = null
    roles.value = []
    permissions.value = []
    menus.value = []
    permissionsLoaded.value = false
    resetAnalyticsExportFormatsCache()
    clearAll()
    localStorage.removeItem('parking_token')
    localStorage.removeItem('parking_refresh_token')
  }

  return {
    user,
    token,
    roles,
    permissions,
    menus,
    permissionsLoaded,
    isLoggedIn,
    userName,
    avatar,
    getUserInfo: getUserInfoAction,
    login: loginAction,
    logout: logoutAction,
    resetState
  }
})
