<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/util/auth'
import { useUserStore } from '@/util/userStore'
import { usePermission } from '@/util/permission'
import axios from '@/util/axios'
import { ElContainer, ElHeader, ElAside, ElMain, ElMenu, ElMenuItem, ElSubMenu, ElMenuItemGroup, ElButton, ElDropdown, ElDropdownMenu, ElDropdownItem, ElAvatar, ElMessage } from 'element-plus'
import { Setting, User, Menu, UserFilled, Location, Money, DataLine, DataAnalysis, TrendCharts, Grid, Monitor, Document, Reading, Avatar } from '@element-plus/icons-vue'

const router = useRouter()
const { logout } = useAuth()
const { userInfo, loadUserInfo } = useUserStore()
const { loadPermissions, setPermissions, hasPermission } = usePermission()
const collapsed = ref(false)

// 菜单数据
const menus = ref([])

// 将扁平的菜单数据转换为树形结构
const buildMenuTree = (permissions) => {
  const menuMap = new Map()
  const rootMenus = []
  
  // 首先将所有菜单放入map中
  permissions.forEach(permission => {
    menuMap.set(permission.permissionId, {
      ...permission,
      children: []
    })
  })
  
  // 然后构建树形结构
  permissions.forEach(permission => {
    const menu = menuMap.get(permission.permissionId)
    if (permission.parentId === 0 || !permission.parentId) {
      // 根菜单
      rootMenus.push(menu)
    } else {
      // 子菜单
      const parentMenu = menuMap.get(permission.parentId)
      if (parentMenu) {
        parentMenu.children.push(menu)
      }
    }
  })
  
  return rootMenus
}

// 从后端获取菜单数据
const fetchMenus = async () => {
  try {
    // 获取用户信息
    const userInfoStr = localStorage.getItem('userInfo')
    if (!userInfoStr) {
      console.error('获取菜单数据失败: 用户未登录')
      return
    }
    
    const userInfo = JSON.parse(userInfoStr)
    const userId = userInfo.userId || 1 // 默认为1（超级管理员）
    
    // 使用新的菜单接口获取真正的菜单项
    const response = await axios.get(`/sys/user/menus?userId=${userId}`)
    console.log('获取菜单数据响应:', response)
    
    // 尝试从响应中获取数据
    let menuPermissions = []
    if (response && typeof response === 'object') {
      // 检查是否有data属性
      if (response.data) {
        menuPermissions = response.data
        console.log('从response.data获取数据:', menuPermissions)
      } else {
        // 如果没有data属性，尝试直接使用response
        menuPermissions = response
        console.log('直接使用response作为数据:', menuPermissions)
      }
    }
    
    // 检查menuPermissions是否为数组
    if (Array.isArray(menuPermissions)) {
      // 将扁平数据转换为树形结构
      const menuTree = buildMenuTree(menuPermissions)
      console.log('构建后的菜单树:', menuTree)
      
      // 转换权限数据为菜单格式
      menus.value = convertPermissionsToMenus(menuTree)
      console.log('转换后的菜单数据:', menus.value)
    } else {
      console.error('获取菜单数据失败: 数据格式错误', menuPermissions)
    }
  } catch (error) {
    console.error('获取菜单数据失败:', error)
  }
}

// 从后端获取用户权限
const fetchPermissions = async () => {
  try {
    // 获取用户信息
    const userInfoStr = localStorage.getItem('userInfo')
    if (!userInfoStr) {
      console.error('获取权限数据失败: 用户未登录')
      return
    }
    
    const userInfo = JSON.parse(userInfoStr)
    const userId = userInfo.userId || 1 // 默认为1（超级管理员）
    
    // 使用新的权限接口获取所有权限
    const response = await axios.get(`/sys/user/permissions?userId=${userId}`)
    console.log('获取权限数据响应:', response)
    
    // 尝试从响应中获取数据
    let permissions = []
    if (response && typeof response === 'object') {
      // 检查是否有data属性
      if (response.data) {
        permissions = response.data
        console.log('从response.data获取数据:', permissions)
      } else {
        // 如果没有data属性，尝试直接使用response
        permissions = response
        console.log('直接使用response作为数据:', permissions)
      }
    }
    
    // 检查permissions是否为数组
    if (Array.isArray(permissions)) {
      // 设置权限
      loadPermissions()
      setPermissions(permissions)
      console.log('更新后的权限数据:', permissions)
    } else {
      console.error('获取权限数据失败: 数据格式错误', permissions)
    }
  } catch (error) {
    console.error('获取权限数据失败:', error)
  }
}

