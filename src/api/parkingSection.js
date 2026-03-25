import request from '@/utils/request'

// 分页查询车位分区
export function getParkingSectionPage(params) {
  return request({
    url: '/parking-sections/page',
    method: 'get',
    params
  })
}

// 获取分区详情
export function getParkingSectionDetail(id) {
  return request({
    url: `/parking-sections/${id}`,
    method: 'get'
  })
}

// 新增分区
export function createParkingSection(data) {
  return request({
    url: '/parking-sections',
    method: 'post',
    data
  })
}

// 更新分区
export function updateParkingSection(data) {
  return request({
    url: '/parking-sections',
    method: 'put',
    data
  })
}

// 删除分区
export function deleteParkingSection(id) {
  return request({
    url: `/parking-sections/${id}`,
    method: 'delete'
  })
}

// 根据停车场查询分区
export function getSectionsByParking(parkingId) {
  return request({
    url: `/parking-sections/by-parking/${parkingId}`,
    method: 'get'
  })
}

// 根据停车场和楼层查询分区
export function getSectionsByParkingAndFloor(parkingId, floor) {
  return request({
    url: `/parking-sections/by-parking/${parkingId}/floor/${floor}`,
    method: 'get'
  })
}

// 获取分区统计信息
export function getSectionStatistics(id) {
  return request({
    url: `/parking-sections/${id}/statistics`,
    method: 'get'
  })
}

// 获取停车场所有分区统计
export function getParkingSectionsStatistics(parkingId) {
  return request({
    url: `/parking-sections/by-parking/${parkingId}/statistics`,
    method: 'get'
  })
}

// 更新分区车位数量
export function updateSectionSpaceCount(id, data) {
  return request({
    url: `/parking-sections/${id}/update-space-count`,
    method: 'put',
    data
  })
}
