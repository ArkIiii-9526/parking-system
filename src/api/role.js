import request from '@/utils/request'

export function getRoleList(params) {
  return request({
    url: '/sys/role/list',
    method: 'get',
    params
  })
}

export function getRoleDetail(roleId) {
  return request({
    url: `/sys/role/${roleId}`,
    method: 'get'
  })
}

export function createRole(data) {
  return request({
    url: '/sys/role',
    method: 'post',
    data
  })
}

export function updateRole(data) {
  return request({
    url: '/sys/role',
    method: 'put',
    data
  })
}

export function deleteRole(roleId) {
  return request({
    url: `/sys/role/${roleId}`,
    method: 'delete'
  })
}

export function getRolePermissions(roleId) {
  return request({
    url: `/sys/role/${roleId}/permissions`,
    method: 'get'
  })
}

export function getRolePermissionTree(roleId) {
  return request({
    url: `/sys/role/${roleId}/permissions/tree`,
    method: 'get'
  })
}

export function bindRolePermission(data) {
  return request({
    url: '/sys/role/permission/bind',
    method: 'post',
    data
  })
}
