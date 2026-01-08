import request from '@/utils/request'

export function vehicleEntry(data) {
  return request({
    url: '/vehicle/entry',
    method: 'post',
    data
  })
}

export function vehicleExit(data) {
  return request({
    url: '/vehicle/exit',
    method: 'post',
    data
  })
}

export function getActiveEntry(params) {
  return request({
    url: '/vehicle/active-entry',
    method: 'get',
    params
  })
}

export function getVehicleRecordsByParking(parkingId, params) {
  return request({
    url: `/vehicle/records/parking/${parkingId}`,
    method: 'get',
    params
  })
}

export function getVehicleRecordsByCar(carNo, params) {
  return request({
    url: `/vehicle/records/car/${carNo}`,
    method: 'get',
    params
  })
}
