import { useRouter, useRoute } from 'vue-router'

// 动态路由生成函数
export function generateRoutes(menus) {
  const routes = []
  
  // 递归处理菜单数据
  const processMenu = (menuList, parentPath = '') => {
    for (const menu of menuList) {
      const route = {
        path: menu.path,
        name: menu.path.replace('/', ''),
        component: () => import(`@/views${menu.path}/index.vue`),
        meta: {
          title: menu.label,
          icon: menu.icon,
          requiresAuth: true
        }
      }
      
      if (menu.children && menu.children.length > 0) {
        route.children = processMenu(menu.children, menu.path)
      }
      
      routes.push(route)
    }
    
    return routes
  }
  
  return processMenu(menus)
}

// 路由权限检查
export function checkRoutePermission(route, permissions) {
  if (!route.meta || !route.meta.permission) {
    return true
  }
  
  return permissions.includes(route.meta.permission)
}