import request from '@/utils/request'

export function getCaptcha() {
  return request({
    url: '/auth/captcha',
    method: 'get'
  })
}

export function register(data) {
  return request({
    url: '/auth/register',
    method: 'post',
    data
  })
}

export function login(data) {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

export function logout() {
  return request({
    url: '/auth/logout',
    method: 'post'
  })
}

export function refreshToken() {
  return request({
    url: '/auth/refresh',
    method: 'post'
  })
}

export function getUserInfo() {
  return request({
    url: '/sys/user/menus',
    method: 'get'
  })
}

export function getMenus() {
  return request({
    url: '/sys/user/menus',
    method: 'get'
  })
}
