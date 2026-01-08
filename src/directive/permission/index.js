import { hasPermission } from '@/utils/hasPermission'

const permission = {
  mounted(el, binding) {
    const { value } = binding
    if (!value) {
      throw new Error('v-permission 需要传入权限值')
    }
    if (!hasPermission(value)) {
      el.parentNode && el.parentNode.removeChild(el)
    }
  },
  updated(el, binding) {
    const { value } = binding
    if (!value) {
      throw new Error('v-permission 需要传入权限值')
    }
    if (!hasPermission(value)) {
      el.parentNode && el.parentNode.removeChild(el)
    }
  }
}

export default permission
