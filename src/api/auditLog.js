import request from '@/utils/request'

export function getAuditLogList(params) {
  return request({
    url: '/audit-log/list',
    method: 'get',
    params
  })
}

export function getAuditLogDetail(logId) {
  return request({
    url: '/audit-log/detail',
    method: 'get',
    params: { logId }
  })
}

export function clearAuditLogs() {
  return request({
    url: '/audit-log/clear',
    method: 'get'
  })
}
