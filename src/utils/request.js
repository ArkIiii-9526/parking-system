import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { getToken, getRefreshToken, clearAll, setToken } from './token'

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
    // 确保 response.data 存在
    const responseData = response.data || {}
    const { code, msg, data } = responseData
    
    // 检查 HTTP 状态码是否成功
    if (response.status >= 200 && response.status < 300) {
      // 如果响应数据有 code 字段，则按业务逻辑处理
      if (typeof code === 'number') {
        if (code === 200) {
          return { code, msg, data }
        } else if (code === 401) {
          const config = response.config
          if (!isRefreshing) {
            isRefreshing = true
            const refreshToken = getRefreshToken()
            if (refreshToken) {
              return service.post('/auth/refresh', {}, { headers: { 'Authorization': `Bearer ${refreshToken}` } })
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
              return Promise.reject(new Error('No refresh token available'))
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
      } else {
        // 如果响应数据没有 code 字段，直接返回数据
        return { code: 200, data: responseData, msg: 'success' }
      }
    } else {
      // HTTP 状态码失败，交给错误处理函数处理
      return Promise.reject(new Error(`HTTP 错误，状态码：${response.status}`))
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
      if (error.code === 'ERR_NETWORK') {
        console.error('网络连接失败，请检查：')
        console.error('- 后端服务是否运行')
        console.error('- 代理配置是否正确')
        console.error('- 网络是否通畅')
      }
      ElMessage.error('网络连接失败，请检查网络')
    }
    return Promise.reject(error)
  }
)

export default service
