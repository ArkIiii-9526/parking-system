import request from '@/utils/request'

export function payBillingRecord(id, data) {
  return request({
    url: `/billing/records/${id}/pay`,
    method: 'put',
    data
  })
}

export function getBillingRecordsPage(params) {
  return request({
    url: '/billing/records/page',
    method: 'get',
    params
  })
}

export function getDailyStatistics(params) {
  return request({
    url: '/billing/records/statistics/daily',
    method: 'get',
    params
  })
}

export function exportBillingRecords(data) {
  return request({
    url: '/billing/records/export',
    method: 'post',
    data,
    responseType: 'blob'
  })
}
