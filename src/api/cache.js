import request from '@/utils/request'

export function getCacheMetrics() {
  return request({
    url: '/cache/metrics',
    method: 'get'
  })
}

export function resetCacheMetrics() {
  return request({
    url: '/cache/reset',
    method: 'get'
  })
}

export function clearCacheByPattern(pattern) {
  return request({
    url: '/cache/clear',
    method: 'get',
    params: { pattern }
  })
}

export function clearAllCache() {
  return request({
    url: '/cache/clearAll',
    method: 'get'
  })
}
