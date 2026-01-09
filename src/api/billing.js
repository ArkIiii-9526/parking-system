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
  // 确保date参数是字符串类型
  const formattedParams = {
    ...params,
    date: typeof params.date === 'string' ? params.date : String(params.date)
  }
  return request({
    url: '/billing/records/statistics/daily',
    method: 'get',
    params: formattedParams
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
