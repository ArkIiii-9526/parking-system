import request from '@/utils/request'

// 分页查询配置列表
export function getConfigPage(params) {
  return request({
    url: '/sys/config/page',
    method: 'get',
    params
  })
}

// 获取配置列表
export function getConfigList(params) {
  return request({
    url: '/sys/config/list',
    method: 'get',
    params
  })
}

// 获取配置详情
export function getConfigDetail(configId) {
  return request({
    url: `/sys/config/${configId}`,
    method: 'get'
  })
}

// 根据键获取配置值
export function getConfigByKey(configKey) {
  return request({
    url: '/sys/config/getByKey',
    method: 'get',
    params: { configKey }
  })
}

// 根据键获取配置值（带默认值）
export function getConfigByKeyWithDefault(configKey, defaultValue) {
  return request({
    url: '/sys/config/getByKeyWithDefault',
    method: 'get',
    params: { configKey, defaultValue }
  })
}

// 获取布尔类型配置
export function getBooleanConfig(configKey, defaultValue) {
  return request({
    url: '/sys/config/getBoolean',
    method: 'get',
    params: { configKey, defaultValue }
  })
}

// 获取整数类型配置
export function getIntConfig(configKey, defaultValue) {
  return request({
    url: '/sys/config/getInt',
    method: 'get',
    params: { configKey, defaultValue }
  })
}

// 获取支持的配置类型
export function getConfigTypes() {
  return request({
    url: '/sys/config/types',
    method: 'get'
  })
}

// 新增配置
export function createConfig(data) {
  return request({
    url: '/sys/config',
    method: 'post',
    data
  })
}

// 更新配置
export function updateConfig(data) {
  return request({
    url: '/sys/config',
    method: 'put',
    data
  })
}

// 删除配置
export function deleteConfig(configId) {
  return request({
    url: `/sys/config/${configId}`,
    method: 'delete'
  })
}

// 刷新配置缓存
export function refreshConfigCache() {
  return request({
    url: '/sys/config/refresh',
    method: 'post'
  })
}
