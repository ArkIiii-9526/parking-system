import { useUserStore } from '@/stores/user'

export function hasPermission(permission) {
  const userStore = useUserStore()
  const { permissions, user, roles } = userStore
  
  // 超级管理员或ADMIN用户拥有所有权限
  if (user?.userType === 'ADMIN' || (roles && (roles.includes('SUPER_ADMIN') || roles.includes('admin')))) {
    return true
  }
  
  if (!permissions || permissions.length === 0) {
    return false
  }
  
  // 如果拥有所有权限标识，则直接返回 true
  if (permissions.includes('*:*:*')) {
    return true
  }
  
  if (typeof permission === 'string') {
    return permissions.includes(permission)
  } else if (Array.isArray(permission)) {
    return permission.some(p => permissions.includes(p))
  }
  
  return false
}

export function hasRole(role) {
  const userStore = useUserStore()
  const { roles } = userStore
  
  if (!roles || roles.length === 0) {
    return false
  }
  
  if (typeof role === 'string') {
    return roles.includes(role)
  } else if (Array.isArray(role)) {
    return role.some(r => roles.includes(r))
  }
  
  return false
}
