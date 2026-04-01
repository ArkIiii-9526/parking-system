<template>
  <aside class="sidebar" :class="{ 'is-collapsed': isCollapse }">
    <!-- Logo区域 -->
    <div class="sidebar-header">
      <div class="logo-wrapper">
        <div class="logo-icon">
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="sidebarLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#6366F1"/>
                <stop offset="50%" style="stop-color:#10B981"/>
                <stop offset="100%" style="stop-color:#F43F5E"/>
              </linearGradient>
            </defs>
            <rect x="8" y="20" width="48" height="32" rx="4" stroke="url(#sidebarLogoGradient)" stroke-width="3" fill="none"/>
            <circle cx="20" cy="36" r="4" fill="url(#sidebarLogoGradient)"/>
            <circle cx="32" cy="36" r="4" fill="url(#sidebarLogoGradient)"/>
            <circle cx="44" cy="36" r="4" fill="url(#sidebarLogoGradient)"/>
            <path d="M16 20V14C16 11.7909 17.7909 10 20 10H44C46.2091 10 48 11.7909 48 14V20" stroke="url(#sidebarLogoGradient)" stroke-width="3" stroke-linecap="round"/>
          </svg>
        </div>
        <span v-if="!isCollapse" class="logo-text">智慧停车</span>
      </div>
      <button class="collapse-btn" @click="toggleCollapse" :title="isCollapse ? '展开菜单' : '收起菜单'">
        <el-icon>
          <component :is="isCollapse ? 'Expand' : 'Fold'" />
        </el-icon>
      </button>
    </div>

    <!-- 菜单区域 -->
    <div class="sidebar-body">
      <el-scrollbar>
        <nav class="menu-nav">
          <template v-for="route in menuRoutes" :key="route.path">
            <template v-if="!route.hidden">
              <!-- 单级菜单 -->
              <router-link
                v-if="!route.children || route.children.length === 1"
                :to="route.path.startsWith('/') ? route.path : `/${route.path}`"
                class="menu-item"
                :class="{ 'is-active': activeMenu === (route.path.startsWith('/') ? route.path : `/${route.path}`) }"
              >
                <span class="menu-icon">
                  <el-icon v-if="route.meta?.icon">
                    <component :is="route.meta.icon" />
                  </el-icon>
                </span>
                <span v-if="!isCollapse" class="menu-title">{{ route.meta?.title }}</span>
                <div v-if="!isCollapse" class="menu-glow"></div>
              </router-link>

              <!-- 多级菜单 -->
              <div
                v-else
                class="menu-group"
                :class="{ 'is-expanded': expandedMenus.includes(route.path) }"
              >
                <button
                  class="menu-item menu-trigger"
                  @click="toggleMenu(route.path)"
                >
                  <span class="menu-icon">
                    <el-icon v-if="route.meta?.icon">
                      <component :is="route.meta.icon" />
                    </el-icon>
                  </span>
                  <span v-if="!isCollapse" class="menu-title">{{ route.meta?.title }}</span>
                  <el-icon v-if="!isCollapse" class="menu-arrow">
                    <ArrowDown />
                  </el-icon>
                </button>
                <transition name="slide">
                  <div v-show="!isCollapse && expandedMenus.includes(route.path)" class="submenu">
                    <router-link
                      v-for="child in route.children"
                      :key="child.path"
                      :to="resolvePath(route.path, child.path)"
                      class="submenu-item"
                      :class="{ 'is-active': activeMenu === resolvePath(route.path, child.path) }"
                    >
                      <span class="submenu-dot"></span>
                      <span class="submenu-title">{{ child.meta?.title }}</span>
                    </router-link>
                  </div>
                </transition>
              </div>
            </template>
          </template>
        </nav>
      </el-scrollbar>
    </div>

    <!-- 底部区域 -->
    <div class="sidebar-footer">
      <div class="user-mini" v-if="!isCollapse">
        <el-avatar :size="36" :src="userStore.avatar" class="user-avatar">
          <el-icon><User /></el-icon>
        </el-avatar>
        <div class="user-info">
          <span class="user-name">{{ userStore.userName }}</span>
          <span class="user-role">管理员</span>
        </div>
      </div>
      <button v-else class="footer-btn" @click="handleLogout">
        <el-icon><SwitchButton /></el-icon>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)
const menuRoutes = ref([])
const expandedMenus = ref([])

const activeMenu = computed(() => {
  const { meta, path } = route
  if (meta?.activeMenu) {
    return meta.activeMenu
  }
  return path
})

function resolvePath(basePath, path) {
  if (path.startsWith('/')) {
    return path
  }
  const absoluteBasePath = basePath.startsWith('/') ? basePath : `/${basePath}`
  return `${absoluteBasePath}/${path}`
}

function updateMenus() {
  // 使用从后端获取的菜单数据
  if (userStore.menus && userStore.menus.length > 0) {
    menuRoutes.value = userStore.menus
  } else {
    // 如果没有获取到菜单，只显示默认基础菜单，不能回退到所有路由
    menuRoutes.value = [
      {
        path: 'dashboard',
        name: 'Dashboard',
        meta: { title: '首页', icon: 'Odometer' }
      }
    ]
  }
}

