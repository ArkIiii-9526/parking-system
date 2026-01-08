import request from '@/utils/request'

export function getPermissionList(params) {
  return request({
    url: '/sys/permission/list',
    method: 'get',
    params
  })
}

export function getPermissionTree() {
  return request({
    url: '/sys/permission/tree',
    method: 'get'
  })
}

export function getPermissionDetail(permissionId) {
  return request({
    url: `/sys/permission/${permissionId}`,
    method: 'get'
  })
}

export function createPermission(data) {
  return request({
    url: '/sys/permission',
    method: 'post',
    data
  })
}

export function updatePermission(data) {
  return request({
    url: '/sys/permission',
    method: 'put',
    data
  })
}

export function deletePermission(permissionId) {
  return request({
    url: `/sys/permission/${permissionId}`,
    method: 'delete'
  })
}

export function refreshPermissionCache() {
  return request({
    url: '/sys/permission/refresh',
    method: 'post'
  })
}
