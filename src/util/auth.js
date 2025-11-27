import { ref } from 'vue'
import axios from './axios'

const token = ref(localStorage.getItem('token') || '')

export const useAuth = () => {
  const login = async (username, password) => {
    try {
      const response = await axios.post('/auth/login', {
        username,
        password,
      })

      if (response.status === 200) {
        token.value = response.data.token
        localStorage.setItem('token', response.data.token)
        return true
      }
      return false
    } catch (error) {
      console.error('登录失败', error)
      return false
    }
  }

  const logout = () => {
    token.value = ''
    localStorage.removeItem('token')
  }

  const getAuthHeader = () => {
    return token.value ? { Authorization: `Bearer ${token.value}` } : {}
  }

  return {
    token,
    login,
    logout,
    getAuthHeader,
  }
}