function toggleCollapse() {
  isCollapse.value = !isCollapse.value
  emit('collapse', isCollapse.value)
}

function toggleMenu(path) {
  // 我们想要手风琴效果（每次只展开一个），当点击一个菜单时，我们可以关闭其他菜单
  const index = expandedMenus.value.indexOf(path)
  if (index > -1) {
    // 如果已经展开，则将其移除
    expandedMenus.value.splice(index, 1)
  } else {
    // 手风琴效果（每次只展开一个）
    expandedMenus.value = []
    
    expandedMenus.value.push(path)
  }
}

function handleLogout() {
  userStore.logout()
}

onMounted(() => {
  updateMenus()
})

watch(() => userStore.menus, () => {
  updateMenus()
}, { deep: true })

const emit = defineEmits(['collapse'])
</script>

<style lang="scss" scoped>
.sidebar {
  width: var(--sidebar-width);
  height: 100vh;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: fixed;
  left: 0;
  top: 0;
  z-index: var(--z-fixed);
  
  &.is-collapsed {
    width: var(--sidebar-collapsed);
    
    .sidebar-header {
      padding: var(--space-4);
      
      .logo-wrapper {
        justify-content: center;
      }
      
      .collapse-btn {
        position: absolute;
        right: -12px;
        top: 50%;
        transform: translateY(-50%);
      }
    }
  }
}

// 头部区域
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) var(--space-5) var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
  position: relative;
  
  .logo-wrapper {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    
    .logo-icon {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      
      svg {
        width: 100%;
        height: 100%;
      }
    }
    
    .logo-text {
      font-family: var(--font-display);
      font-size: var(--text-xl);
      font-weight: var(--font-bold);
      background: linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      white-space: nowrap;
    }
  }
  
  .collapse-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-md);
    color: var(--text-tertiary);
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      color: var(--text-primary);
    }
    
    .el-icon {
      font-size: 14px;
    }
  }
}

// 菜单区域
.sidebar-body {
  flex: 1;
  overflow: hidden;
  padding: var(--space-3);
}

.menu-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  color: var(--text-tertiary);
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  background: transparent;
  border: none;
  width: 100%;
  font-size: var(--text-sm);
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-primary);
  }
  
  &.is-active {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.1));
    color: var(--text-primary);
    
    .menu-icon {
      color: var(--primary-400);
    }
    
    .menu-glow {
      opacity: 1;
    }
  }
  
  .menu-icon {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
    transition: color 0.3s ease;
  }
  
  .menu-title {
    flex: 1;
    font-weight: var(--font-medium);
    white-space: nowrap;
    text-align: left;
  }
  
  .menu-glow {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 20px;
    background: linear-gradient(180deg, var(--primary-400), var(--secondary-400));
    border-radius: var(--radius-full);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
}

// 菜单组
.menu-group {
  .menu-trigger {
    .menu-arrow {
      font-size: 12px;
      transition: transform 0.3s ease;
    }
  }
  
  &.is-expanded {
    .menu-trigger {
      background: rgba(255, 255, 255, 0.03);
      
      .menu-arrow {
        transform: rotate(180deg);
      }
    }
  }
}

// 子菜单
.submenu {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-2) 0 var(--space-2) 44px;
  
  .submenu-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
    color: var(--text-muted);
    text-decoration: none;
    font-size: var(--text-sm);
    transition: all 0.3s ease;
    position: relative;
    
    &:hover {
      color: var(--text-secondary);
      
      .submenu-dot {
        background: var(--primary-400);
        transform: scale(1.2);
      }
    }
    
    &.is-active {
      color: var(--primary-400);
      background: rgba(99, 102, 241, 0.1);
      
      .submenu-dot {
        background: var(--primary-400);
        transform: scale(1.2);
      }
    }
    
    .submenu-dot {
      width: 6px;
      height: 6px;
      background: var(--text-muted);
      border-radius: 50%;
      transition: all 0.3s ease;
    }
    
    .submenu-title {
      white-space: nowrap;
    }
  }
}

// 子菜单动画
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  opacity: 1;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

// 底部区域
.sidebar-footer {
  padding: var(--space-4);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  
  .user-mini {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2);
    background: rgba(255, 255, 255, 0.03);
    border-radius: var(--radius-lg);
    
    .user-avatar {
      border: 2px solid rgba(255, 255, 255, 0.1);
    }
    
    .user-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      
      .user-name {
        font-size: var(--text-sm);
        font-weight: var(--font-medium);
        color: var(--text-primary);
      }
      
      .user-role {
        font-size: var(--text-xs);
        color: var(--text-muted);
      }
    }
  }
  
  .footer-btn {
    width: 100%;
    padding: var(--space-3);
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-lg);
    color: var(--text-tertiary);
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(244, 63, 94, 0.1);
      border-color: rgba(244, 63, 94, 0.3);
      color: var(--accent-400);
    }
  }
}

// 响应式
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    
    &.is-open {
      transform: translateX(0);
    }
  }
}
</style>
