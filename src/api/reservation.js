import request from '@/utils/request'

export function createReservation(data) {
  return request({
    url: '/reservations',
    method: 'post',
    data
  })
}

export function getReservationPage(params) {
  return request({
    url: '/reservations',
    method: 'get',
    params
  })
}

export function getReservationDetail(id) {
  return request({
    url: `/reservations/${id}`,
    method: 'get'
  })
}

export function updateReservation(id, data) {
  return request({
    url: `/reservations/${id}/update`,
    method: 'put',
    data
  })
}

export function cancelReservation(id) {
  return request({
    url: `/reservations/${id}/cancel`,
    method: 'put'
  })
}

export function deleteReservation(id) {
  return request({
    url: `/reservations/${id}`,
    method: 'delete'
  })
}

export function getReservationsByUser(userId) {
  return request({
    url: `/reservations/user/${userId}`,
    method: 'get'
  })
}

export function getReservationsByParking(parkingId) {
  return request({
    url: `/reservations/parking/${parkingId}`,
    method: 'get'
  })
}
