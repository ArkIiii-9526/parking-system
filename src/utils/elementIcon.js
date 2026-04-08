import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const ICON_ALIAS_MAP = {
  Truck: 'Van'
}

export function hasElementIcon(iconName) {
  return Boolean(iconName && ElementPlusIconsVue[iconName])
}

export function resolveElementIcon(iconName, fallback = 'Menu') {
  const normalizedIconName = ICON_ALIAS_MAP[iconName] || iconName

  if (normalizedIconName && ElementPlusIconsVue[normalizedIconName]) {
    return ElementPlusIconsVue[normalizedIconName]
  }

  return ElementPlusIconsVue[fallback] || null
}
