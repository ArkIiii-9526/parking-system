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

export function getChildRoles(parentId) {
  return request({
    url: `/sys/role/child/${parentId}`,
    method: 'get'
  })
}

export function getParentRoles(roleId) {
  return request({
    url: `/sys/role/parent/${roleId}`,
    method: 'get'
  })
}

export function checkRolePermission(roleId, permissionCode) {
  return request({
    url: '/sys/role/permission/check',
    method: 'get',
    params: {
      roleId,
      permissionCode
    }
  })
}
