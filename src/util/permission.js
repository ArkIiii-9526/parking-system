import { ref } from 'vue'

export function usePermission() {
  const permissions = ref([])

  const loadPermissions = () => {
    const storedPermissions = localStorage.getItem('permissions')
    if (storedPermissions) {
      permissions.value = JSON.parse(storedPermissions)
    }
    
    // 检查是否为超级管理员
    const userInfo = localStorage.getItem('userInfo')
    if (userInfo) {
      const parsedUserInfo = JSON.parse(userInfo)
      if (parsedUserInfo.username === 'admin') {
        // 为超级管理员添加所有权限
        permissions.value = [
          'user:list', 'user:add', 'user:edit', 'user:delete', 'user:assignRole',
          'role:list', 'role:add', 'role:edit', 'role:delete', 'role:assignPermission',
          'menu:list', 'menu:add', 'menu:edit', 'menu:delete'
        ]
        localStorage.setItem('permissions', JSON.stringify(permissions.value))
      }
    }
  }

  const setPermissions = (newPermissions) => {
    permissions.value = newPermissions
    localStorage.setItem('permissions', JSON.stringify(newPermissions))
  }

  const hasPermission = (permission) => {
    // 检查是否为超级管理员
    const userInfo = localStorage.getItem('userInfo')
    if (userInfo) {
      const parsedUserInfo = JSON.parse(userInfo)
      if (parsedUserInfo.username === 'admin') {
        return true
      }
    }
    return permissions.value.includes(permission)
  }

  const hasAnyPermission = (permissionList) => {
    // 检查是否为超级管理员
    const userInfo = localStorage.getItem('userInfo')
    if (userInfo) {
      const parsedUserInfo = JSON.parse(userInfo)
      if (parsedUserInfo.username === 'admin') {
        return true
      }
    }
    return permissionList.some(permission => permissions.value.includes(permission))
  }

  const clearPermissions = () => {
    permissions.value = []
    localStorage.removeItem('permissions')
  }

  return {
    permissions,
    loadPermissions,
    setPermissions,
    hasPermission,
    hasAnyPermission,
    clearPermissions
  }
}