// 将权限数据转换为菜单格式
const convertPermissionsToMenus = (permissions) => {
  return permissions.map(permission => {
    console.log('处理权限数据:', permission)
    
    // 适配不同的字段名称
    const menuId = permission.permissionId || permission.id || Math.random()
    const menuName = permission.permissionName || permission.name || '未知菜单'
    const menuCode = permission.permissionCode || permission.code || ''
    
    // 父菜单使用特殊的index格式，确保不会被当作路由路径
    const menu = {
      index: `menu-${menuId}`,
      title: menuName,
      iconName: getIconForMenu(menuName),
      children: []
    }
    
    // 处理子菜单
    const childPermissions = permission.children || []
    if (Array.isArray(childPermissions) && childPermissions.length > 0) {
      menu.children = childPermissions.map(subItem => {
        const childName = subItem.permissionName || subItem.name || '未知子菜单'
        const childCode = subItem.permissionCode || subItem.code || ''
        
        // 路径映射
        const routeMap = {
          '用户管理': 'user',
          '角色管理': 'role',
          '菜单管理': 'menu',
          '个人中心': 'personal'
        }
        
        let routePath = subItem.url || ''
        
        // 处理后端返回的完整路径
        if (routePath && routePath.startsWith('/')) {
          // 从完整路径中提取关键部分
          const pathParts = routePath.split('/').filter(Boolean)
          if (pathParts.length > 0) {
            // 尝试匹配路由配置中的路径
            const lastPart = pathParts[pathParts.length - 1]
            if (routeMap[childName]) {
              routePath = routeMap[childName]
            } else if (lastPart) {
              routePath = lastPart
            }
          }
        }
        
        // 使用路径映射
        routePath = routePath || routeMap[childName] || ''
        
        // 确保routePath是字符串且非空
        if (!routePath || typeof routePath !== 'string' || routePath === '' || !isNaN(Number(routePath))) {
          routePath = ''
        }
        
        return {
          index: routePath,
          title: childName,
          permission: childCode,
          iconName: getIconForMenu(childName)
        }
      })
      console.log('处理子菜单:', menu.children)
    }
    
    console.log('转换后的菜单:', menu)
    return menu
  })
}

// 根据菜单名称获取图标名称
const getIconForMenu = (menuName) => {
  const iconMap = {
    '系统管理': 'Setting',
    '用户管理': 'User',
    '角色管理': 'UserFilled',
    '菜单管理': 'Menu',
    '停车场管理': 'Location',
    '计费管理': 'Money',
    '报表统计': 'DataLine',
    '个人中心': 'User'
  }
  
  return iconMap[menuName] || 'Menu'
}

// 过滤后的菜单
const filteredMenus = computed(() => {
  return menus.value
    .filter(menu => menu && menu.index && menu.title)
    .map(menu => {
      const processedMenu = { ...menu }
      
      if (Array.isArray(menu.children)) {
        const filteredChildren = menu.children.filter(subItem => {
          return subItem && 
                 subItem.index && 
                 typeof subItem.index === 'string' && 
                 subItem.index !== '' && 
                 !isNaN(Number(subItem.index)) === false && 
                 subItem.title && 
                 (!subItem.permission || hasPermission(subItem.permission))
        })
        
        processedMenu.children = filteredChildren
      } else {
        processedMenu.children = []
      }
      
      return processedMenu
    })
    .filter(menu => {
      return !menu.permission || hasPermission(menu.permission) || (Array.isArray(menu.children) && menu.children.length > 0)
    })
})

const currentRoute = computed(() => {
  return router.currentRoute.value.path
})

const toggleSidebar = () => {
  collapsed.value = !collapsed.value
}

const handleLogout = () => {
  logout()
  router.push('/login')
  ElMessage.success('退出登录成功')
}

// 处理菜单项点击
const handleMenuItemClick = (menuItem) => {
  console.log('点击菜单项:', menuItem)
  console.log('路由路径:', menuItem.index)
  console.log('当前路由:', router.currentRoute.value.path)
  
  // 检查index是否是有效的路由路径
  const index = menuItem.index
  if (!index || typeof index !== 'string' || index === '' || !isNaN(Number(index))) {
    console.warn(`无效的路由路径: ${index}`)
    return
  }
  
  // 检查路由是否存在
  const routes = router.getRoutes()
  const routeExists = routes.some(route => route.path === '/' + index || route.path === index)
  console.log('路由是否存在:', routeExists, '所有路由:', routes)
  
  // 如果路由存在，跳转
  if (routeExists) {
    router.push('/' + index)
  } else {
    console.warn(`路由 ${index} 不存在`)
    // 可以跳转到404或默认页面
    // router.push('/404')
  }
}

// 处理菜单选择
const handleMenuSelect = (index) => {
  console.log('点击菜单:', index)
  if (index && typeof index === 'string' && index !== '' && isNaN(Number(index))) {
    router.push(index).catch(err => {
      console.error('路由跳转失败:', err)
    })
  } else {
    console.warn(`无效的路由路径: ${index}`)
  }
}
onMounted(() => {
  loadUserInfo()
  loadPermissions()
  fetchPermissions()
  fetchMenus()
  console.log('当前路由:', router.currentRoute.value)
  console.log('可用路由:', router.getRoutes().map(r => r.path))
})</script>

