import request from '@/utils/request'

export function getParkingPage(params) {
  return request({
    url: '/parkings/page',
    method: 'get',
    params
  })
}

export function getParkingDetail(id) {
  return request({
    url: `/parkings/${id}`,
    method: 'get'
  })
}

export function createParking(data) {
  return request({
    url: '/parkings',
    method: 'post',
    data
  })
}

export function updateParking(data) {
  return request({
    url: '/parkings',
    method: 'put',
    data
  })
}

export function deleteParking(id) {
  return request({
    url: `/parkings/${id}`,
    method: 'delete'
  })
}

export function getNearbyParkings(params) {
  return request({
    url: '/parkings/nearby',
    method: 'get',
    params
  })
}

export function getParkingStatistics(id) {
  return request({
    url: `/parkings/${id}/statistics`,
    method: 'get'
  })
}
