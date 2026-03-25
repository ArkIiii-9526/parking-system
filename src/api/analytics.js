import request from '@/utils/request'

// 获取所有停车场周转率分析
export function getTurnoverAnalysis(params) {
  return request({
    url: '/analytics/turnover',
    method: 'get',
    params
  })
}

// 获取单个停车场周转率分析
export function getParkingTurnoverAnalysis(parkingId, params) {
  return request({
    url: `/analytics/turnover/${parkingId}`,
    method: 'get',
    params
  })
}

// 获取趋势分析（支持按日/周/月统计）
export function getTrendAnalysis(params) {
  return request({
    url: '/analytics/trend',
    method: 'get',
    params
  })
}

// 获取收入分析
export function getIncomeAnalysis(params) {
  return request({
    url: '/analytics/income',
    method: 'get',
    params
  })
}

// 获取所有停车场利用率分析
export function getUtilizationAnalysis() {
  return request({
    url: '/analytics/utilization',
    method: 'get'
  })
}

// 获取单个停车场利用率
export function getParkingUtilization(parkingId) {
  return request({
    url: `/analytics/utilization/${parkingId}`,
    method: 'get'
  })
}

// 获取运营指标汇总
export function getSummaryAnalysis(params) {
  return request({
    url: '/analytics/summary',
    method: 'get',
    params
  })
}

// 导出周转率分析数据
export function exportTurnover(data) {
  return request({
    url: '/analytics/export/turnover',
    method: 'post',
    data,
    responseType: 'blob'
  })
}

// 导出趋势分析数据
export function exportTrend(data) {
  return request({
    url: '/analytics/export/trend',
    method: 'post',
    data,
    responseType: 'blob'
  })
}

// 导出收入分析数据
export function exportIncome(data) {
  return request({
    url: '/analytics/export/income',
    method: 'post',
    data,
    responseType: 'blob'
  })
}

// 导出利用率分析数据
export function exportUtilization(data) {
  return request({
    url: '/analytics/export/utilization',
    method: 'post',
    data,
    responseType: 'blob'
  })
}

// 导出运营汇总数据
export function exportSummary(data) {
  return request({
    url: '/analytics/export/summary',
    method: 'post',
    data,
    responseType: 'blob'
  })
}

// 导出综合报表
export function exportComprehensive(data) {
  return request({
    url: '/analytics/export/comprehensive',
    method: 'post',
    data,
    responseType: 'blob'
  })
}

// 获取支持的导出格式
export function getExportFormats() {
  return request({
    url: '/analytics/export/formats',
    method: 'get'
  })
}
