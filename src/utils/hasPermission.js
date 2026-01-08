import { useUserStore } from '@/stores/user'

export function hasPermission(permission) {
  const userStore = useUserStore()
  const { permissions } = userStore
  
  if (!permissions || permissions.length === 0) {
    return false
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
