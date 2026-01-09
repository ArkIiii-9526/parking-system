import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

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
