import { hasPermission } from '@/utils/hasPermission'

const permission = {
  mounted(el, binding) {
    const { value } = binding
    if (!value) {
      throw new Error('v-permission 需要传入权限值')
    }
    if (!hasPermission(value)) {
      // Create a comment node to replace the element
      // This is safer than just removing it for Vue's VDOM
      const comment = document.createComment(' v-permission ')
      if (el.parentNode) {
        el.parentNode.replaceChild(comment, el)
      }
    }
  },
  updated(el, binding) {
    // Note: this hook might not be called if the element is replaced
    // In Vue 3, directives on removed elements won't trigger updates
  }
}

export default permission
