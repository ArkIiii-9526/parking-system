import request from '@/utils/request'

export function getParkingSpacePage(params) {
  return request({
    url: '/parking-spaces/page',
    method: 'get',
    params
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

export function updateSpaceStatus(id, data) {
  return request({
    url: `/parking-spaces/${id}/status`,
    method: 'put',
    data
  })
}

export function reserveSpace(id, data) {
  return request({
    url: `/parking-spaces/${id}/reserve`,
    method: 'put',
    data
  })
}

export function releaseSpace(id) {
  return request({
    url: `/parking-spaces/${id}/release`,
    method: 'put'
  })
}
