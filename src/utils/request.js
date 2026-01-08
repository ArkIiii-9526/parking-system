import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import router from '@/router'
import { getToken, getRefreshToken, clearAll, setToken, setRefreshToken } from './token'

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000
})

service.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

let isRefreshing = false
let refreshSubscribers = []

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb)
}

function onTokenRefreshed(token) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

service.interceptors.response.use(
  (response) => {
    const { code, msg, data } = response.data
    if (code === 200) {
      return { code, msg, data }
    } else if (code === 401) {
      const config = response.config
      if (!isRefreshing) {
        isRefreshing = true
        const refreshToken = getRefreshToken()
        if (refreshToken) {
          service.post('/auth/refresh', {}, { headers: { 'Authorization': `Bearer ${refreshToken}` } })
            .then((res) => {
              if (res.code === 200) {
                const { token } = res.data
                setToken(token)
                onTokenRefreshed(token)
                config.headers['Authorization'] = `Bearer ${token}`
                return service(config)
              } else {
                clearAll()
                router.push('/login')
                ElMessage.error('登录已过期，请重新登录')
                return Promise.reject(new Error('Token refresh failed'))
              }
            })
            .catch((error) => {
              clearAll()
              router.push('/login')
              ElMessage.error('登录已过期，请重新登录')
              return Promise.reject(error)
            })
            .finally(() => {
              isRefreshing = false
            })
        } else {
          clearAll()
          router.push('/login')
          ElMessage.error('登录已过期，请重新登录')
        }
      } else {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            config.headers['Authorization'] = `Bearer ${token}`
            resolve(service(config))
          })
        })
      }
    } else {
      ElMessage.error(msg || '请求失败')
      return Promise.reject(new Error(msg || '请求失败'))
    }
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      switch (status) {
        case 401:
          clearAll()
          router.push('/login')
          ElMessage.error('登录已过期，请重新登录')
          break
        case 403:
          ElMessage.error('没有权限访问')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error(data.msg || '服务器错误')
          break
        default:
          ElMessage.error(data.msg || '网络错误')
      }
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请稍后重试')
    } else {
      ElMessage.error('网络连接失败，请检查网络')
    }
    return Promise.reject(error)
  }
)

export default service
