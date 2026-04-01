import request from '@/utils/request'

export function getPageList(params) {
  return request({
    url: '/sys/user/list',
    method: 'get',
    params
  })
}

export function getUserDetail(userId) {
  return request({
    url: `/sys/user/${userId}`,
    method: 'get'
  })
}

export function createUser(data) {
  return request({
    url: '/sys/user',
    method: 'post',
    data
  })
}

export function updateUser(data) {
  return request({
    url: '/sys/user',
    method: 'put',
    data
  })
}

export function updateUserProfile(data) {
  return request({
    url: '/sys/user/profile',
    method: 'put',
    data
  })
}

export function updateUserPwd(data) {
  return request({
    url: '/sys/user/pwd',
    method: 'put',
    data: {
      oldPassword: data.oldPassword,
      newPassword: data.newPassword
    }
  })
}

export function deleteUser(userId) {
  return request({
    url: `/sys/user/${userId}`,
    method: 'delete'
  })
}

export function assignUserRole(data) {
  return request({
    url: '/sys/user/role/assign',
    method: 'post',
    data
  })
}

export function getUserRoles(userId) {
  return request({
    url: `/sys/user/${userId}/roles`,
    method: 'get'
  })
}

export function getUserPermissions(userId) {
  return request({
    url: `/sys/user/${userId}/permissions`,
    method: 'get'
  })
}

export function updateUserStatus(data) {
  return request({
    url: '/sys/user/status',
    method: 'put',
    data
  })
}
