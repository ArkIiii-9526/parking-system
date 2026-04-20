import request from '@/utils/request'

export function getParkingSpacePage(params) {
  const { pageNo, pageSize, area, ...rest } = params || {}
  const normalizedArea = typeof area === 'string' ? area.trim() : area
  const normalizedSectionArea = typeof rest.sectionArea === 'string'
    ? rest.sectionArea.trim()
    : rest.sectionArea

  return request({
    url: '/parking-spaces/page',
    method: 'get',
    params: {
      ...rest,
      page: rest.page ?? pageNo,
      size: rest.size ?? pageSize,
      sectionArea: normalizedSectionArea || normalizedArea || undefined
    }
  })
}

export function getParkingSpacesByParking(parkingId) {
  return request({
    url: `/parking-spaces/by-parking/${parkingId}`,
    method: 'get'
  })
}

export function getAvailableSpaces(parkingId) {
  return request({
    url: `/parking-spaces/available/${parkingId}`,
    method: 'get'
  })
}

export function getParkingSpaceGroups(parkingId) {
  return request({
    url: `/parking-spaces/group/${parkingId}`,
    method: 'get'
  })
}

export function createParkingSpace(data) {
  return request({
    url: '/parking-spaces',
    method: 'post',
    data
  })
}

export function updateParkingSpace(data) {
  return request({
    url: '/parking-spaces',
    method: 'put',
    data
  })
}

export function deleteParkingSpace(id) {
  return request({
    url: `/parking-spaces/${id}`,
    method: 'delete'
  })
}

export function createParkingSpaceAiImportTask(parkingId, data) {
  return request({
    url: `/parking-spaces/ai-import/${parkingId}/tasks`,
    method: 'post',
    data
  })
}

export function getParkingSpaceAiImportTask(taskId) {
  return request({
    url: `/parking-spaces/ai-import/tasks/${taskId}`,
    method: 'get'
  })
}

export function getLatestParkingSpaceAiImportTask(parkingId) {
  return request({
    url: `/parking-spaces/ai-import/latest/${parkingId}`,
    method: 'get'
  })
}

export function clearParkingSpacesByParking(parkingId) {
  return request({
    url: `/parking-spaces/by-parking/${parkingId}`,
    method: 'delete'
  })
}

export function updateSpaceStatus(id, data) {
  return request({
    url: `/parking-spaces/${id}/status`,
    method: 'put',
    data
  })
}

export function reserveSpace(id, data) {
  const carNo = data?.carNo || data?.currentCarNo
  return request({
    url: `/parking-spaces/${id}/reserve`,
    method: 'put',
    params: { carNo }
  })
}

export function releaseSpace(id) {
  return request({
    url: `/parking-spaces/${id}/release`,
    method: 'put'
  })
}
