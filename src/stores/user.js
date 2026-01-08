import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUserInfo as getLocalUserInfo, setUserInfo, clearAll } from '@/utils/token'
import { login, getUserInfo, logout } from '@/api/login'
import router, { resetRouter } from '@/router'

export const useUserStore = defineStore('user', () => {
  const user = ref(getLocalUserInfo())
  const token = ref(localStorage.getItem('parking_token') || '')
  const roles = ref(user.value?.roles || [])
  const permissions = ref(user.value?.permissions || [])
  const menus = ref([])

  const isLoggedIn = computed(() => !!token.value)
  const userName = computed(() => user.value?.username || '')
  const avatar = computed(() => user.value?.avatar || '')

  async function getUserInfoAction() {
    try {
      const res = await getUserInfo()
      if (res.code === 200) {
        user.value = res.data.user
        roles.value = res.data.roles || []
        permissions.value = res.data.permissions || []
        menus.value = res.data.menus || []
        setUserInfo({
          user: res.data.user,
          roles: roles.value,
          permissions: permissions.value,
          menus: menus.value
        })
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
        localStorage.setItem('parking_token', res.data.token)
        if (res.data.refreshToken) {
          localStorage.setItem('parking_refresh_token', res.data.refreshToken)
        }
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
    clearAll()
  }

  return {
    user,
    token,
    roles,
    permissions,
    menus,
    isLoggedIn,
    userName,
    avatar,
    getUserInfo: getUserInfoAction,
    login: loginAction,
    logout: logoutAction,
    resetState
  }
})