<template>
  <ElContainer class="app-container">
    <!-- 顶部导航栏 -->
    <ElHeader class="app-header">
      <div class="header-left">
        <ElButton 
          type="text" 
          @click="toggleSidebar" 
          class="sidebar-toggle"
        >
          <Menu />
        </ElButton>
        <div class="logo">智慧停车引导系统</div>
      </div>
      <div class="header-right">
        <ElDropdown trigger="click">
          <div class="user-info">
            <ElAvatar size="small" :src="''">{{ userInfo?.name?.charAt(0) || 'U' }}</ElAvatar>
            <span class="user-name">{{ userInfo?.name || '未登录' }}</span>
          </div>
          <template #dropdown>
            <ElDropdownMenu>
              <ElDropdownItem @click="router.push('/personal')">个人中心</ElDropdownItem>
              <ElDropdownItem divided @click="handleLogout">退出登录</ElDropdownItem>
            </ElDropdownMenu>
          </template>
        </ElDropdown>
      </div>
    </ElHeader>
    
    <ElContainer>
      <!-- 左侧菜单 -->
      <ElAside 
        :width="collapsed ? '64px' : '200px'" 
        class="app-sidebar"
        :class="{ 'collapsed': collapsed }"
      >
        <ElMenu
          :default-active="currentRoute"
          class="sidebar-menu"
          :collapse="collapsed"
          router
          unique-opened
          @select="handleMenuSelect"
        >
          <template v-for="menu in filteredMenus" :key="menu.index">
            <ElSubMenu :index="menu.index" v-if="Array.isArray(menu.children) && menu.children.length > 0">
              <template #title>
                <div style="width: 16px; height: 16px; margin-right: 8px; display: flex; align-items: center; justify-content: center;">
                  <component :is="menu.iconName" />
                </div>
                <span v-if="!collapsed">{{ menu.title }}</span>
              </template>
              <ElMenuItem 
                v-for="subItem in menu.children" 
                :key="subItem.index" 
                :index="subItem.index"
                v-if="subItem && subItem.index && subItem.title"
                @click="handleMenuItemClick(subItem)"
              >
                <div style="width: 16px; height: 16px; margin-right: 8px; display: flex; align-items: center; justify-content: center;">
                  <component :is="subItem.iconName || 'Menu'" />
                </div>
                <span>{{ subItem.title }}</span>
              </ElMenuItem>
            </ElSubMenu>
            <ElMenuItem v-else-if="menu.index && menu.title" :index="menu.index" @click="handleMenuItemClick(menu)">
              <div style="width: 16px; height: 16px; margin-right: 8px; display: flex; align-items: center; justify-content: center;">
                <component :is="menu.iconName" />
              </div>
              <span>{{ menu.title }}</span>
            </ElMenuItem>
          </template>
        </ElMenu>
      </ElAside>
      
      <!-- 主内容区 -->
      <ElMain class="app-main">
        <router-view></router-view>
      </ElMain>
    </ElContainer>
  </ElContainer>
</template>

<style scoped>
.app-container {
  height: 100vh;
  overflow: hidden;
}

.app-header {
  height: 60px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sidebar-toggle {
  font-size: 18px;
  color: #333;
}

.logo {
  font-size: 18px;
  font-weight: bold;
  color: #667eea;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f0f0f0;
}

.user-name {
  font-size: 14px;
  color: #333;
}

.app-sidebar {
  background-color: #f5f7fa;
  border-right: 1px solid #e4e7ed;
  transition: width 0.3s;
}

.app-sidebar.collapsed {
  width: 64px !important;
}

.sidebar-menu {
  height: 100%;
  border-right: none;
}

/* 调整菜单图标大小 */
.sidebar-menu :deep(.el-menu-item),
.sidebar-menu :deep(.el-sub-menu__title) {
  display: flex;
  align-items: center;
}

.sidebar-menu :deep(.el-menu-item .el-icon),
.sidebar-menu :deep(.el-sub-menu__title .el-icon) {
  font-size: 16px !important;
  width: 16px !important;
  height: 16px !important;
  margin-right: 8px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.sidebar-menu :deep(.el-menu-item svg),
.sidebar-menu :deep(.el-sub-menu__title svg) {
  width: 16px !important;
  height: 16px !important;
  margin-right: 8px !important;
  min-width: 16px !important;
  min-height: 16px !important;
  max-width: 16px !important;
  max-height: 16px !important;
}

/* 折叠状态下的图标 */
.sidebar-menu.collapse :deep(.el-menu-item .el-icon),
.sidebar-menu.collapse :deep(.el-sub-menu__title .el-icon) {
  margin-right: 0 !important;
}

.sidebar-menu.collapse :deep(.el-menu-item svg),
.sidebar-menu.collapse :deep(.el-sub-menu__title svg) {
  margin-right: 0 !important;
}

.app-main {
  padding: 20px;
  overflow-y: auto;
  background-color: #f0f2f5;
}

/* 确保菜单项可点击 */
.sidebar-menu :deep(.el-menu-item) {
  cursor: pointer !important;
  position: relative !important;
  z-index: 1 !important;
}

/* 调试用：高亮显示可点击区域 */
.sidebar-menu :deep(.el-menu-item):hover {
  background-color: #ecf5ff !important;
  outline: 2px solid #409eff !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-sidebar {
    position: fixed;
    left: 0;
    top: 60px;
    height: calc(100vh - 60px);
    z-index: 99;
  }
  
  .logo {
    font-size: 16px;
  }
  
  .user-name {
    display: none;
  }
}
</style>