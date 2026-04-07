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
    const { code, msg, message, data } = responseData
    const errMsg = msg || message || '请求失败'
    const requestUrl = response.config?.url || ''
    const isLoginRequest = requestUrl.includes('/auth/login')
    
    // 检查 HTTP 状态码是否成功
    if (response.status >= 200 && response.status < 300) {
      // 如果响应数据有 code 字段，则按业务逻辑处理
      if (typeof code === 'number') {
        if (code === 200) {
          return { code, msg: errMsg, data }
        } else if (code === 401) {
          if (isLoginRequest) {
            ElMessage.error(errMsg)
            return Promise.reject(new Error(errMsg))
          }
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
          ElMessage.error(errMsg)
          return Promise.reject(new Error(errMsg))
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
      const errMsg = data.msg || data.message || '请求失败'
      switch (status) {
        case 400:
          ElMessage.error({ message: `参数错误: ${errMsg}，请检查后重试`, duration: 5000 })
          break
        case 401:
          clearAll()
          router.push('/login')
          ElMessage.error({ message: '登录已过期，请重新登录', duration: 3000 })
          break
        case 403:
          ElMessage.error({ message: '没有权限访问该资源，请联系管理员分配权限', duration: 5000 })
          break
        case 404:
          ElMessage.error({ message: '请求的资源不存在，可能已被删除', duration: 5000 })
          break
        case 500:
          ElMessage.error({ message: `服务器开小差了: ${errMsg}，请稍后重试或联系技术支持`, duration: 5000 })
          break
        default:
          ElMessage.error({ message: `网络异常 (${status}): ${errMsg}`, duration: 5000 })
      }
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      ElMessage.warning({ message: '请求超时，请检查网络状况后刷新页面重试', duration: 5000 })
    } else {
      if (error.code === 'ERR_NETWORK') {
        console.error('网络连接失败，请检查：')
        console.error('- 后端服务是否运行')
        console.error('- 代理配置是否正确')
        console.error('- 网络是否通畅')
      }
      ElMessage.error({ message: '网络连接失败，请检查本地网络或联系管理员', duration: 5000 })
    }
    return Promise.reject(error)
  }
)

export default service
