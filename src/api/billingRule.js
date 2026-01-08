import request from '@/utils/request'

export function getBillingRulePage(params) {
  return request({
    url: '/billing/rules/page',
    method: 'get',
    params
  })
}

export function createBillingRule(data) {
  return request({
    url: '/billing/rules',
    method: 'post',
    data
  })
}

export function updateBillingRule(data) {
  return request({
    url: '/billing/rules',
    method: 'put',
    data
  })
}

export function deleteBillingRule(id) {
  return request({
    url: `/billing/rules/${id}`,
    method: 'delete'
  })
}

export function enableBillingRule(id) {
  return request({
    url: `/billing/rules/${id}/enable`,
    method: 'put'
  })
}

export function disableBillingRule(id) {
  return request({
    url: `/billing/rules/${id}/disable`,
    method: 'put'
  })
}

export function calculateBillingFee(data) {
  return request({
    url: '/billing/rules/calculate',
    method: 'post',
    data
  })
}

export function getBillingRulesByParking(parkingId) {
  return request({
    url: `/billing/rules/parking/${parkingId}`,
    method: 'get'
  })
}
