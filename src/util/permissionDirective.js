import { usePermission } from './permission'

// 按钮权限控制指令
export function setupPermissionDirective(app) {
  app.directive('permission', {
    mounted(el, binding) {
      const { hasPermission } = usePermission()
      const { value } = binding
      
      if (value && typeof value === 'string') {
        if (!hasPermission(value)) {
          el.style.display = 'none'
        }
      } else if (value && Array.isArray(value)) {
        const hasAnyPermission = value.some(permission => hasPermission(permission))
        if (!hasAnyPermission) {
          el.style.display = 'none'
        }
      }
    }
  })
}