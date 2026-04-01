import { useUserStore } from '@/stores/user'

export function hasPermission(permission) {
  const userStore = useUserStore()
  const { permissions, user, roles } = userStore
  
  // 超级管理员拥有所有权限，但要防止新注册的普通用户意外被当成 ADMIN
  // 严格检查角色标识（后端返回的角色编码通常是大写或小写）
  if (roles && (roles.includes('SUPER_ADMIN') || roles.includes('admin') || roles.includes('ADMIN'))) {
    return true
  }
  
  // 仅依靠 userType='ADMIN' 是不安全的，因为新用户可能有默认值或被篡改，注释掉该逻辑
  // if (user?.userType === 'ADMIN') { return true }
  
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
