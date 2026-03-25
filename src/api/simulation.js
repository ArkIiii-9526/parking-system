import request from '@/utils/request'

// 生成模拟数据
export function generateSimulationData(data) {
  return request({
    url: '/simulation/generate',
    method: 'post',
    data
  })
}

// 更新模拟车位状态
export function updateSimulationStatus(data) {
  return request({
    url: '/simulation/update-status',
    method: 'post',
    data
  })
}

// 重置停车场状态
export function resetSimulation(parkingId) {
  return request({
    url: `/simulation/reset/${parkingId}`,
    method: 'post'
  })
}

// 清除模拟数据
export function clearSimulation(parkingId) {
  return request({
    url: `/simulation/clear/${parkingId}`,
    method: 'post'
  })
}
