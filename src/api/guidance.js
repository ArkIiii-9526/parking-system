import request from '@/utils/request'

// 获取综合停车引导推荐结果
export function getRecommendParking(params) {
  return request({
    url: '/guidance/recommend',
    method: 'get',
    params
  })
}

// 获取停车场内简化导航路径
export function getParkingNavigation(params) {
  return request({
    url: '/guidance/navigation',
    method: 'get',
    params
  })
}

export function planGuidanceRoute(data) {
  return request({
    url: '/guidance/route/plan',
    method: 'post',
    data
  })
}
