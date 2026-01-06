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
const { loadPermissions, hasPermission } = usePermission()
const collapsed = ref(false)

// 菜单数据
const menus = ref([])

// 从后端获取菜单数据
const fetchMenus = async () => {
  try {
    // 使用权限接口获取菜单数据
    const response = await axios.get('/sys/permission/tree')
    console.log('获取菜单数据响应:', response)
    
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
      // 转换权限数据为菜单格式
      menus.value = convertPermissionsToMenus(permissions)
      console.log('转换后的菜单数据:', menus.value)
    } else {
      console.error('获取菜单数据失败: 数据格式错误', permissions)
      // 数据格式错误时使用默认菜单
      menus.value = getDefaultMenus()
      console.log('使用默认菜单:', menus.value)
    }
  } catch (error) {
    console.error('获取菜单数据失败:', error)
    // 失败时使用默认菜单
    menus.value = getDefaultMenus()
    console.log('发生错误，使用默认菜单:', menus.value)
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
    
    const menu = {
      index: menuId.toString(),
      title: menuName,
      icon: getIconForMenu(menuName),
      children: []
    }
    
    // 处理子菜单
    const childPermissions = permission.children || []
    if (Array.isArray(childPermissions) && childPermissions.length > 0) {
      menu.children = childPermissions.map(child => {
        const childName = child.permissionName || child.name || '未知子菜单'
        const childCode = child.permissionCode || child.code || ''
        
        return {
          index: childCode.split(':')[0] || Math.random().toString(),
          title: childName,
          permission: childCode
        }
      })
      console.log('处理子菜单:', menu.children)
    }
    
    console.log('转换后的菜单:', menu)
    return menu
  })
}

// 根据菜单名称获取图标
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

// 默认菜单（当后端获取失败时使用）
const getDefaultMenus = () => {
  return [
    {
      index: '1',
      title: '系统管理',
      icon: 'Setting',
      children: [
        { index: 'user', title: '用户管理', permission: 'user:list' },
        { index: 'role', title: '角色管理', permission: 'role:list' },
        { index: 'menu', title: '菜单管理', permission: 'menu:list' }
      ]
    },
    {
      index: '2',
      title: '个人中心',
      icon: 'User',
      children: [
        { index: 'personal', title: '个人信息' }
      ]
    }
  ]
}

// 过滤后的菜单
const filteredMenus = computed(() => {
  return menus.value.map(menu => {
    if (menu.children && menu.children.length > 0) {
      const filteredChildren = menu.children.filter(child => {
        return !child.permission || hasPermission(child.permission)
      })
      
      return {
        ...menu,
        children: filteredChildren
      }
    }
    return menu
  }).filter(menu => {
    return !menu.permission || hasPermission(menu.permission) || (menu.children && menu.children.length > 0)
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

onMounted(() => {
  loadUserInfo()
  loadPermissions()
  fetchMenus()
})
</script>

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
          :router="true"
          unique-opened
        >
          <template v-for="menu in filteredMenus" :key="menu.index">
            <ElSubMenu :index="menu.index" v-if="menu.children && menu.children.length">
              <template #title>
                <component :is="menu.icon === 'Setting' ? Setting : User" />
                <span v-if="!collapsed">{{ menu.title }}</span>
              </template>
              <ElMenuItem 
                v-for="child in menu.children" 
                :key="child.index" 
                :index="child.index"
              >
                <span>{{ child.title }}</span>
              </ElMenuItem>
            </ElSubMenu>
            <ElMenuItem v-else :index="menu.index">
              <component :is="menu.icon === 'Setting' ? Setting : User" />
              <span>{{ menu.title }}</span>
            </ElMenuItem>
          </template>
        </ElMenu>
      </ElAside>
      
      <!-- 主内容区 -->
      <ElMain class="app-main">
        <slot></slot>
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

.app-main {
  padding: 20px;
  overflow-y: auto;
  background-color: #f0f2f5;
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